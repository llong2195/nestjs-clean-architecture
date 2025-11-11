export interface IBaseRepository<T> {
  /**
   * Find entity by ID
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find all entities with optional pagination
   */
  findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'ASC' | 'DESC'>;
  }): Promise<T[]>;

  /**
   * Save entity (create or update)
   */
  save(entity: T): Promise<T>;

  /**
   * Save multiple entities
   */
  saveMany(entities: T[]): Promise<T[]>;

  /**
   * Delete entity by ID
   */
  deleteById(id: string): Promise<boolean>;

  /**
   * Count total entities
   */
  count(where?: Record<string, unknown>): Promise<number>;

  /**
   * Check if entity exists by ID
   */
  exists(id: string): Promise<boolean>;
}
