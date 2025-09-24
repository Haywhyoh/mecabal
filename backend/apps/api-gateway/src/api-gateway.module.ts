import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { AuthModule } from '@app/auth';
import { DatabaseModule } from '@app/database';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
  ],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService],
})
export class ApiGatewayModule {}
