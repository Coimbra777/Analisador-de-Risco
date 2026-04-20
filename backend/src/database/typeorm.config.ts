import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { databaseEntities } from './entities';

export function createTypeOrmOptions(
  configService: ConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'mysql',
    host: configService.get<string>('database.host', 'localhost'),
    port: configService.get<number>('database.port', 3306),
    username: configService.get<string>('database.username', 'root'),
    password: configService.get<string>('database.password', 'root'),
    database: configService.get<string>(
      'database.name',
      'supplier_risk_analyzer',
    ),
    entities: databaseEntities,
    migrations: ['dist/database/migrations/*.js'],
    synchronize: false,
    logging: false,
  };
}
