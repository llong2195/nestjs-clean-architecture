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
import { PostCacheService } from './infrastructure/cache/post-cache.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostOrmEntity, CommentOrmEntity, TagOrmEntity, PostTagOrmEntity]),
  ],
  controllers: [PostController],
  providers: [
    PostCacheService,
    // Repository implementation
    {
      provide: 'IPostRepository',
      useClass: PostRepository,
    },
    // Use cases
    CreatePostUseCase,
    GetPostUseCase,
    UpdatePostUseCase,
    PublishPostUseCase,
    ListPostsUseCase,
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
