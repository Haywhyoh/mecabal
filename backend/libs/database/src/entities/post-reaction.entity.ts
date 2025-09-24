import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Post } from './post.entity';
import { User } from './user.entity';

export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  LAUGH = 'laugh',
  ANGRY = 'angry',
  SAD = 'sad',
  WOW = 'wow',
  SUPPORT = 'support', // Nigerian context: showing support
  BLESS = 'bless', // Nigerian context: blessing/well-wishing
}

@Entity('post_reactions')
@Index(['postId'])
@Index(['userId'])
@Unique(['postId', 'userId'])
export class PostReaction {
  @ApiProperty({ description: 'Unique identifier for the post reaction' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Post ID this reaction belongs to' })
  @Column({ name: 'post_id' })
  postId: string;

  @ApiProperty({ description: 'User ID who reacted' })
  @Column({ name: 'user_id' })
  userId: string;

  @ApiProperty({
    description: 'Type of reaction',
    enum: ReactionType,
    example: ReactionType.LIKE,
  })
  @Column({ 
    name: 'reaction_type', 
    type: 'enum', 
    enum: ReactionType, 
    default: ReactionType.LIKE 
  })
  reactionType: ReactionType;

  @ApiProperty({ description: 'Reaction creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Post, (post) => post.reactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
