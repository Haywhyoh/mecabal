import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { GoogleProfileDto, GoogleAuthResponseDto } from '@app/validation';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private isConfigured: boolean;

  constructor(configService: ConfigService) {
    // Get config values BEFORE calling super
    const clientId = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    // Must call super() before accessing 'this'
    // Only initialize if all required config is present
    if (clientId && clientSecret && callbackURL) {
      super({
        clientID: clientId,
        clientSecret: clientSecret,
        callbackURL: callbackURL,
        scope: ['email', 'profile'],
      });
    } else {
      // Provide dummy values to prevent PassportStrategy from throwing
      // The strategy won't be used if config is missing
      super({
        clientID: 'dummy',
        clientSecret: 'dummy',
        callbackURL: 'http://localhost/dummy',
        scope: ['email', 'profile'],
      });
    }
    
    // Now we can access 'this' after super() has been called
    this.isConfigured = !!(clientId && clientSecret && callbackURL);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfileDto,
    done: VerifyCallback,
  ): Promise<any> {
    // Prevent use of strategy if not properly configured
    if (!this.isConfigured) {
      return done(
        new Error(
          'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL environment variables.',
        ),
        false,
      );
    }

    try {
      const { id, emails, name, photos } = profile;

      // Extract user information from Google profile
      const googleId = id;
      const email = emails?.[0]?.value;
      const firstName = (name as any)?.givenName || (name as any)?.given_name || '';
      const lastName = (name as any)?.familyName || (name as any)?.family_name || '';
      const profilePicture = photos?.[0]?.value;

      if (!email) {
        return done(new Error('No email found in Google profile'), false);
      }

      // Return the profile data for the auth service to process
      // The actual validation will be done in the auth controller
      return done(null, {
        googleId,
        email,
        firstName,
        lastName,
        profilePicture,
        emailVerified: profile.email_verified || false,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      return done(error, false);
    }
  }
}
