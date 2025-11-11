import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../domain/value-objects/user-role.vo';
import type { AuthProvider } from '../../domain/entities/user.entity';

export class UserResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'User display name',
    example: 'John Doe',
  })
  userName!: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.USER,
  })
  role!: UserRole;

  @ApiProperty({
    description: 'Authentication provider',
    enum: ['local', 'google', 'github'],
    example: 'local',
  })
  provider!: AuthProvider;

  @ApiProperty({
    description: 'Whether the user account is active',
    example: true,
  })
  isActive!: boolean;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2025-11-11T10:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-11-11T10:00:00.000Z',
  })
  updatedAt!: Date;
}
