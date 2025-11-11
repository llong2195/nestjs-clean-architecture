import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrmEntity } from './infrastructure/persistence/user.orm-entity';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { GetUserUseCase } from './application/use-cases/get-user.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';
import { UserController } from './interface/http/user.controller';
import { IUserRepository } from './domain/repositories/user.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  controllers: [UserController],
  providers: [
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    {
      provide: CreateUserUseCase,
      useFactory: (userRepository: IUserRepository) => {
        return new CreateUserUseCase(userRepository);
      },
      inject: ['IUserRepository'],
    },
    {
      provide: GetUserUseCase,
      useFactory: (userRepository: IUserRepository) => {
        return new GetUserUseCase(userRepository);
      },
      inject: ['IUserRepository'],
    },
    {
      provide: UpdateUserUseCase,
      useFactory: (userRepository: IUserRepository) => {
        return new UpdateUserUseCase(userRepository);
      },
      inject: ['IUserRepository'],
    },
    {
      provide: ListUsersUseCase,
      useFactory: (userRepository: IUserRepository) => {
        return new ListUsersUseCase(userRepository);
      },
      inject: ['IUserRepository'],
    },
  ],
  exports: [
    'IUserRepository',
    CreateUserUseCase,
    GetUserUseCase,
    UpdateUserUseCase,
    ListUsersUseCase,
  ],
})
export class UserModule {}
