import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { State, LocalGovernmentArea, Ward, Neighborhood, Landmark, LandmarkVerificationStatus } from '../entities';

// Nigerian States Data
export const NIGERIAN_STATES_DATA = [
  { name: 'Abia', code: 'AB' },
  { name: 'Adamawa', code: 'AD' },
  { name: 'Akwa Ibom', code: 'AK' },
  { name: 'Anambra', code: 'AN' },
  { name: 'Bauchi', code: 'BA' },
  { name: 'Bayelsa', code: 'BY' },
  { name: 'Benue', code: 'BE' },
  { name: 'Borno', code: 'BO' },
  { name: 'Cross River', code: 'CR' },
  { name: 'Delta', code: 'DE' },
  { name: 'Ebonyi', code: 'EB' },
  { name: 'Edo', code: 'ED' },
  { name: 'Ekiti', code: 'EK' },
  { name: 'Enugu', code: 'EN' },
  { name: 'FCT', code: 'FC' },
  { name: 'Gombe', code: 'GO' },
  { name: 'Imo', code: 'IM' },
  { name: 'Jigawa', code: 'JI' },
  { name: 'Kaduna', code: 'KD' },
  { name: 'Kano', code: 'KN' },
  { name: 'Katsina', code: 'KT' },
  { name: 'Kebbi', code: 'KE' },
  { name: 'Kogi', code: 'KO' },
  { name: 'Kwara', code: 'KW' },
  { name: 'Lagos', code: 'LA' },
  { name: 'Nasarawa', code: 'NA' },
  { name: 'Niger', code: 'NI' },
  { name: 'Ogun', code: 'OG' },
  { name: 'Ondo', code: 'ON' },
  { name: 'Osun', code: 'OS' },
  { name: 'Oyo', code: 'OY' },
  { name: 'Plateau', code: 'PL' },
  { name: 'Rivers', code: 'RI' },
  { name: 'Sokoto', code: 'SO' },
  { name: 'Taraba', code: 'TA' },
  { name: 'Yobe', code: 'YO' },
  { name: 'Zamfara', code: 'ZA' },
];

// Lagos LGAs and LCDAs Data
export const LAGOS_LGAS_DATA = [
  // Main LGAs
  { name: 'Agege', code: 'AGE', type: 'LGA' },
  { name: 'Ajeromi-Ifelodun', code: 'AJI', type: 'LGA' },
  { name: 'Alimosho', code: 'ALI', type: 'LGA' },
  { name: 'Amuwo-Odofin', code: 'AMU', type: 'LGA' },
  { name: 'Apapa', code: 'APA', type: 'LGA' },
  { name: 'Badagry', code: 'BAD', type: 'LGA' },
  { name: 'Epe', code: 'EPE', type: 'LGA' },
  { name: 'Eti-Osa', code: 'ETI', type: 'LGA' },
  { name: 'Ibeju-Lekki', code: 'IBE', type: 'LGA' },
  { name: 'Ifako-Ijaiye', code: 'IFA', type: 'LGA' },
  { name: 'Ikeja', code: 'IKE', type: 'LGA' },
  { name: 'Ikorodu', code: 'IKO', type: 'LGA' },
  { name: 'Kosofe', code: 'KOS', type: 'LGA' },
  { name: 'Lagos Island', code: 'LIS', type: 'LGA' },
  { name: 'Lagos Mainland', code: 'LMA', type: 'LGA' },
  { name: 'Mushin', code: 'MUS', type: 'LGA' },
  { name: 'Ojo', code: 'OJO', type: 'LGA' },
  { name: 'Oshodi-Isolo', code: 'OSH', type: 'LGA' },
  { name: 'Shomolu', code: 'SHO', type: 'LGA' },
  { name: 'Surulere', code: 'SUR', type: 'LGA' },
  
  // LCDAs
  { name: 'Agbado-Okeodo', code: 'AGB', type: 'LCDA' },
  { name: 'Agboyi-Ketu', code: 'AGK', type: 'LCDA' },
  { name: 'Ayobo-Ipaja', code: 'AYO', type: 'LCDA' },
  { name: 'Bariga', code: 'BAR', type: 'LCDA' },
  { name: 'Egbe-Idimu', code: 'EGB', type: 'LCDA' },
  { name: 'Ejigbo', code: 'EJI', type: 'LCDA' },
  { name: 'Igando-Ikotun', code: 'IGA', type: 'LCDA' },
  { name: 'Ikosi-Isheri', code: 'IKO', type: 'LCDA' },
  { name: 'Isolo', code: 'ISO', type: 'LCDA' },
  { name: 'Mosan-Okunola', code: 'MOS', type: 'LCDA' },
  { name: 'Odi-Olowo-Ojuwoye', code: 'ODI', type: 'LCDA' },
  { name: 'Ojodu', code: 'OJU', type: 'LCDA' },
  { name: 'Ojokoro', code: 'OJK', type: 'LCDA' },
  { name: 'Onigbongbo', code: 'ONI', type: 'LCDA' },
  { name: 'Orile-Agege', code: 'ORI', type: 'LCDA' },
  { name: 'Oto-Awori', code: 'OTO', type: 'LCDA' },
  { name: 'Shomolu', code: 'SHO', type: 'LCDA' },
  { name: 'Surulere', code: 'SUR', type: 'LCDA' },
];

// Sample Wards Data (for major LGAs)
export const SAMPLE_WARDS_DATA = [
  // Agege LGA Wards
  { name: 'Agege Ward 1', code: 'AGE01', lgaName: 'Agege' },
  { name: 'Agege Ward 2', code: 'AGE02', lgaName: 'Agege' },
  { name: 'Agege Ward 3', code: 'AGE03', lgaName: 'Agege' },
  { name: 'Agege Ward 4', code: 'AGE04', lgaName: 'Agege' },
  { name: 'Agege Ward 5', code: 'AGE05', lgaName: 'Agege' },
  
  // Eti-Osa LGA Wards (Lekki area)
  { name: 'Eti-Osa Ward 1', code: 'ETI01', lgaName: 'Eti-Osa' },
  { name: 'Eti-Osa Ward 2', code: 'ETI02', lgaName: 'Eti-Osa' },
  { name: 'Eti-Osa Ward 3', code: 'ETI03', lgaName: 'Eti-Osa' },
  { name: 'Eti-Osa Ward 4', code: 'ETI04', lgaName: 'Eti-Osa' },
  { name: 'Eti-Osa Ward 5', code: 'ETI05', lgaName: 'Eti-Osa' },
  
  // Alimosho LGA Wards
  { name: 'Alimosho Ward 1', code: 'ALI01', lgaName: 'Alimosho' },
  { name: 'Alimosho Ward 2', code: 'ALI02', lgaName: 'Alimosho' },
  { name: 'Alimosho Ward 3', code: 'ALI03', lgaName: 'Alimosho' },
  { name: 'Alimosho Ward 4', code: 'ALI04', lgaName: 'Alimosho' },
  { name: 'Alimosho Ward 5', code: 'ALI05', lgaName: 'Alimosho' },
];

// Neighborhoods Data from NotableNeighboorhoods.txt
export const NEIGHBORHOODS_DATA = [
  // Lekki Neighborhoods (Eti-Osa LGA)
  { name: 'Ajah', type: 'AREA', wardName: 'Eti-Osa Ward 1', lgaName: 'Eti-Osa' },
  { name: 'Ikota', type: 'AREA', wardName: 'Eti-Osa Ward 1', lgaName: 'Eti-Osa' },
  { name: 'Ikate-Elegushi', type: 'AREA', wardName: 'Eti-Osa Ward 1', lgaName: 'Eti-Osa' },
  { name: 'Jakande', type: 'AREA', wardName: 'Eti-Osa Ward 2', lgaName: 'Eti-Osa' },
  { name: 'Phase 1', type: 'AREA', wardName: 'Eti-Osa Ward 2', lgaName: 'Eti-Osa' },
  { name: 'Igbo-Efon', type: 'AREA', wardName: 'Eti-Osa Ward 2', lgaName: 'Eti-Osa' },
  { name: 'Idado', type: 'AREA', wardName: 'Eti-Osa Ward 3', lgaName: 'Eti-Osa' },
  { name: 'Chevron', type: 'AREA', wardName: 'Eti-Osa Ward 3', lgaName: 'Eti-Osa' },
  { name: 'Victoria Garden City', type: 'ESTATE', wardName: 'Eti-Osa Ward 3', lgaName: 'Eti-Osa', isGated: true, requiresVerification: true },
  { name: 'Osapa', type: 'AREA', wardName: 'Eti-Osa Ward 4', lgaName: 'Eti-Osa' },
  { name: 'Agungi', type: 'AREA', wardName: 'Eti-Osa Ward 4', lgaName: 'Eti-Osa' },
  { name: 'Lekki Palm City', type: 'ESTATE', wardName: 'Eti-Osa Ward 4', lgaName: 'Eti-Osa', isGated: true, requiresVerification: true },
  
  // Agege Traditional Communities
  { name: 'Orile Agege', type: 'COMMUNITY', wardName: 'Agege Ward 1', lgaName: 'Agege' },
  { name: 'Ogba', type: 'COMMUNITY', wardName: 'Agege Ward 1', lgaName: 'Agege' },
  { name: 'Isale Oja', type: 'COMMUNITY', wardName: 'Agege Ward 2', lgaName: 'Agege' },
  { name: 'Dopemu', type: 'COMMUNITY', wardName: 'Agege Ward 2', lgaName: 'Agege' },
  { name: 'Oke-Koto', type: 'COMMUNITY', wardName: 'Agege Ward 3', lgaName: 'Agege' },
  { name: 'Sango', type: 'COMMUNITY', wardName: 'Agege Ward 3', lgaName: 'Agege' },
  { name: 'Tabon-Tabon', type: 'COMMUNITY', wardName: 'Agege Ward 4', lgaName: 'Agege' },
  { name: 'Isale Odan', type: 'COMMUNITY', wardName: 'Agege Ward 4', lgaName: 'Agege' },
  { name: 'Ipodo', type: 'COMMUNITY', wardName: 'Agege Ward 5', lgaName: 'Agege' },
  
  // Agege Residential Communities
  { name: 'Mulero', type: 'AREA', wardName: 'Agege Ward 1', lgaName: 'Agege' },
  { name: 'Keke', type: 'AREA', wardName: 'Agege Ward 2', lgaName: 'Agege' },
  { name: 'Mangoro', type: 'AREA', wardName: 'Agege Ward 3', lgaName: 'Agege' },
  { name: 'Oyewole', type: 'AREA', wardName: 'Agege Ward 3', lgaName: 'Agege' },
  { name: 'Lemomu Edara', type: 'AREA', wardName: 'Agege Ward 4', lgaName: 'Agege' },
  { name: 'Ajegunle', type: 'AREA', wardName: 'Agege Ward 5', lgaName: 'Agege' },
  
  // Agege Residential Estates
  { name: 'Maple Wood Estate', type: 'ESTATE', wardName: 'Agege Ward 1', lgaName: 'Agege', isGated: true, requiresVerification: true },
  { name: 'County Estate', type: 'ESTATE', wardName: 'Agege Ward 2', lgaName: 'Agege', isGated: true, requiresVerification: true },
  { name: 'Sunshine Estate', type: 'ESTATE', wardName: 'Agege Ward 3', lgaName: 'Agege', isGated: true, requiresVerification: true },
  { name: 'New Dairy Farm Housing Estate', type: 'ESTATE', wardName: 'Agege Ward 4', lgaName: 'Agege', isGated: true, requiresVerification: true },
];

// Sample Landmarks Data
export const SAMPLE_LANDMARKS_DATA = [
  // Markets
  { name: 'Ikeja City Mall', type: 'MARKET', neighborhoodName: 'Ikeja', lgaName: 'Ikeja' },
  { name: 'Lekki Market', type: 'MARKET', neighborhoodName: 'Ajah', lgaName: 'Eti-Osa' },
  { name: 'Agege Market', type: 'MARKET', neighborhoodName: 'Orile Agege', lgaName: 'Agege' },
  
  // Schools
  { name: 'Lagos State University', type: 'SCHOOL', neighborhoodName: 'Ojo', lgaName: 'Ojo' },
  { name: 'University of Lagos', type: 'SCHOOL', neighborhoodName: 'Akoka', lgaName: 'Yaba' },
  
  // Hospitals
  { name: 'Lagos University Teaching Hospital', type: 'HOSPITAL', neighborhoodName: 'Idi-Araba', lgaName: 'Mushin' },
  { name: 'Eko Hospital', type: 'HOSPITAL', neighborhoodName: 'Ikeja', lgaName: 'Ikeja' },
  
  // Religious Places
  { name: 'National Mosque', type: 'MOSQUE', neighborhoodName: 'Central Business District', lgaName: 'Lagos Island' },
  { name: 'Cathedral Church of Christ', type: 'CHURCH', neighborhoodName: 'Marina', lgaName: 'Lagos Island' },
  
  // Parks
  { name: 'Tafawa Balewa Square', type: 'PARK', neighborhoodName: 'Central Business District', lgaName: 'Lagos Island' },
  { name: 'Lekki Conservation Centre', type: 'PARK', neighborhoodName: 'Lekki', lgaName: 'Eti-Osa' },
];

@Injectable()
export class LocationSeeder {
  private readonly logger = new Logger(LocationSeeder.name);

  constructor(
    @InjectRepository(State)
    private stateRepository: Repository<State>,
    @InjectRepository(LocalGovernmentArea)
    private lgaRepository: Repository<LocalGovernmentArea>,
    @InjectRepository(Ward)
    private wardRepository: Repository<Ward>,
    @InjectRepository(Neighborhood)
    private neighborhoodRepository: Repository<Neighborhood>,
    @InjectRepository(Landmark)
    private landmarkRepository: Repository<Landmark>,
  ) {}

  async seedStates(): Promise<void> {
    this.logger.log('Seeding Nigerian states...');
    
    for (const stateData of NIGERIAN_STATES_DATA) {
      const existingState = await this.stateRepository.findOne({
        where: { code: stateData.code }
      });

      if (!existingState) {
        const state = this.stateRepository.create(stateData);
        await this.stateRepository.save(state);
        this.logger.log(`Created state: ${stateData.name}`);
      } else {
        this.logger.log(`State already exists: ${stateData.name}`);
      }
    }
  }

  async seedLagosLGAs(): Promise<void> {
    this.logger.log('Seeding Lagos LGAs and LCDAs...');
    
    const lagosState = await this.stateRepository.findOne({
      where: { code: 'LA' }
    });

    if (!lagosState) {
      this.logger.error('Lagos state not found. Please seed states first.');
      return;
    }

    for (const lgaData of LAGOS_LGAS_DATA) {
      const existingLGA = await this.lgaRepository.findOne({
        where: { code: lgaData.code }
      });

      if (!existingLGA) {
        const lga = this.lgaRepository.create({
          ...lgaData,
          stateId: lagosState.id,
          type: lgaData.type as any
        });
        await this.lgaRepository.save(lga);
        this.logger.log(`Created LGA: ${lgaData.name} (${lgaData.type})`);
      } else {
        this.logger.log(`LGA already exists: ${lgaData.name}`);
      }
    }
  }

  async seedWards(): Promise<void> {
    this.logger.log('Seeding sample wards...');
    
    for (const wardData of SAMPLE_WARDS_DATA) {
      const lga = await this.lgaRepository.findOne({
        where: { name: wardData.lgaName }
      });

      if (!lga) {
        this.logger.warn(`LGA not found: ${wardData.lgaName}`);
        continue;
      }

      const existingWard = await this.wardRepository.findOne({
        where: { code: wardData.code }
      });

      if (!existingWard) {
        const ward = this.wardRepository.create({
          name: wardData.name,
          code: wardData.code,
          lgaId: lga.id
        });
        await this.wardRepository.save(ward);
        this.logger.log(`Created ward: ${wardData.name}`);
      } else {
        this.logger.log(`Ward already exists: ${wardData.name}`);
      }
    }
  }

  async seedNeighborhoods(): Promise<void> {
    this.logger.log('Seeding neighborhoods...');
    
    for (const neighborhoodData of NEIGHBORHOODS_DATA) {
      const lga = await this.lgaRepository.findOne({
        where: { name: neighborhoodData.lgaName }
      });

      if (!lga) {
        this.logger.warn(`LGA not found: ${neighborhoodData.lgaName}`);
        continue;
      }

      const ward = await this.wardRepository.findOne({
        where: { 
          name: neighborhoodData.wardName,
          lgaId: lga.id
        }
      });

      if (!ward) {
        this.logger.warn(`Ward not found: ${neighborhoodData.wardName} in ${neighborhoodData.lgaName}`);
        continue;
      }

      const existingNeighborhood = await this.neighborhoodRepository.findOne({
        where: { 
          name: neighborhoodData.name,
          wardId: ward.id
        }
      });

      if (!existingNeighborhood) {
        const neighborhood = this.neighborhoodRepository.create({
          name: neighborhoodData.name,
          type: neighborhoodData.type as any,
          wardId: ward.id,
          isGated: neighborhoodData.isGated || false,
          requiresVerification: neighborhoodData.requiresVerification || false
        });
        await this.neighborhoodRepository.save(neighborhood);
        this.logger.log(`Created neighborhood: ${neighborhoodData.name} (${neighborhoodData.type})`);
      } else {
        this.logger.log(`Neighborhood already exists: ${neighborhoodData.name}`);
      }
    }
  }

  async seedLandmarks(): Promise<void> {
    this.logger.log('Seeding sample landmarks...');
    
    for (const landmarkData of SAMPLE_LANDMARKS_DATA) {
      const lga = await this.lgaRepository.findOne({
        where: { name: landmarkData.lgaName }
      });

      if (!lga) {
        this.logger.warn(`LGA not found: ${landmarkData.lgaName}`);
        continue;
      }

      const neighborhood = await this.neighborhoodRepository.findOne({
        where: { 
          name: landmarkData.neighborhoodName,
          ward: { lgaId: lga.id }
        },
        relations: ['ward']
      });

      if (!neighborhood) {
        this.logger.warn(`Neighborhood not found: ${landmarkData.neighborhoodName} in ${landmarkData.lgaName}`);
        continue;
      }

      const existingLandmark = await this.landmarkRepository.findOne({
        where: { 
          name: landmarkData.name,
          neighborhoodId: neighborhood.id
        }
      });

      if (!existingLandmark) {
        const landmark = this.landmarkRepository.create({
          name: landmarkData.name,
          type: landmarkData.type as any,
          neighborhoodId: neighborhood.id,
          verificationStatus: LandmarkVerificationStatus.VERIFIED // Pre-verified sample data
        });
        await this.landmarkRepository.save(landmark);
        this.logger.log(`Created landmark: ${landmarkData.name} (${landmarkData.type})`);
      } else {
        this.logger.log(`Landmark already exists: ${landmarkData.name}`);
      }
    }
  }

  async seedAll(): Promise<void> {
    try {
      this.logger.log('Starting location data seeding...');
      
      await this.seedStates();
      await this.seedLagosLGAs();
      await this.seedWards();
      await this.seedNeighborhoods();
      await this.seedLandmarks();
      
      this.logger.log('Location data seeding completed successfully!');
    } catch (error) {
      this.logger.error('Error during location data seeding:', error);
      throw error;
    }
  }
}
