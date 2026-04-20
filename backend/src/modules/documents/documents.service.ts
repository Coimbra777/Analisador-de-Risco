import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { extname } from 'node:path';
import { Repository } from 'typeorm';

import { AnalysisRiskLevel } from '../../database/enums/analysis-risk-level.enum';
import { AnalysisStatus } from '../../database/enums/analysis-status.enum';
import { DocumentStatus } from '../../database/enums/document-status.enum';
import { Analysis, Document, RiskFinding } from '../../database/entities';
import { UploadedPdfFile } from './interfaces/uploaded-pdf-file.interface';
import { LocalFileStorageService } from './services/local-file-storage.service';
import { PdfTextExtractorService } from './services/pdf-text-extractor.service';
import { RiskClassificationService } from './services/risk-classification.service';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Analysis)
    private readonly analysesRepository: Repository<Analysis>,
    @InjectRepository(Document)
    private readonly documentsRepository: Repository<Document>,
    @InjectRepository(RiskFinding)
    private readonly riskFindingsRepository: Repository<RiskFinding>,
    private readonly configService: ConfigService,
    private readonly localFileStorageService: LocalFileStorageService,
    private readonly pdfTextExtractorService: PdfTextExtractorService,
    private readonly riskClassificationService: RiskClassificationService,
  ) {}

  async uploadAndProcess(analysisId: number, file: UploadedPdfFile) {
    if (!file) {
      throw new BadRequestException('A PDF file is required.');
    }

    this.validatePdfFile(file);

    const analysis = await this.analysesRepository.findOne({
      where: { id: analysisId },
      relations: {
        company: true,
        createdBy: true,
        documents: true,
        riskFindings: true,
      },
    });

    if (!analysis) {
      throw new NotFoundException('Analysis not found.');
    }

    analysis.status = AnalysisStatus.IN_PROGRESS;
    analysis.completedAt = null;
    await this.analysesRepository.save(analysis);

    const savedFile = await this.localFileStorageService.savePdf(file, analysisId);

    const document = this.documentsRepository.create({
      analysisId,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      storageKey: savedFile.relativePath,
      fileSizeBytes: file.size,
      status: DocumentStatus.PENDING,
    });

    const savedDocument = await this.documentsRepository.save(document);

    try {
      const extractedText = await this.pdfTextExtractorService.extractText(file.buffer);
      const classification = this.riskClassificationService.classify(extractedText);

      savedDocument.status = DocumentStatus.AVAILABLE;
      await this.documentsRepository.save(savedDocument);

      await this.riskFindingsRepository.delete({ analysisId });

      if (classification.findings.length > 0) {
        const riskFindings = classification.findings.map((finding) =>
          this.riskFindingsRepository.create({
            analysisId,
            code: finding.code,
            title: finding.title,
            description: finding.description,
            severity: finding.severity,
          }),
        );

        await this.riskFindingsRepository.save(riskFindings);
      }

      analysis.status = AnalysisStatus.COMPLETED;
      analysis.riskLevel = classification.riskLevel;
      analysis.summaryText = classification.summaryText;
      analysis.completedAt = new Date();
      await this.analysesRepository.save(analysis);
    } catch (error) {
      savedDocument.status = DocumentStatus.FAILED;
      await this.documentsRepository.save(savedDocument);

      analysis.status = AnalysisStatus.FAILED;
      analysis.riskLevel = AnalysisRiskLevel.HIGH;
      analysis.summaryText =
        'The document could not be processed successfully.';
      analysis.completedAt = new Date();
      await this.analysesRepository.save(analysis);

      throw error;
    }

    const updatedAnalysis = await this.analysesRepository.findOne({
      where: { id: analysisId },
      relations: {
        company: true,
        createdBy: true,
        documents: true,
        riskFindings: true,
      },
    });

    return {
      message: 'Document uploaded and analysis processed successfully.',
      analysis: updatedAnalysis,
    };
  }

  private validatePdfFile(file: UploadedPdfFile) {
    const maxFileSizeBytes = this.configService.get<number>(
      'storage.maxFileSizeBytes',
      5 * 1024 * 1024,
    );

    if (file.mimetype !== 'application/pdf') {
      const fileExtension = extname(file.originalname).toLowerCase();

      if (fileExtension !== '.pdf') {
        throw new BadRequestException('Only PDF files are allowed.');
      }
    }

    if (file.size > maxFileSizeBytes) {
      throw new BadRequestException(
        `File exceeds maximum size of ${maxFileSizeBytes} bytes.`,
      );
    }
  }
}
