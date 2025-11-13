import { Injectable, Logger } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { AppConfigService } from '../../../../shared/config/config.service';

/**
 * Google OAuth User Profile
 */
export interface GoogleUserProfile {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

/**
 * Google OAuth Service
 *
 * Handles Google OAuth2 authentication flow using google-auth-library
 */
@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);
  private readonly oauth2Client: OAuth2Client;

  constructor(private readonly configService: AppConfigService) {
    this.oauth2Client = new OAuth2Client(
      this.configService.googleClientId,
      this.configService.googleClientSecret,
      this.configService.googleCallbackUrl,
    );
  }

  /**
   * Generate Google OAuth2 authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const authorizeUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      prompt: 'consent',
      ...(state && { state }),
    });

    return authorizeUrl;
  }

  /**
   * Exchange authorization code for tokens and return user profile directly
   *
   * @param code - Authorization code from Google OAuth callback
   * @returns User profile extracted from ID token
   */
  async exchangeCodeForProfile(code: string): Promise<GoogleUserProfile> {
    try {
      // Exchange code for tokens (access_token, refresh_token, id_token)
      const { tokens } = await this.oauth2Client.getToken(code);

      if (!tokens.id_token) {
        throw new Error('No ID token received from Google');
      }

      // Verify and decode the ID token
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken: tokens.id_token,
        audience: this.configService.googleClientId,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new Error('No payload in ID token');
      }

      return {
        id: payload.sub,
        email: payload.email || '',
        verified_email: payload.email_verified || false,
        name: payload.name || '',
        given_name: payload.given_name || '',
        family_name: payload.family_name || '',
        picture: payload.picture || '',
      };
    } catch (error) {
      this.logger.error('Failed to exchange code for profile', error);
      throw new Error('Failed to authenticate with Google');
    }
  }

  /**
   * @deprecated Use exchangeCodeForProfile instead - combines token exchange and profile fetch
   */
  async exchangeCodeForToken(code: string): Promise<string> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);

      if (!tokens.access_token) {
        throw new Error('No access token received from Google');
      }

      return tokens.access_token;
    } catch (error) {
      this.logger.error('Failed to exchange code for token', error);
      throw new Error('Failed to exchange authorization code');
    }
  }

  /**
   * @deprecated Use exchangeCodeForProfile instead - ID token already contains profile
   */
  async getUserProfile(accessToken: string): Promise<GoogleUserProfile> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });

      const ticket = await this.oauth2Client.verifyIdToken({
        idToken: accessToken,
        audience: this.configService.googleClientId,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new Error('No payload in ID token');
      }

      return {
        id: payload.sub,
        email: payload.email || '',
        verified_email: payload.email_verified || false,
        name: payload.name || '',
        given_name: payload.given_name || '',
        family_name: payload.family_name || '',
        picture: payload.picture || '',
      };
    } catch (error) {
      this.logger.error('Failed to fetch user profile', error);
      throw new Error('Failed to fetch user profile from Google');
    }
  }
}
