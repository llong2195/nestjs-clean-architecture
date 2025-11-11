import { v7 as uuidv7 } from 'uuid';

export class Tag {
  private constructor(
    public readonly id: string,
    private _name: string,
    private _slug: string,
  ) {}

  static create(name: string, slug?: string): Tag {
    if (!name || name.trim().length === 0) {
      throw new Error('Tag name cannot be empty');
    }

    if (name.length > 50) {
      throw new Error('Tag name cannot exceed 50 characters');
    }

    const generatedSlug = slug || Tag.generateSlug(name);

    return new Tag(uuidv7(), name.trim(), generatedSlug);
  }

  static reconstitute(id: string, name: string, slug: string): Tag {
    return new Tag(id, name, slug);
  }

  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Tag name cannot be empty');
    }

    if (name.length > 50) {
      throw new Error('Tag name cannot exceed 50 characters');
    }

    this._name = name.trim();
    this._slug = Tag.generateSlug(name);
  }

  // Getters
  get name(): string {
    return this._name;
  }

  get slug(): string {
    return this._slug;
  }
}
