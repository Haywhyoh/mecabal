import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import {
  State,
  LocalGovernmentArea,
  Ward,
  Neighborhood,
  Landmark,
  PostCategory,
  Achievement,
  Badge,
  BusinessCategory,
  NigerianState,
  NigerianLanguage,
  CulturalBackground,
  ProfessionalCategory,
  User
} from '../entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USERNAME', 'MeCabal_user'),
        password: configService.get('DATABASE_PASSWORD', 'MeCabal_password'),
        database: configService.get('DATABASE_NAME', 'MeCabal_dev'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      State,
      LocalGovernmentArea,
      Ward,
      Neighborhood,
      Landmark,
      PostCategory,
      Achievement,
      Badge,
      BusinessCategory,
      NigerianState,
      NigerianLanguage,
      CulturalBackground,
      ProfessionalCategory,
      User,
    ]),
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
