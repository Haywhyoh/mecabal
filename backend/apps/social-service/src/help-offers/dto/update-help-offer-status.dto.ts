import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { HelpOfferStatus } from '@app/database';

export class UpdateHelpOfferStatusDto {
  @ApiProperty({
    description: 'New status for the help offer',
    enum: HelpOfferStatus,
    example: HelpOfferStatus.ACCEPTED,
  })
  @IsEnum(HelpOfferStatus)
  status: HelpOfferStatus;
}

