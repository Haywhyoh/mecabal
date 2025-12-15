import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBankAccountDto {
  @ApiProperty({ example: '0123456789' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  accountNumber: string;

  @ApiProperty({ example: '058' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  bankCode: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  accountName?: string;
}

export class VerifyBankAccountDto {
  @ApiProperty({ example: '0123456789' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  accountNumber: string;

  @ApiProperty({ example: '058' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  bankCode: string;
}










