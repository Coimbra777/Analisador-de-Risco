import 'dotenv/config';

import { DataSource } from 'typeorm';

import { databaseEntities } from './entities';

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USERNAME ?? 'root',
  password: process.env.DB_PASSWORD ?? 'root',
  database: process.env.DB_DATABASE ?? 'supplier_risk_analyzer',
  entities: databaseEntities,
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: false,
});
