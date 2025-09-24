import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ReactionType } from '@app/database/entities/post-reaction.entity';

export class UpdateReactionDto {
  @ApiProperty({
    description: 'Type of reaction',
    enum: ReactionType,
    example: ReactionType.LOVE,
    required: false,
  })
  @IsEnum(ReactionType)
  @IsOptional()
  reactionType?: ReactionType;
}
