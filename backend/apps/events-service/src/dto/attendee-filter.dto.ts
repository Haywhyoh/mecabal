import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class AttendeeFilterDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({
    description: 'Filter by RSVP status',
    enum: ['going', 'maybe', 'not_going'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['going', 'maybe', 'not_going'])
  rsvpStatus?: string;

  @ApiProperty({
    description: 'Search attendees by name',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}
