import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Analysis, Document, RiskFinding } from '../../database/entities';
import { AuthModule } from '../auth/auth.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { FileStorageService } from './services/file-storage.service';
import { PdfTextService } from './services/pdf-text.service';
import { RiskRulesService } from './services/risk-rules.service';

@Module({
  imports: [TypeOrmModule.forFeature([Analysis, Document, RiskFinding]), AuthModule],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    FileStorageService,
    PdfTextService,
    RiskRulesService,
  ],
})
export class DocumentsModule {}
