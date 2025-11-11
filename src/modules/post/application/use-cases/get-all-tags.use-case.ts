import { Inject, Injectable } from '@nestjs/common';
import { Tag } from '../../domain/entities/tag.entity';
import type { ITagRepository } from '../../domain/repositories/tag.repository.interface';

@Injectable()
export class GetAllTagsUseCase {
  constructor(
    @Inject('ITagRepository')
    private readonly tagRepository: ITagRepository,
  ) {}

  async execute(): Promise<Tag[]> {
    return await this.tagRepository.findAll();
  }
}
