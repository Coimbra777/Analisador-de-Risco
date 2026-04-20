import { Module } from '@nestjs/common';

import { AppConfigModule } from './config/app-config.module';
import { AnalysesModule } from './modules/analyses/analyses.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { HealthModule } from './modules/health/health.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';

@Module({
  imports: [
    AppConfigModule,
    HealthModule,
    SuppliersModule,
    AnalysesModule,
    DocumentsModule,
  ],
})
export class AppModule {}
