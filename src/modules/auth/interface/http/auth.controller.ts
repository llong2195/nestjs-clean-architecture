import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../../common/decorators/public.decorator';
import { AppConfigService } from '../../../../shared/config/config.service';
import { User } from '../../../user/domain/entities/user.entity';
import type { IUserRepository } from '../../../user/domain/repositories/user.repository.interface';
import { Email } from '../../../user/domain/value-objects/email.vo';
import { Password } from '../../../user/domain/value-objects/password.vo';
import { LoginDto } from '../../application/dtos/login.dto';
import { TokenResponseDto } from '../../application/dtos/token-response.dto';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { GoogleOAuthService } from '../../infrastructure/oauth/google-oauth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

/**
 * Authentication Controller
 *
 * Handles authentication endpoints
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly googleOAuthService: GoogleOAuthService,
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user with email and password',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<TokenResponseDto> {
    return this.loginUseCase.execute(loginDto.email, loginDto.password);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generate new access token using refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body('refreshToken') refreshToken: string): Promise<TokenResponseDto> {
    return this.refreshTokenUseCase.execute(refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'User logout',
    description: 'Logout current user (client-side token removal)',
  })
  @ApiResponse({ status: 204, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  logout(): void {
    this.logoutUseCase.execute();
  }

  @Public()
  @Get('google')
  @ApiOperation({
    summary: 'Google OAuth login',
    description: 'Redirect to Google OAuth consent page',
  })
  @ApiResponse({ status: 302, description: 'Redirect to Google' })
  @Redirect()
  googleAuth(): { url: string } {
    const authUrl = this.googleOAuthService.getAuthorizationUrl();
    return { url: authUrl };
  }

  @Public()
  @Get('google/callback')
  @ApiOperation({
    summary: 'Google OAuth callback',
    description: 'Handle Google OAuth callback and return JWT tokens',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid authorization code' })
  async googleAuthCallback(@Query('code') code: string): Promise<TokenResponseDto> {
    // Exchange code for tokens and get user profile from ID token
    const profile = await this.googleOAuthService.exchangeCodeForProfile(code);

    // Find or create user
    let user = await this.userRepository.findByEmail(profile.email);

    if (!user) {
      // Create new user from Google profile
      const password = await Password.create(`GoogleOAuth${Date.now()}#Abc123`);
      user = await User.create(
        Email.create(profile.email).value,
        password.hashedValue,
        profile.name,
      );

      user = await this.userRepository.save(user);
    }

    // Generate JWT tokens
    const payload = {
      sub: user.id,
      email: user.email,
      userName: user.userName,
    };

    const jwtAccessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.jwtExpiresIn,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.refreshTokenExpiresIn,
    });

    return {
      accessToken: jwtAccessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900,
    };
  }
}
