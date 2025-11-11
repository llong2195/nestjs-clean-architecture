import { Injectable } from '@nestjs/common';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';

export interface ListUsersOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ListUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(options: ListUsersOptions = {}): Promise<PaginatedResult<User>> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    // Get paginated users
    const users = await this.userRepository.findAll({ skip, take: limit });

    // Get total count
    const total = await this.userRepository.count();

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
