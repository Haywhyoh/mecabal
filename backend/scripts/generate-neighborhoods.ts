#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleMapsService } from '../libs/common/src/services/google-maps.service';
import { State, LocalGovernmentArea, Ward, Neighborhood, Landmark, NeighborhoodType, LandmarkType, LandmarkVerificationStatus } from '../libs/database/src/entities';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

interface NeighborhoodData {
  name: string;
  type: NeighborhoodType;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  boundaries?: any; // GeoJSON polygon
  isGated: boolean;
  requiresVerification: boolean;
  landmarks: Array<{
    name: string;
    type: LandmarkType;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    address?: string;
  }>;
}

interface GenerationOptions {
  lga?: string;
  state?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  output?: string;
  insert?: boolean;
}

class NeighborhoodGenerator {
  private googleMapsService: GoogleMapsService;
  private stateRepository: Repository<State>;
  private lgaRepository: Repository<LocalGovernmentArea>;
  private wardRepository: Repository<Ward>;
  private neighborhoodRepository: Repository<Neighborhood>;
  private landmarkRepository: Repository<Landmark>;

  constructor(
    googleMapsService: GoogleMapsService,
    stateRepository: Repository<State>,
    lgaRepository: Repository<LocalGovernmentArea>,
    wardRepository: Repository<Ward>,
    neighborhoodRepository: Repository<Neighborhood>,
    landmarkRepository: Repository<Landmark>
  ) {
    this.googleMapsService = googleMapsService;
    this.stateRepository = stateRepository;
    this.lgaRepository = lgaRepository;
    this.wardRepository = wardRepository;
    this.neighborhoodRepository = neighborhoodRepository;
    this.landmarkRepository = landmarkRepository;
  }

  async generateNeighborhoods(options: GenerationOptions): Promise<NeighborhoodData[]> {
    console.log('Starting neighborhood generation...');
    console.log('Options:', options);

    let searchCoordinates: { lat: number; lng: number };
    let lga: LocalGovernmentArea | null = null;

    if (options.lat && options.lng) {
      searchCoordinates = { lat: options.lat, lng: options.lng };
    } else if (options.lga) {
      lga = await this.findLGA(options.lga, options.state);
      if (!lga) {
        throw new Error(`LGA not found: ${options.lga}`);
      }
      // Use a default coordinate for the LGA (this would ideally be the LGA center)
      searchCoordinates = { lat: 6.5244, lng: 3.3792 }; // Lagos center as fallback
    } else {
      throw new Error('Either coordinates or LGA name must be provided');
    }

    const radius = options.radius || 5000; // 5km default radius
    const neighborhoods: NeighborhoodData[] = [];

    try {
      // Search for estates and communities
      const estates = await this.googleMapsService.searchEstates(
        'residential estate community',
        searchCoordinates.lat,
        searchCoordinates.lng,
        radius
      );

      console.log(`Found ${estates.length} potential neighborhoods`);

      for (const estate of estates) {
        try {
          // Get detailed information about the place
          const details = await this.googleMapsService.getPlaceDetails(estate.placeId);
          if (!details) continue;

          // Determine neighborhood type
          const type = this.determineNeighborhoodType(details.name, details.types);

          // Check if it's gated (based on name patterns)
          const isGated = this.isGatedCommunity(details.name);

          // Find nearby landmarks
          const landmarks = await this.findNearbyLandmarks(
            details.coordinates.latitude,
            details.coordinates.longitude
          );

          // Generate approximate boundary (circular for now)
          const boundaries = this.generateCircularBoundary(
            details.coordinates.latitude,
            details.coordinates.longitude,
            500 // 500m radius
          );

          const neighborhoodData: NeighborhoodData = {
            name: details.name,
            type,
            coordinates: details.coordinates,
            boundaries,
            isGated,
            requiresVerification: isGated,
            landmarks,
          };

          neighborhoods.push(neighborhoodData);

          // Add delay to respect rate limits
          await this.delay(100);
        } catch (error) {
          console.warn(`Error processing estate ${estate.name}:`, error.message);
        }
      }

      console.log(`Generated ${neighborhoods.length} neighborhoods`);

      // Save to file if output specified
      if (options.output) {
        await this.saveToFile(neighborhoods, options.output);
      }

      // Insert to database if requested
      if (options.insert && lga) {
        await this.insertToDatabase(neighborhoods, lga);
      }

      return neighborhoods;
    } catch (error) {
      console.error('Error generating neighborhoods:', error);
      throw error;
    }
  }

  private async findLGA(lgaName: string, stateName?: string): Promise<LocalGovernmentArea | null> {
    const query = this.lgaRepository.createQueryBuilder('lga')
      .leftJoinAndSelect('lga.state', 'state')
      .where('LOWER(lga.name) LIKE LOWER(:name)', { name: `%${lgaName}%` });

    if (stateName) {
      query.andWhere('LOWER(state.name) LIKE LOWER(:stateName)', { stateName: `%${stateName}%` });
    }

    return query.getOne();
  }

  private determineNeighborhoodType(name: string, types: string[]): NeighborhoodType {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('estate') || nameLower.includes('garden') || nameLower.includes('village')) {
      return NeighborhoodType.ESTATE;
    }
    
    if (nameLower.includes('community') || nameLower.includes('quarters') || nameLower.includes('ward')) {
      return NeighborhoodType.COMMUNITY;
    }
    
    return NeighborhoodType.AREA;
  }

  private isGatedCommunity(name: string): boolean {
    const nameLower = name.toLowerCase();
    const gatedKeywords = ['estate', 'garden', 'village', 'gated', 'residential', 'phase'];
    return gatedKeywords.some(keyword => nameLower.includes(keyword));
  }

  private async findNearbyLandmarks(
    latitude: number,
    longitude: number
  ): Promise<Array<{
    name: string;
    type: LandmarkType;
    coordinates: { latitude: number; longitude: number };
    address?: string;
  }>> {
    const landmarkTypes = ['market', 'school', 'hospital', 'mosque', 'church', 'park', 'bank'];
    const places = await this.googleMapsService.searchLandmarks(
      latitude,
      longitude,
      landmarkTypes,
      1000 // 1km radius
    );

    return places.slice(0, 5).map(place => ({
      name: place.name,
      type: this.mapGoogleTypeToLandmarkType(place.types),
      coordinates: place.coordinates,
      address: place.address,
    }));
  }

  private mapGoogleTypeToLandmarkType(types: string[]): LandmarkType {
    const typeMapping: { [key: string]: LandmarkType } = {
      'market': LandmarkType.MARKET,
      'school': LandmarkType.SCHOOL,
      'hospital': LandmarkType.HOSPITAL,
      'mosque': LandmarkType.MOSQUE,
      'church': LandmarkType.CHURCH,
      'park': LandmarkType.PARK,
      'bank': LandmarkType.OTHER,
      'gas_station': LandmarkType.OTHER,
      'restaurant': LandmarkType.OTHER,
    };

    for (const type of types) {
      if (typeMapping[type]) {
        return typeMapping[type];
      }
    }

    return LandmarkType.OTHER;
  }

  private generateCircularBoundary(
    latitude: number,
    longitude: number,
    radiusMeters: number
  ): any {
    // Generate a simple circular boundary (16-sided polygon)
    const points = [];
    const earthRadius = 6371000; // Earth's radius in meters
    const angularDistance = radiusMeters / earthRadius;

    for (let i = 0; i < 16; i++) {
      const angle = (i * 2 * Math.PI) / 16;
      const lat = latitude + (angularDistance * Math.cos(angle)) * (180 / Math.PI);
      const lng = longitude + (angularDistance * Math.sin(angle)) * (180 / Math.PI) / Math.cos(latitude * Math.PI / 180);
      
      points.push([lng, lat]);
    }

    // Close the polygon
    points.push(points[0]);

    return {
      type: 'Polygon',
      coordinates: [points],
    };
  }

  private async saveToFile(neighborhoods: NeighborhoodData[], outputPath: string): Promise<void> {
    const fullPath = path.resolve(outputPath);
    const data = {
      generatedAt: new Date().toISOString(),
      count: neighborhoods.length,
      neighborhoods,
    };

    await fs.promises.writeFile(fullPath, JSON.stringify(data, null, 2));
    console.log(`Saved ${neighborhoods.length} neighborhoods to ${fullPath}`);
  }

  private async insertToDatabase(neighborhoods: NeighborhoodData[], lga: LocalGovernmentArea): Promise<void> {
    console.log(`Inserting ${neighborhoods.length} neighborhoods to database...`);

    // Find or create a default ward for this LGA
    let ward = await this.wardRepository.findOne({
      where: { lgaId: lga.id },
    });

    if (!ward) {
      ward = this.wardRepository.create({
        name: `${lga.name} Ward 1`,
        code: `${lga.code}01`,
        lgaId: lga.id,
      });
      await this.wardRepository.save(ward);
    }

    for (const neighborhoodData of neighborhoods) {
      try {
        const neighborhood = this.neighborhoodRepository.create({
          name: neighborhoodData.name,
          type: neighborhoodData.type,
          lgaId: lga.id,
          wardId: ward.id,
          boundaries: neighborhoodData.boundaries,
          isGated: neighborhoodData.isGated,
          requiresVerification: neighborhoodData.requiresVerification,
        });

        const savedNeighborhood = await this.neighborhoodRepository.save(neighborhood);

        // Create landmarks
        for (const landmarkData of neighborhoodData.landmarks) {
          const landmark = this.landmarkRepository.create({
            name: landmarkData.name,
            type: landmarkData.type,
            neighborhoodId: savedNeighborhood.id,
            location: {
              type: 'Point',
              coordinates: [landmarkData.coordinates.longitude, landmarkData.coordinates.latitude],
            },
            address: landmarkData.address,
            verificationStatus: LandmarkVerificationStatus.VERIFIED,
          });

          await this.landmarkRepository.save(landmark);
        }

        console.log(`Inserted neighborhood: ${neighborhoodData.name}`);
      } catch (error) {
        console.warn(`Error inserting neighborhood ${neighborhoodData.name}:`, error.message);
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  const args = process.argv.slice(2);
  const options: GenerationOptions = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      const value = args[i + 1];
      
      switch (key) {
        case 'lga':
          options.lga = value;
          break;
        case 'state':
          options.state = value;
          break;
        case 'lat':
          options.lat = parseFloat(value);
          break;
        case 'lng':
          options.lng = parseFloat(value);
          break;
        case 'radius':
          options.radius = parseInt(value);
          break;
        case 'output':
          options.output = value;
          break;
        case 'insert':
          options.insert = true;
          i--; // Don't skip next argument
          break;
      }
      i++; // Skip the value
    }
  }

  if (!options.lga && !options.lat) {
    console.error('Usage: npm run script:generate-neighborhoods -- --lga="Alimosho" [--state="Lagos"] [--output="neighborhoods.json"] [--insert]');
    console.error('   or: npm run script:generate-neighborhoods -- --lat=6.5244 --lng=3.3792 [--radius=5000] [--output="neighborhoods.json"] [--insert]');
    process.exit(1);
  }

  try {
    // Create a minimal NestJS application context
    const app = await NestFactory.createApplicationContext(
      {
        module: class AppModule {
          static forRoot() {
            return {
              module: class {},
              imports: [
                ConfigModule.forRoot({
                  isGlobal: true,
                }),
                TypeOrmModule.forRoot({
                  type: 'postgres',
                  host: process.env.DATABASE_HOST || 'localhost',
                  port: parseInt(process.env.DATABASE_PORT || '5432'),
                  username: process.env.DATABASE_USERNAME || 'MeCabal_user',
                  password: process.env.DATABASE_PASSWORD || 'MeCabal_password',
                  database: process.env.DATABASE_NAME || 'MeCabal_dev',
                  entities: [State, LocalGovernmentArea, Ward, Neighborhood, Landmark],
                  synchronize: false,
                }),
                TypeOrmModule.forFeature([State, LocalGovernmentArea, Ward, Neighborhood, Landmark]),
              ],
              providers: [GoogleMapsService],
            };
          }
        }
      }
    );

    const googleMapsService = app.get(GoogleMapsService);
    const stateRepository = app.get('StateRepository');
    const lgaRepository = app.get('LocalGovernmentAreaRepository');
    const wardRepository = app.get('WardRepository');
    const neighborhoodRepository = app.get('NeighborhoodRepository');
    const landmarkRepository = app.get('LandmarkRepository');

    const generator = new NeighborhoodGenerator(
      googleMapsService,
      stateRepository,
      lgaRepository,
      wardRepository,
      neighborhoodRepository,
      landmarkRepository
    );

    await generator.generateNeighborhoods(options);
    console.log('Neighborhood generation completed successfully!');
    
    await app.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
