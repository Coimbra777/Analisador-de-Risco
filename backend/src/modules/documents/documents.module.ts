import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Analysis, Document, RiskFinding } from '../../database/entities';
import { AuthModule } from '../auth/auth.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { LocalFileStorageService } from './services/local-file-storage.service';
import { PdfTextExtractorService } from './services/pdf-text-extractor.service';
import { RiskClassificationService } from './services/risk-classification.service';

@Module({
  imports: [TypeOrmModule.forFeature([Analysis, Document, RiskFinding]), AuthModule],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    LocalFileStorageService,
    PdfTextExtractorService,
    RiskClassificationService,
  ],
})
export class DocumentsModule {}
