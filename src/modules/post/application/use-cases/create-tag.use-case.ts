import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { Tag } from '../../domain/entities/tag.entity';
import type { ITagRepository } from '../../domain/repositories/tag.repository.interface';

@Injectable()
export class CreateTagUseCase {
  constructor(
    @Inject('ITagRepository')
    private readonly tagRepository: ITagRepository,
  ) {}

  async execute(name: string, slug?: string): Promise<Tag> {
    // Check if tag with same name already exists
    const existingByName = await this.tagRepository.findByName(name);
    if (existingByName) {
      throw new ConflictException(`Tag with name "${name}" already exists`);
    }

    // If slug provided, check if it's unique
    if (slug) {
      const existingBySlug = await this.tagRepository.findBySlug(slug);
      if (existingBySlug) {
        throw new ConflictException(`Tag with slug "${slug}" already exists`);
      }
    }

    const tag = Tag.create(name, slug);
    return await this.tagRepository.save(tag);
  }
}
