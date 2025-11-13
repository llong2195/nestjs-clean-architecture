import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Soft delete the user
    await this.userRepository.delete(userId);

    // Domain event would be dispatched here (UserDeletedEvent)
    // This will be implemented when we add the event infrastructure
  }
}
