import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { NigerianCarrierService } from './services/nigerian-carrier.service';

@Module({
  providers: [CommonService, NigerianCarrierService],
  exports: [CommonService, NigerianCarrierService],
})
export class CommonModule {}
