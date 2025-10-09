import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Relation,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import type { User } from './user.entity';

@Entity('user_bookmarks')
@Index(['userId', 'itemType', 'itemId'], { unique: true })
export class UserBookmark {
  @ApiProperty({ description: 'Bookmark ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({
    description: 'Item type',
    enum: ['post', 'listing', 'event'],
  })
  @Column({ name: 'item_type', length: 50 })
  itemType: 'post' | 'listing' | 'event';

  @ApiProperty({ description: 'Item ID' })
  @Column({ name: 'item_id', type: 'uuid' })
  itemId: string;

  @ApiProperty({ description: 'Bookmark creation date' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Unidirectional relation - no inverse side in User entity
  @ManyToOne('User')
  @JoinColumn({ name: 'user_id' })
  user: User;
}
