import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@app/auth/strategies/jwt.strategy';
import { DatabaseModule } from '@app/database/database.module';
import { AuthModule } from '@app/auth';
import { PaymentServiceController } from './payment-service.controller';
import { PaymentService } from './payment-service.service';
import { BankAccountController } from './bank-account/bank-account.controller';
import { BankAccountService } from './bank-account/bank-account.service';
import { PaystackService } from './paystack/paystack.service';
import { Payment, Booking, BankAccount } from '@app/database/entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
    HttpModule,
    DatabaseModule,
    AuthModule,
    TypeOrmModule.forFeature([Payment, Booking, BankAccount]),
  ],
  controllers: [PaymentServiceController, BankAccountController],
  providers: [PaymentService, BankAccountService, PaystackService, JwtStrategy],
  exports: [PaymentService, BankAccountService],
})
export class PaymentServiceModule {}

