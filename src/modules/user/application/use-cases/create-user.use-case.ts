import { Injectable, Inject } from '@nestjs/common';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UserRole } from '../../domain/value-objects/user-role.vo';
import { DuplicateEmailException } from '../../../../common/exceptions/custom-exceptions';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(dto: CreateUserDto): Promise<User> {
    // Check if user with email already exists
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new DuplicateEmailException(dto.email);
    }

    // Create domain entity
    const user = await User.create(
      dto.email,
      dto.password,
      dto.userName,
      dto.role || UserRole.USER,
      'local',
    );

    // Persist to database
    const savedUser = await this.userRepository.save(user);

    // Domain events would be dispatched here (UserCreatedEvent)
    // This will be implemented when we add the event infrastructure

    return savedUser;
  }
}
