import { Controller, Get } from '@nestjs/common';
import { BusinessServiceService } from './business-service.service';

@Controller()
export class BusinessServiceController {
  constructor(private readonly businessServiceService: BusinessServiceService) {}

  @Get()
  getHello(): string {
    return this.businessServiceService.getHello();
  }
}
