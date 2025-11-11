import { Injectable, NotFoundException } from '@nestjs/common';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { UpdateUserDto } from '../dtos/update-user.dto';

@Injectable()
export class UpdateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string, dto: UpdateUserDto): Promise<User> {
    // Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check email uniqueness if email is being updated
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(dto.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
    }

    // Update profile
    user.updateProfile(dto.userName, dto.email);

    // Update password if provided
    if (dto.password) {
      await user.changePassword(dto.password);
    }

    // Persist changes
    const updatedUser = await this.userRepository.save(user);

    // Domain events would be dispatched here (UserUpdatedEvent)

    return updatedUser;
  }
}
