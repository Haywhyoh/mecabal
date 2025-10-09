import { Test, TestingModule } from '@nestjs/testing';
import { BusinessServiceController } from './business-service.controller';
import { BusinessServiceService } from './business-service.service';

describe('BusinessServiceController', () => {
  let businessServiceController: BusinessServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [BusinessServiceController],
      providers: [BusinessServiceService],
    }).compile();

    businessServiceController = app.get<BusinessServiceController>(BusinessServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(businessServiceController.getHello()).toBe('Hello World!');
    });
  });
});
