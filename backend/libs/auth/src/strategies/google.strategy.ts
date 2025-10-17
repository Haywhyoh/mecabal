import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { GoogleProfileDto, GoogleAuthResponseDto } from '@app/validation';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
  ) {
    const clientId = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    if (!clientId || !clientSecret || !callbackURL) {
      throw new Error(
        'Google OAuth configuration is incomplete. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL environment variables.',
      );
    }

    super({
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfileDto,
    done: VerifyCallback,
  ): Promise<any> {
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
