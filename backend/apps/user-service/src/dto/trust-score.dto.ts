import { ApiProperty } from '@nestjs/swagger';

export class TrustScoreBreakdownDto {
  @ApiProperty({
    description: 'Total trust score points',
    example: 75,
  })
  totalScore: number;

  @ApiProperty({
    description: 'Maximum possible trust score points',
    example: 100,
  })
  maxScore: number;

  @ApiProperty({
    description: 'Trust score percentage',
    example: 75,
  })
  percentage: number;

  @ApiProperty({
    description: 'Detailed breakdown of trust score components',
    type: 'object',
    additionalProperties: true,
  })
  breakdown: {
    phoneVerification: {
      score: number;
      maxScore: number;
      status: boolean;
    };
    identityVerification: {
      score: number;
      maxScore: number;
      status: boolean;
    };
    addressVerification: {
      score: number;
      maxScore: number;
      status: boolean;
    };
    communityEndorsements: {
      score: number;
      maxScore: number;
      count: number;
    };
    badges: {
      score: number;
      maxScore: number;
      count: number;
    };
    accountAge: {
      score: number;
      maxScore: number;
      days: number;
    };
    activityLevel: {
      score: number;
      maxScore: number;
      level: string;
    };
  };
}

export class TrustScoreResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Trust score breakdown data',
    type: TrustScoreBreakdownDto,
  })
  data: TrustScoreBreakdownDto;

  @ApiProperty({
    description: 'Response message',
    example: 'Trust score calculated successfully',
  })
  message: string;
}

export class TrustScoreConfigDto {
  @ApiProperty({
    description: 'Points awarded for phone verification',
    example: 20,
  })
  phoneVerificationPoints: number;

  @ApiProperty({
    description: 'Points awarded for identity verification',
    example: 30,
  })
  identityVerificationPoints: number;

  @ApiProperty({
    description: 'Points awarded for address verification',
    example: 30,
  })
  addressVerificationPoints: number;

  @ApiProperty({
    description: 'Points awarded per community endorsement',
    example: 2,
  })
  endorsementPointsEach: number;

  @ApiProperty({
    description: 'Maximum points from community endorsements',
    example: 20,
  })
  maxEndorsementPoints: number;

  @ApiProperty({
    description: 'Points awarded per badge',
    example: 1,
  })
  badgePointsEach: number;

  @ApiProperty({
    description: 'Maximum points from badges',
    example: 10,
  })
  maxBadgePoints: number;

  @ApiProperty({
    description: 'Points per day of account age',
    example: 0.1,
  })
  accountAgePoints: number;

  @ApiProperty({
    description: 'Maximum points from account age',
    example: 30,
  })
  maxAccountAgePoints: number;

  @ApiProperty({
    description: 'Points for activity level',
    example: 5,
  })
  activityLevelPoints: number;

  @ApiProperty({
    description: 'Maximum points from activity level',
    example: 20,
  })
  maxActivityLevelPoints: number;
}
