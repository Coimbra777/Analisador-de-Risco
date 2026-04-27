import { Module } from "@nestjs/common";

import { AppConfigModule } from "./config/app-config.module";
import { DatabaseModule } from "./database/database.module";
import { AnalysesModule } from "./modules/analyses/analyses.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CompaniesModule } from "./modules/companies/companies.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { HealthModule } from "./modules/health/health.module";

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    AuthModule,
    HealthModule,
    CompaniesModule,
    AnalysesModule,
    DocumentsModule,
  ],
})
export class AppModule {}
