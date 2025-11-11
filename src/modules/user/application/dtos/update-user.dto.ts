import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiPropertyOptional({
    description: 'User display name',
    example: 'John Doe',
    minLength: 3,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'User name must be at least 3 characters long' })
  @MaxLength(50, { message: 'User name must not exceed 50 characters' })
  userName?: string;

  @ApiPropertyOptional({
    description: 'New password (min 8 chars, must contain uppercase, lowercase, and number)',
    example: 'NewPassword123',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password?: string;
}
