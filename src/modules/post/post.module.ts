import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostOrmEntity } from './infrastructure/persistence/post.orm-entity';
import { CommentOrmEntity } from './infrastructure/persistence/comment.orm-entity';
import { TagOrmEntity } from './infrastructure/persistence/tag.orm-entity';
import { PostTagOrmEntity } from './infrastructure/persistence/post-tag.orm-entity';
import { PostRepository } from './infrastructure/persistence/post.repository';
import { CommentRepository } from './infrastructure/persistence/comment.repository';
import { TagRepository } from './infrastructure/persistence/tag.repository';
import { PostOrmMapper } from './infrastructure/mappers/post-orm.mapper';
import { CommentOrmMapper } from './infrastructure/mappers/comment-orm.mapper';
import { TagOrmMapper } from './infrastructure/mappers/tag-orm.mapper';
import { CreatePostUseCase } from './application/use-cases/create-post.use-case';
import { GetPostUseCase } from './application/use-cases/get-post.use-case';
import { UpdatePostUseCase } from './application/use-cases/update-post.use-case';
import { PublishPostUseCase } from './application/use-cases/publish-post.use-case';
import { ListPostsUseCase } from './application/use-cases/list-posts.use-case';
import { CreateCommentUseCase } from './application/use-cases/create-comment.use-case';
import { GetCommentsByPostUseCase } from './application/use-cases/get-comments-by-post.use-case';
import { DeleteCommentUseCase } from './application/use-cases/delete-comment.use-case';
import { CreateTagUseCase } from './application/use-cases/create-tag.use-case';
import { GetAllTagsUseCase } from './application/use-cases/get-all-tags.use-case';
import { GetPostsByTagUseCase } from './application/use-cases/get-posts-by-tag.use-case';
import { PostController } from './interface/http/post.controller';
import { CommentController } from './interface/http/comment.controller';
import { TagController } from './interface/http/tag.controller';
import { PostCacheService } from './infrastructure/cache/post-cache.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostOrmEntity, CommentOrmEntity, TagOrmEntity, PostTagOrmEntity]),
  ],
  controllers: [PostController, CommentController, TagController],
  providers: [
    PostCacheService,
    // ORM Mappers
    PostOrmMapper,
    CommentOrmMapper,
    TagOrmMapper,
    // Repository implementations
    {
      provide: 'IPostRepository',
      useClass: PostRepository,
    },
    {
      provide: 'ICommentRepository',
      useClass: CommentRepository,
    },
    {
      provide: 'ITagRepository',
      useClass: TagRepository,
    },
    // Post use cases
    CreatePostUseCase,
    GetPostUseCase,
    UpdatePostUseCase,
    PublishPostUseCase,
    ListPostsUseCase,
    // Comment use cases
    CreateCommentUseCase,
    GetCommentsByPostUseCase,
    DeleteCommentUseCase,
    // Tag use cases
    CreateTagUseCase,
    GetAllTagsUseCase,
    GetPostsByTagUseCase,
  ],
  exports: [
    'IPostRepository',
    'ICommentRepository',
    'ITagRepository',
    CreatePostUseCase,
    GetPostUseCase,
    UpdatePostUseCase,
    PublishPostUseCase,
    ListPostsUseCase,
    CreateCommentUseCase,
    GetCommentsByPostUseCase,
    DeleteCommentUseCase,
    CreateTagUseCase,
    GetAllTagsUseCase,
    GetPostsByTagUseCase,
  ],
})
export class PostModule {}
