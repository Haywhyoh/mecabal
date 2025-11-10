import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleTokenPayload {
  sub: string; // Google user ID
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  aud: string; // Client ID
  iss: string; // Issuer
  iat: number; // Issued at
  exp: number; // Expires at
}

@Injectable()
export class GoogleTokenVerifierService {
  private readonly logger = new Logger(GoogleTokenVerifierService.name);
  private readonly client: OAuth2Client;

  constructor(private configService: ConfigService) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID is not configured');
    }

    this.client = new OAuth2Client(clientId);
  }

  async verifyIdToken(idToken: string): Promise<GoogleTokenPayload> {
    try {
      this.logger.log('Verifying Google ID token');

      // Verify the token
      // Include all possible client IDs: web, iOS, Android, and server-side
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: [
          this.configService.get<string>('GOOGLE_CLIENT_ID'), // Server-side client ID
          this.configService.get<string>('GOOGLE_WEB_CLIENT_ID'), // Web client ID (for frontend)
          this.configService.get<string>('GOOGLE_IOS_CLIENT_ID'),
          this.configService.get<string>('GOOGLE_ANDROID_CLIENT_ID'),
        ].filter((id): id is string => Boolean(id)), // Remove undefined values
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google ID token');
      }

      // Validate required fields
      if (!payload.sub || !payload.email) {
        throw new UnauthorizedException('Missing required fields in Google token');
      }

      this.logger.log(`Google token verified for user: ${payload.email}`);

      return {
        sub: payload.sub,
        email: payload.email,
        email_verified: payload.email_verified || false,
        name: payload.name,
        given_name: payload.given_name,
        family_name: payload.family_name,
        picture: payload.picture,
        aud: payload.aud,
        iss: payload.iss,
        iat: payload.iat || 0,
        exp: payload.exp || 0,
      };
    } catch (error) {
      this.logger.error('Google token verification failed:', error);
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new UnauthorizedException('Invalid Google ID token');
    }
  }

  async verifyAccessToken(accessToken: string): Promise<GoogleTokenPayload> {
    try {
      this.logger.log('Verifying Google access token');

      // Get token info from Google
      const response = await this.client.getTokenInfo(accessToken);
      
      if (!response.sub || !response.email) {
        throw new UnauthorizedException('Invalid Google access token');
      }

      this.logger.log(`Google access token verified for user: ${response.email}`);

      return {
        sub: response.sub,
        email: response.email,
        email_verified: response.email_verified || false,
        name: (response as any).name || '',
        given_name: (response as any).given_name || '',
        family_name: (response as any).family_name || '',
        picture: (response as any).picture || '',
        aud: response.aud || '',
        iss: (response as any).iss || '',
        iat: (response as any).iat || 0,
        exp: (response as any).exp || 0,
      };
    } catch (error) {
      this.logger.error('Google access token verification failed:', error);
      throw new UnauthorizedException('Invalid Google access token');
    }
  }

  async getUserInfo(accessToken: string): Promise<{
    id: string;
    email: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    verified_email?: boolean;
  }> {
    try {
      this.logger.log('Fetching user info from Google');

      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new UnauthorizedException('Failed to fetch user info from Google');
      }

      const userInfo = await response.json();
      
      if (!userInfo.id || !userInfo.email) {
        throw new UnauthorizedException('Invalid user info from Google');
      }

      this.logger.log(`User info fetched for: ${userInfo.email}`);

      return userInfo;
    } catch (error) {
      this.logger.error('Failed to fetch user info from Google:', error);
      throw new UnauthorizedException('Failed to fetch user info from Google');
    }
  }
}
