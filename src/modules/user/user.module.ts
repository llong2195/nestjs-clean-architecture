import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrmEntity } from './infrastructure/persistence/user.orm-entity';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { UserOrmMapper } from './infrastructure/mappers/user-orm.mapper';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { GetUserUseCase } from './application/use-cases/get-user.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case';
import { UserController } from './interface/http/user.controller';
import { UserCacheService } from './infrastructure/cache/user-cache.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  controllers: [UserController],
  providers: [
    UserCacheService,
    UserOrmMapper,
    // Repository implementation
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    // Use cases - NestJS will automatically inject dependencies
    CreateUserUseCase,
    GetUserUseCase,
    UpdateUserUseCase,
    ListUsersUseCase,
    DeleteUserUseCase,
  ],
  exports: [
    'IUserRepository',
    CreateUserUseCase,
    GetUserUseCase,
    UpdateUserUseCase,
    ListUsersUseCase,
    DeleteUserUseCase,
  ],
})
export class UserModule {}
