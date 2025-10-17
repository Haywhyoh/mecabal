import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { 
  State, 
  LocalGovernmentArea, 
  Ward, 
  Neighborhood, 
  Landmark, 
  User 
} from '../../libs/database/src/entities';
import { GoogleMapsService } from '../../libs/common/src/services/google-maps.service';

// Controllers
import { LocationServiceController } from './location-service.controller';
import { StatesController } from './controllers/states.controller';
import { LgasController } from './controllers/lgas.controller';
import { WardsController } from './controllers/wards.controller';
import { NeighborhoodsController } from './controllers/neighborhoods.controller';
import { LandmarksController } from './controllers/landmarks.controller';

// Services
import { LocationServiceService } from './location-service.service';
import { StatesService } from './services/states.service';
import { LgasService } from './services/lgas.service';
import { WardsService } from './services/wards.service';
import { NeighborhoodsService } from './services/neighborhoods.service';
import { LandmarksService } from './services/landmarks.service';
import { EstateManagementService } from './services/estate-management.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forFeature([
      State,
      LocalGovernmentArea,
      Ward,
      Neighborhood,
      Landmark,
      User,
    ]),
  ],
  controllers: [
    LocationServiceController,
    StatesController,
    LgasController,
    WardsController,
    NeighborhoodsController,
    LandmarksController,
  ],
  providers: [
    LocationServiceService,
    StatesService,
    LgasService,
    WardsService,
    NeighborhoodsService,
    LandmarksService,
    EstateManagementService,
    GoogleMapsService,
  ],
  exports: [
    StatesService,
    LgasService,
    WardsService,
    NeighborhoodsService,
    LandmarksService,
    EstateManagementService,
    GoogleMapsService,
  ],
})
export class LocationServiceModule {}
