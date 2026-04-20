import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { extname } from 'node:path';
import { EntityManager, Repository } from 'typeorm';

import { JwtUserPayload } from '../../common/auth/jwt-user-payload.interface';
import {
  ANALYSIS_MESSAGES,
  DOCUMENT_MESSAGES,
} from '../../common/http/api-messages';
import { toAnalysisDetailResponse } from '../../common/mappers/analysis-response.mapper';
import { AnalysisStatus } from '../../database/enums/analysis-status.enum';
import { DocumentStatus } from '../../database/enums/document-status.enum';
import { Analysis, Document, RiskFinding } from '../../database/entities';
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

  async uploadForAnalysis(
    analysisId: number,
    file: UploadedPdfFile,
    currentUser: JwtUserPayload,
  ) {
    this.validateUploadedFile(file);

    const analysis = await this.loadOwnedAnalysisOrFail(analysisId, currentUser.sub);
    await this.markAnalysisAsProcessing(analysis.id);

    let documentId: number | null = null;

    try {
      const storageKey = await this.fileStorageService.savePdf(file, analysisId);
      documentId = await this.saveDocumentMetadata(
        analysis.id,
        file,
        storageKey,
      );
      const savedDocumentId = documentId;

      const classification = await this.classifyUploadedDocument(file.buffer);

      await this.documentsRepository.manager.transaction((manager) =>
        this.completeSuccessfulProcessing(
          manager,
          analysis.id,
          savedDocumentId,
          classification,
        ),
      );
    } catch (error) {
      await this.documentsRepository.manager.transaction((manager) =>
        this.completeFailedProcessing(manager, analysis.id, documentId),
      );

      throw error;
    }

    const updatedAnalysis = await this.loadAnalysisDetail(analysis.id, currentUser.sub);

    return {
      message: DOCUMENT_MESSAGES.UPLOAD_SUCCESS,
      analysis: toAnalysisDetailResponse(updatedAnalysis),
    };
  }

  private async loadOwnedAnalysisOrFail(analysisId: number, userId: number) {
    const analysis = await this.analysesRepository.findOneBy({ id: analysisId });

    if (!analysis) {
      throw new NotFoundException(ANALYSIS_MESSAGES.NOT_FOUND);
    }

    if (analysis.createdByUserId !== userId) {
      throw new ForbiddenException(ANALYSIS_MESSAGES.FORBIDDEN);
    }

    return analysis;
  }

  private async classifyUploadedDocument(fileBuffer: Buffer) {
    const extractedText = await this.pdfTextService.extractText(fileBuffer);
    this.assertReadableText(extractedText);

    return this.riskRulesService.classify(extractedText);
  }

  private async markAnalysisAsProcessing(analysisId: number) {
    await this.analysesRepository.update(analysisId, {
      status: AnalysisStatus.PROCESSING,
      completedAt: null,
    });
  }

  private async saveDocumentMetadata(
    analysisId: number,
    file: UploadedPdfFile,
    storageKey: string,
  ): Promise<number> {
    const document = this.documentsRepository.create({
      analysis: { id: analysisId } as Analysis,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      storageKey,
      fileSizeBytes: file.size,
      status: DocumentStatus.PENDING,
    });

    const savedDocument = await this.documentsRepository.save(document);

    return savedDocument.id;
  }

  private async loadAnalysisDetail(analysisId: number, userId: number) {
    const analysis = await this.analysesRepository.findOne({
      where: { id: analysisId, createdByUserId: userId },
      relations: {
        company: true,
        createdBy: true,
        documents: true,
        riskFindings: true,
      },
    });

    if (!analysis) {
      throw new NotFoundException(ANALYSIS_MESSAGES.NOT_FOUND);
    }

    return analysis;
  }

  private async completeSuccessfulProcessing(
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

  private async completeFailedProcessing(
    manager: EntityManager,
    analysisId: number,
    documentId: number | null,
  ) {
    if (documentId) {
      await manager.getRepository(Document).update(documentId, {
        status: DocumentStatus.FAILED,
      });
    }

    await manager.getRepository(RiskFinding).delete({
      analysisId,
    });

    await manager.getRepository(Analysis).update(analysisId, {
      status: AnalysisStatus.FAILED,
      riskLevel: null,
      summaryText: DOCUMENT_MESSAGES.PROCESSING_FAILED,
      completedAt: new Date(),
    });
  }

  private assertReadableText(text: string) {
    if (text.trim().length === 0) {
      throw new BadRequestException(DOCUMENT_MESSAGES.UNREADABLE_PDF);
    }
  }

  private validateUploadedFile(file: UploadedPdfFile | undefined): asserts file is UploadedPdfFile {
    if (!file) {
      throw new BadRequestException(DOCUMENT_MESSAGES.PDF_REQUIRED);
    }

    this.assertPdfFile(file);
    this.assertFileSizeWithinLimit(file);
  }

  private assertPdfFile(file: UploadedPdfFile) {
    if (file.mimetype === 'application/pdf') {
      return;
    }

    const fileExtension = extname(file.originalname).toLowerCase();

    if (fileExtension !== '.pdf') {
      throw new BadRequestException(DOCUMENT_MESSAGES.PDF_ONLY);
    }
  }

  private assertFileSizeWithinLimit(file: UploadedPdfFile) {
    const maxFileSizeBytes = this.configService.get<number>(
      'storage.maxFileSizeBytes',
      5 * 1024 * 1024,
    );

    if (file.size <= maxFileSizeBytes) {
      return;
    }

    throw new BadRequestException(
      `The file exceeds the maximum size of ${maxFileSizeBytes} bytes.`,
    );
  }
}
