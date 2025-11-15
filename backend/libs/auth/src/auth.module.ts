import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtConfigService } from './services/jwt-config.service';
import { User } from '@app/database';

@Module({})
export class AuthModule {
  static forRoot(): DynamicModule {
    const configService = new ConfigService();
    const clientId = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');
    
    const providers = [
      AuthService,
      JwtStrategy,
      JwtRefreshStrategy,
      LocalStrategy,
      JwtConfigService,
    ];
    
    // Only include GoogleStrategy if all required config is present
    if (clientId && clientSecret && callbackURL) {
      providers.push(GoogleStrategy);
    }
    
    return {
      module: AuthModule,
      imports: [ConfigModule, TypeOrmModule.forFeature([User])],
      providers,
      exports: [AuthService, JwtConfigService],
    };
  }
}
