import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostOrmEntity } from './infrastructure/persistence/post.orm-entity';
import { CommentOrmEntity } from './infrastructure/persistence/comment.orm-entity';
import { TagOrmEntity } from './infrastructure/persistence/tag.orm-entity';
import { PostTagOrmEntity } from './infrastructure/persistence/post-tag.orm-entity';
import { PostRepository } from './infrastructure/persistence/post.repository';
import { CreatePostUseCase } from './application/use-cases/create-post.use-case';
import { GetPostUseCase } from './application/use-cases/get-post.use-case';
import { UpdatePostUseCase } from './application/use-cases/update-post.use-case';
import { PublishPostUseCase } from './application/use-cases/publish-post.use-case';
import { ListPostsUseCase } from './application/use-cases/list-posts.use-case';
import { PostController } from './interface/http/post.controller';
import type { IPostRepository } from './domain/repositories/post.repository.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostOrmEntity, CommentOrmEntity, TagOrmEntity, PostTagOrmEntity]),
  ],
  controllers: [PostController],
  providers: [
    {
      provide: 'IPostRepository',
      useClass: PostRepository,
    },
    {
      provide: CreatePostUseCase,
      useFactory: (postRepository: IPostRepository) => {
        return new CreatePostUseCase(postRepository);
      },
      inject: ['IPostRepository'],
    },
    {
      provide: GetPostUseCase,
      useFactory: (postRepository: IPostRepository) => {
        return new GetPostUseCase(postRepository);
      },
      inject: ['IPostRepository'],
    },
    {
      provide: UpdatePostUseCase,
      useFactory: (postRepository: IPostRepository) => {
        return new UpdatePostUseCase(postRepository);
      },
      inject: ['IPostRepository'],
    },
    {
      provide: PublishPostUseCase,
      useFactory: (postRepository: IPostRepository) => {
        return new PublishPostUseCase(postRepository);
      },
      inject: ['IPostRepository'],
    },
    {
      provide: ListPostsUseCase,
      useFactory: (postRepository: IPostRepository) => {
        return new ListPostsUseCase(postRepository);
      },
      inject: ['IPostRepository'],
    },
  ],
  exports: [
    'IPostRepository',
    CreatePostUseCase,
    GetPostUseCase,
    UpdatePostUseCase,
    PublishPostUseCase,
    ListPostsUseCase,
  ],
})
export class PostModule {}
