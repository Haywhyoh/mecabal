import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';
import {
  Connection,
  User,
  UserNeighborhood,
  Neighborhood,
} from '@app/database';

@Module({
  imports: [
    TypeOrmModule.forFeature([Connection, User, UserNeighborhood, Neighborhood]),
  ],
  controllers: [ConnectionsController],
  providers: [ConnectionsService],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}

