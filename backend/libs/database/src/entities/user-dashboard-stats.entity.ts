import {
  Entity,
  Column,
  PrimaryColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import type { User } from './user.entity';

@Entity('user_dashboard_stats')
export class UserDashboardStats {
  @ApiProperty({ description: 'User ID' })
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Number of bookmarks' })
  @Column({ name: 'bookmarks_count', type: 'int', default: 0 })
  bookmarksCount: number;

  @ApiProperty({ description: 'Number of saved deals' })
  @Column({ name: 'saved_deals_count', type: 'int', default: 0 })
  savedDealsCount: number;

  @ApiProperty({ description: 'Number of events attending' })
  @Column({ name: 'attending_events_count', type: 'int', default: 0 })
  attendingEventsCount: number;

  @ApiProperty({ description: 'Number of posts shared' })
  @Column({ name: 'posts_shared_count', type: 'int', default: 0 })
  postsSharedCount: number;

  @ApiProperty({ description: 'Number of neighbors helped' })
  @Column({ name: 'neighbors_helped_count', type: 'int', default: 0 })
  neighborsHelpedCount: number;

  @ApiProperty({ description: 'Number of events joined' })
  @Column({ name: 'events_joined_count', type: 'int', default: 0 })
  eventsJoinedCount: number;

  @ApiProperty({ description: 'Last calculation timestamp' })
  @Column({ name: 'last_calculated_at', type: 'timestamp', nullable: true })
  lastCalculatedAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Unidirectional relation - no inverse side in User entity
  @ManyToOne('User')
  @JoinColumn({ name: 'user_id' })
  user: User;
}
