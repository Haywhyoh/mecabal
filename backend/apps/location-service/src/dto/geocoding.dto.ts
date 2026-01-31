import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReverseGeocodeDto {
  @ApiProperty({
    description: 'Latitude coordinate',
    example: 6.612819583076608,
    minimum: 4.0,
    maximum: 14.0,
  })
  @IsNumber()
  @Min(4.0)
  @Max(14.0)
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 3.2597709181734142,
    minimum: 2.5,
    maximum: 15.0,
  })
  @IsNumber()
  @Min(2.5)
  @Max(15.0)
  longitude: number;
}





