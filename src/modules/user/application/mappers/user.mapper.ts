import { User } from '../../domain/entities/user.entity';
import { UserResponseDto } from '../dtos/user-response.dto';

export class UserMapper {
  static toDto(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.userName = user.userName;
    dto.role = user.role;
    dto.provider = user.provider;
    dto.isActive = user.isActive;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }

  static toDtoList(users: User[]): UserResponseDto[] {
    return users.map((user) => this.toDto(user));
  }
}
