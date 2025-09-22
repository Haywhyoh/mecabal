import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostReaction, Post, User } from '@mecabal/database';
import { CreateReactionDto, ReactionResponseDto, ReactionStatsDto, ReactionType } from './dto';

@Injectable()
export class ReactionsService {
  constructor(
    @InjectRepository(PostReaction)
    private readonly reactionRepository: Repository<PostReaction>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async addReaction(postId: string, userId: string, createReactionDto: CreateReactionDto): Promise<ReactionResponseDto> {
    // Check if post exists
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user already reacted to this post
    const existingReaction = await this.reactionRepository.findOne({
      where: { postId, userId },
    });

    if (existingReaction) {
      // Update existing reaction
      existingReaction.reactionType = createReactionDto.reactionType;
      const updatedReaction = await this.reactionRepository.save(existingReaction);
      return this.formatReactionResponse(updatedReaction);
    } else {
      // Create new reaction
      const reaction = this.reactionRepository.create({
        postId,
        userId,
        reactionType: createReactionDto.reactionType,
      });
      const savedReaction = await this.reactionRepository.save(reaction);
      return this.formatReactionResponse(savedReaction);
    }
  }

  async removeReaction(postId: string, userId: string): Promise<void> {
    const reaction = await this.reactionRepository.findOne({
      where: { postId, userId },
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    await this.reactionRepository.remove(reaction);
  }

  async getPostReactions(postId: string, userId?: string): Promise<ReactionResponseDto[]> {
    // Check if post exists
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const reactions = await this.reactionRepository.find({
      where: { postId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    return reactions.map(reaction => this.formatReactionResponse(reaction));
  }

  async getReactionStats(postId: string, userId?: string): Promise<ReactionStatsDto> {
    // Check if post exists
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const reactions = await this.reactionRepository.find({
      where: { postId },
    });

    // Calculate stats
    const total = reactions.length;
    const byType: Record<ReactionType, number> = {
      [ReactionType.LIKE]: 0,
      [ReactionType.LOVE]: 0,
      [ReactionType.LAUGH]: 0,
      [ReactionType.ANGRY]: 0,
      [ReactionType.SAD]: 0,
    };

    let userReaction: ReactionType | undefined;

    reactions.forEach(reaction => {
      byType[reaction.reactionType]++;
      if (userId && reaction.userId === userId) {
        userReaction = reaction.reactionType;
      }
    });

    return {
      total,
      byType,
      userReaction,
    };
  }

  async getUserReactions(userId: string, limit: number = 20, offset: number = 0): Promise<ReactionResponseDto[]> {
    const reactions = await this.reactionRepository.find({
      where: { userId },
      relations: ['user', 'post'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return reactions.map(reaction => this.formatReactionResponse(reaction));
  }

  private formatReactionResponse(reaction: PostReaction): ReactionResponseDto {
    return {
      id: reaction.id,
      postId: reaction.postId,
      userId: reaction.userId,
      reactionType: reaction.reactionType as ReactionType,
      createdAt: reaction.createdAt,
      user: {
        id: reaction.user.id,
        firstName: reaction.user.firstName,
        lastName: reaction.user.lastName,
        profilePicture: reaction.user.profilePicture,
      },
    };
  }
}
