import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ReactionType } from '@app/database/entities/post-reaction.entity';

export class CreateReactionDto {
  @ApiProperty({
    description: 'Type of reaction',
    enum: ReactionType,
    example: ReactionType.LIKE,
  })
  @IsEnum(ReactionType)
  @IsNotEmpty()
  reactionType: ReactionType;
}
