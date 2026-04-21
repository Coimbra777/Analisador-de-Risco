import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Analysis, Document, RiskFinding } from '../../database/entities';
import { AuthModule } from '../auth/auth.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { LlmRiskAnalyzer } from './llm-risk.analyzer';
import { RISK_ANALYZER } from './risk-analyzer.contract';
import { SelectingRiskAnalyzer } from './selecting-risk.analyzer';
import { FileStorageService } from './services/file-storage.service';
import { PdfTextService } from './services/pdf-text.service';
import { RiskRulesService } from './services/risk-rules.service';
import { DocxTextExtractor } from './text-extraction/docx-text.extractor';
import { DocumentTextExtractionService } from './text-extraction/document-text-extraction.service';
import { ImageOcrTextExtractor } from './text-extraction/image-ocr-text.extractor';
import { PdfTextExtractor } from './text-extraction/pdf-text.extractor';
import { XlsxTextExtractor } from './text-extraction/xlsx-text.extractor';

@Module({
  imports: [TypeOrmModule.forFeature([Analysis, Document, RiskFinding]), AuthModule],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    FileStorageService,
    PdfTextService,
    PdfTextExtractor,
    DocxTextExtractor,
    XlsxTextExtractor,
    ImageOcrTextExtractor,
    DocumentTextExtractionService,
    RiskRulesService,
    LlmRiskAnalyzer,
    SelectingRiskAnalyzer,
    {
      provide: RISK_ANALYZER,
      useExisting: SelectingRiskAnalyzer,
    },
  ],
})
export class DocumentsModule {}
