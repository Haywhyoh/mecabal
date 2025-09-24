import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostReaction, ReactionType } from '@app/database/entities/post-reaction.entity';
import { Post } from '@app/database/entities/post.entity';
import { CreateReactionDto, UpdateReactionDto, ReactionResponseDto } from './dto';

@Injectable()
export class ReactionsService {
  constructor(
    @InjectRepository(PostReaction)
    private reactionRepository: Repository<PostReaction>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async addReaction(
    postId: string,
    userId: string,
    createReactionDto: CreateReactionDto,
  ): Promise<ReactionResponseDto> {
    // Check if post exists
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });

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
      return this.mapToResponseDto(updatedReaction);
    }

    // Create new reaction
    const reaction = this.reactionRepository.create({
      postId,
      userId,
      reactionType: createReactionDto.reactionType,
    });

    const savedReaction = await this.reactionRepository.save(reaction);
    return this.mapToResponseDto(savedReaction);
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

  async getPostReactions(postId: string): Promise<ReactionResponseDto[]> {
    const reactions = await this.reactionRepository.find({
      where: { postId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    return reactions.map(reaction => this.mapToResponseDto(reaction));
  }

  async getPostReactionCounts(postId: string): Promise<Record<string, number>> {
    const reactions = await this.reactionRepository.find({
      where: { postId },
    });

    const counts: Record<string, number> = {};
    reactions.forEach(reaction => {
      counts[reaction.reactionType] = (counts[reaction.reactionType] || 0) + 1;
    });

    return counts;
  }

  async getUserReactions(userId: string): Promise<ReactionResponseDto[]> {
    const reactions = await this.reactionRepository.find({
      where: { userId },
      relations: ['post', 'user'],
      order: { createdAt: 'DESC' },
    });

    return reactions.map(reaction => this.mapToResponseDto(reaction));
  }

  async getReactionStats(postId: string): Promise<{
    totalReactions: number;
    reactionCounts: Record<string, number>;
    topReaction: string;
  }> {
    const reactions = await this.reactionRepository.find({
      where: { postId },
    });

    const reactionCounts: Record<string, number> = {};
    reactions.forEach(reaction => {
      reactionCounts[reaction.reactionType] = (reactionCounts[reaction.reactionType] || 0) + 1;
    });

    const totalReactions = reactions.length;
    const topReaction = Object.keys(reactionCounts).reduce((a, b) => 
      reactionCounts[a] > reactionCounts[b] ? a : b, 'like'
    );

    return {
      totalReactions,
      reactionCounts,
      topReaction,
    };
  }

  private mapToResponseDto(reaction: PostReaction): ReactionResponseDto {
    return {
      id: reaction.id,
      postId: reaction.postId,
      userId: reaction.userId,
      reactionType: reaction.reactionType,
      createdAt: reaction.createdAt,
      user: reaction.user ? {
        id: reaction.user.id,
        firstName: reaction.user.firstName,
        lastName: reaction.user.lastName,
        profilePictureUrl: reaction.user.profilePictureUrl,
        isVerified: reaction.user.isVerified,
        trustScore: reaction.user.trustScore,
      } : undefined,
    };
  }
}