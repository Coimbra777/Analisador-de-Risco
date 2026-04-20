import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { extname } from 'node:path';
import { EntityManager, Repository } from 'typeorm';

import { AnalysisRiskLevel } from '../../database/enums/analysis-risk-level.enum';
import { AnalysisStatus } from '../../database/enums/analysis-status.enum';
import { DocumentStatus } from '../../database/enums/document-status.enum';
import { Analysis, Document, RiskFinding } from '../../database/entities';
import { toAnalysisDetailResponse } from '../analyses/analysis-response.mapper';
import { UploadedPdfFile } from './interfaces/uploaded-pdf-file.interface';
import { RiskClassificationResult } from './interfaces/risk-classification-result.interface';
import { FileStorageService } from './services/file-storage.service';
import { PdfTextService } from './services/pdf-text.service';
import { RiskRulesService } from './services/risk-rules.service';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Analysis)
    private readonly analysesRepository: Repository<Analysis>,
    @InjectRepository(Document)
    private readonly documentsRepository: Repository<Document>,
    private readonly configService: ConfigService,
    private readonly fileStorageService: FileStorageService,
    private readonly pdfTextService: PdfTextService,
    private readonly riskRulesService: RiskRulesService,
  ) {}

  async uploadDocumentForAnalysis(analysisId: number, file: UploadedPdfFile) {
    this.validateFile(file);

    const analysis = await this.getAnalysisOrFail(analysisId);
    await this.markAnalysisAsProcessing(analysis.id);

    let savedDocumentId: number | null = null;

    try {
      const storageKey = await this.fileStorageService.savePdf(file, analysisId);
      savedDocumentId = await this.createDocumentRecord(
        analysis,
        file,
        storageKey,
      );

      const extractedText = await this.pdfTextService.extractText(file.buffer);
      const classification = this.riskRulesService.classify(extractedText);

      await this.finishSuccessfulProcessing(
        analysis.id,
        savedDocumentId,
        classification,
      );
    } catch (error) {
      await this.finishFailedProcessing(analysis.id, savedDocumentId);

      throw error;
    }

    const updatedAnalysis = await this.loadAnalysisDetail(analysis.id);

    return {
      message: 'Document uploaded and analysis processed successfully.',
      analysis: toAnalysisDetailResponse(updatedAnalysis),
    };
  }

  private async getAnalysisOrFail(analysisId: number) {
    const analysis = await this.analysesRepository.findOneBy({ id: analysisId });

    if (!analysis) {
      throw new NotFoundException('Analysis not found.');
    }

    return analysis;
  }

  private async markAnalysisAsProcessing(analysisId: number) {
    await this.analysesRepository.update(analysisId, {
      status: AnalysisStatus.PROCESSING,
      completedAt: null,
    });
  }

  private async createDocumentRecord(
    analysis: Analysis,
    file: UploadedPdfFile,
    storageKey: string,
  ): Promise<number> {
    const document = this.documentsRepository.create({
      analysis,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      storageKey,
      fileSizeBytes: file.size,
      status: DocumentStatus.PENDING,
    });

    const savedDocument = await this.documentsRepository.save(document);

    return savedDocument.id;
  }

  private async finishSuccessfulProcessing(
    analysisId: number,
    documentId: number,
    classification: RiskClassificationResult,
  ) {
    await this.documentsRepository.manager.transaction((manager) =>
      this.applySuccessfulProcessing(manager, analysisId, documentId, classification),
    );
  }

  private async finishFailedProcessing(
    analysisId: number,
    documentId: number | null,
  ) {
    await this.documentsRepository.manager.transaction((manager) =>
      this.applyFailedProcessing(manager, analysisId, documentId),
    );
  }

  private async loadAnalysisDetail(analysisId: number) {
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

    return analysis;
  }

  private async applySuccessfulProcessing(
    manager: EntityManager,
    analysisId: number,
    documentId: number,
    classification: RiskClassificationResult,
  ) {
    await manager.getRepository(Document).update(documentId, {
      status: DocumentStatus.AVAILABLE,
    });

    await manager.getRepository(RiskFinding).delete({
      analysisId,
    });

    const findings = classification.findings.map((finding) =>
      manager.getRepository(RiskFinding).create({
        analysis: { id: analysisId } as Analysis,
        code: finding.code,
        title: finding.title,
        description: finding.description,
        severity: finding.severity,
      }),
    );

    if (findings.length > 0) {
      await manager.getRepository(RiskFinding).save(findings);
    }

    await manager.getRepository(Analysis).update(analysisId, {
      status: AnalysisStatus.DONE,
      riskLevel: classification.riskLevel,
      summaryText: classification.summaryText,
      completedAt: new Date(),
    });
  }

  private async applyFailedProcessing(
    manager: EntityManager,
    analysisId: number,
    documentId: number | null,
  ) {
    if (documentId) {
      await manager.getRepository(Document).update(documentId, {
        status: DocumentStatus.FAILED,
      });
    }

    await manager.getRepository(Analysis).update(analysisId, {
      status: AnalysisStatus.FAILED,
      riskLevel: AnalysisRiskLevel.HIGH,
      summaryText: 'The document could not be processed successfully.',
      completedAt: new Date(),
    });
  }

  private validateFile(file: UploadedPdfFile | undefined): asserts file is UploadedPdfFile {
    if (!file) {
      throw new BadRequestException('A PDF file is required.');
    }

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
