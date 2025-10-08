import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventsServiceController } from './events-service.controller';
import { EventsServiceService } from './events-service.service';
import { DatabaseModule } from '@app/database';
import { AuthModule } from '@app/auth';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
  ],
  controllers: [EventsServiceController],
  providers: [EventsServiceService],
  exports: [EventsServiceService],
})
export class EventsServiceModule {}
