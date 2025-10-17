import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonService } from './common.service';
import { NigerianCarrierService } from './services/nigerian-carrier.service';
import { GoogleMapsService } from './services/google-maps.service';

@Module({
  imports: [ConfigModule],
  providers: [CommonService, NigerianCarrierService, GoogleMapsService],
  exports: [CommonService, NigerianCarrierService, GoogleMapsService],
})
export class CommonModule {}
