import { DataSource } from 'typeorm';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

export class DatabaseTestHelper {
  private static container: StartedPostgreSqlContainer;
  private static dataSource: DataSource;

  /**
   * Start PostgreSQL container and create DataSource
   */
  static async setupDatabase(): Promise<DataSource> {
    // Start PostgreSQL container
    this.container = await new PostgreSqlContainer('postgres:18-alpine')
      .withDatabase('test_db')
      .withUsername('test_user')
      .withPassword('test_password')
      .withExposedPorts(5432)
      .start();

    // Create TypeORM DataSource
    this.dataSource = new DataSource({
      type: 'postgres',
      host: this.container.getHost(),
      port: this.container.getPort(),
      username: this.container.getUsername(),
      password: this.container.getPassword(),
      database: this.container.getDatabase(),
      entities: [__dirname + '/../../src/**/*.orm-entity.ts'],
      synchronize: true, // Auto-create schema for tests
      logging: false,
    });

    await this.dataSource.initialize();
    return this.dataSource;
  }

  /**
   * Get the current DataSource instance
   */
  static getDataSource(): DataSource {
    if (!this.dataSource) {
      throw new Error('DataSource not initialized. Call setupDatabase() first.');
    }
    return this.dataSource;
  }

  /**
   * Clean all tables (but keep schema)
   */
  static async cleanDatabase(): Promise<void> {
    const entities = this.dataSource.entityMetadatas;

    // Disable foreign key checks
    await this.dataSource.query('SET session_replication_role = replica;');

    // Truncate all tables
    for (const entity of entities) {
      const repository = this.dataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
    }

    // Re-enable foreign key checks
    await this.dataSource.query('SET session_replication_role = DEFAULT;');
  }

  /**
   * Close DataSource and stop container
   */
  static async teardownDatabase(): Promise<void> {
    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy();
    }

    if (this.container) {
      await this.container.stop();
    }
  }

  /**
   * Run migrations (if needed for specific tests)
   */
  static async runMigrations(): Promise<void> {
    await this.dataSource.runMigrations();
  }

  /**
   * Revert all migrations
   */
  static async revertMigrations(): Promise<void> {
    await this.dataSource.undoLastMigration();
  }
}
