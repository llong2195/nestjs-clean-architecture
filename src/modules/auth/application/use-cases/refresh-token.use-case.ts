import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenResponseDto } from '../dtos/token-response.dto';
import { AppConfigService } from '../../../../shared/config/config.service';
import { JwtPayload } from '../../interface/guards/jwt-auth.guard';

/**
 * Refresh Token Use Case
 *
 * Handles JWT token refresh
 */
@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
  ) {}

  async execute(refreshToken: string): Promise<TokenResponseDto> {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken);

      // Generate new tokens
      const newPayload = {
        sub: payload.sub,
        email: payload.email,
        userName: payload.userName,
      };

      const accessToken = await this.jwtService.signAsync(newPayload, {
        expiresIn: this.configService.jwtExpiresIn,
      });

      const newRefreshToken = await this.jwtService.signAsync(newPayload, {
        expiresIn: this.configService.refreshTokenExpiresIn,
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
        tokenType: 'Bearer',
        expiresIn: 900, // 15 minutes in seconds
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
