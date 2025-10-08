import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min } from 'class-validator';

export class RsvpDto {
  @ApiProperty({
    description: 'RSVP status',
    enum: ['going', 'maybe', 'not_going'],
    example: 'going',
  })
  @IsEnum(['going', 'maybe', 'not_going'])
  rsvpStatus: 'going' | 'maybe' | 'not_going';

  @ApiProperty({
    description: 'Number of guests the user is bringing',
    example: 2,
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  guestsCount?: number;
}
