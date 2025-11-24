import { Injectable, Inject } from '@nestjs/common';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { UpdateUserDto } from '../dtos/update-user.dto';
import {
  UserNotFoundException,
  DuplicateEmailException,
} from '../../../../common/exceptions/custom-exceptions';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, dto: UpdateUserDto): Promise<User> {
    // Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // Check email uniqueness if email is being updated
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(dto.email);
      if (existingUser) {
        throw new DuplicateEmailException(dto.email);
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
