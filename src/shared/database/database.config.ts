import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppConfigService } from '../config/config.service';

export const databaseConfig = (configService: AppConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.databaseHost,
  port: configService.databasePort,
  username: configService.databaseUser,
  password: configService.databasePassword,
  database: configService.databaseName,
  entities: [__dirname + '/../../**/*.orm-entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false, // Use migrations only (per constitution)
  logging: configService.isDevelopment ? ['query', 'error'] : ['error'],
  maxQueryExecutionTime: configService.isDevelopment ? 1000 : undefined,
  poolSize: 10, // Connection pooling
});
