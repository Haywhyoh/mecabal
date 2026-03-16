import { Module } from '@nestjs/common';
import { EventsServiceController } from './events-service.controller';
import { EventsServiceService } from './events-service.service';
import { DatabaseModule } from '@app/database';
import { AuthModule } from '@app/auth';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
  ],
  controllers: [EventsServiceController],
  providers: [EventsServiceService],
  exports: [EventsServiceService],
})
export class EventsServiceModule {}
