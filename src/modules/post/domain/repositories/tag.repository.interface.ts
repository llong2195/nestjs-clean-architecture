import { Tag } from '../entities/tag.entity';

export interface ITagRepository {
  save(tag: Tag): Promise<Tag>;
  findById(id: string): Promise<Tag | null>;
  findBySlug(slug: string): Promise<Tag | null>;
  findByName(name: string): Promise<Tag | null>;
  findAll(): Promise<Tag[]>;
  delete(id: string): Promise<boolean>;
}
