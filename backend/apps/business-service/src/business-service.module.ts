import { Module } from '@nestjs/common';
import { BusinessServiceController } from './business-service.controller';
import { BusinessServiceService } from './business-service.service';

@Module({
  imports: [],
  controllers: [BusinessServiceController],
  providers: [BusinessServiceService],
})
export class BusinessServiceModule {}
