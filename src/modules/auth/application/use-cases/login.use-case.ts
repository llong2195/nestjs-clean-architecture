import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '../../../../shared/config/config.service';
import type { IUserRepository } from '../../../user/domain/repositories/user.repository.interface';
import { Password } from '../../../user/domain/value-objects/password.vo';
import { TokenResponseDto } from '../dtos/token-response.dto';

/**
 * Login Use Case
 *
 * Handles user authentication and JWT token generation
 */
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
  ) {}

  async execute(email: string, password: string): Promise<TokenResponseDto> {
    // Find user by email
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const passwordVo = Password.fromHash(user.hashedPassword ?? '');
    const isValid = await passwordVo.comparePassword(password);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const payload = {
      sub: user.id,
      email: user.email,
      userName: user.userName,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.jwtExpiresIn,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.refreshTokenExpiresIn,
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900, // 15 minutes in seconds
    };
  }
}
