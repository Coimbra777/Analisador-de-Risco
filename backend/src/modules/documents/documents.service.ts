import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";

import { JwtUserPayload } from "../../common/auth/jwt-user-payload.interface";
import {
  ANALYSIS_MESSAGES,
  DOCUMENT_MESSAGES,
} from "../../common/http/api-messages";
import { toAnalysisDetailResponse } from "../../common/mappers/analysis-response.mapper";
import { AnalysisStatus } from "../../database/enums/analysis-status.enum";
import { DocumentStatus } from "../../database/enums/document-status.enum";
import { Analysis, Document, RiskFinding } from "../../database/entities";
import { UploadedDocumentFile } from "./interfaces/uploaded-document-file.interface";
import { RiskClassificationResult } from "./interfaces/risk-classification-result.interface";
import {
  buildConsolidatedAnalysisSummary,
  maxDocumentRiskLevel,
  partitionDocumentsByProcessingState,
} from "./analysis-aggregate.util";
import { RISK_ANALYZER, type RiskAnalyzer } from "./risk-analyzer.contract";
import { FileStorageService } from "./services/file-storage.service";
import { DocumentTextExtractionService } from "./text-extraction/document-text-extraction.service";

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Analysis)
    private readonly analysesRepository: Repository<Analysis>,
    @InjectRepository(Document)
    private readonly documentsRepository: Repository<Document>,
    private readonly configService: ConfigService,
    private readonly fileStorageService: FileStorageService,
    private readonly documentTextExtraction: DocumentTextExtractionService,
    @Inject(RISK_ANALYZER)
    private readonly riskAnalyzer: RiskAnalyzer,
  ) {}

  async uploadForAnalysis(
    analysisId: number,
    file: UploadedDocumentFile,
    currentUser: JwtUserPayload,
  ) {
    this.validateUploadedFile(file);

    const analysis = await this.loadOwnedAnalysisOrFail(
      analysisId,
      currentUser.sub,
    );
    await this.markAnalysisAsProcessing(analysis.id);

    let documentId: number | null = null;

    try {
      const storageKey = await this.fileStorageService.saveUploadedFile(
        file,
        analysisId,
      );
      documentId = await this.saveDocumentMetadata(
        analysis.id,
        file,
        storageKey,
      );
      const savedDocumentId = documentId;

      const { extractedText, classification } =
        await this.extractAndClassifyDocument(file);

      await this.documentsRepository.manager.transaction((manager) =>
        this.completeSuccessfulProcessing(
          manager,
          analysis.id,
          savedDocumentId,
          extractedText,
          classification,
        ),
      );
    } catch (error) {
      await this.documentsRepository.manager.transaction((manager) =>
        this.completeFailedProcessing(manager, analysis.id, documentId),
      );

      throw error;
    }

    const updatedAnalysis = await this.loadAnalysisDetail(
      analysis.id,
      currentUser.sub,
    );

    return {
      message: DOCUMENT_MESSAGES.UPLOAD_SUCCESS,
      analysis: toAnalysisDetailResponse(updatedAnalysis),
    };
  }

  private async loadOwnedAnalysisOrFail(analysisId: number, userId: number) {
    const analysis = await this.analysesRepository.findOneBy({
      id: analysisId,
    });

    if (!analysis) {
      throw new NotFoundException(ANALYSIS_MESSAGES.NOT_FOUND);
    }

    if (analysis.createdByUserId !== userId) {
      throw new ForbiddenException(ANALYSIS_MESSAGES.FORBIDDEN);
    }

    return analysis;
  }

  private async extractAndClassifyDocument(file: UploadedDocumentFile) {
    const extractedText = await this.documentTextExtraction.extractText({
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalFilename: file.originalname,
    });
    this.assertNonEmptyExtractedText(extractedText);

    const classification = await this.riskAnalyzer.analyze({
      extractedText,
    });

    return { extractedText, classification };
  }

  private async markAnalysisAsProcessing(analysisId: number) {
    await this.analysesRepository.update(analysisId, {
      status: AnalysisStatus.PROCESSING,
      completedAt: null,
    });
  }

  private async saveDocumentMetadata(
    analysisId: number,
    file: UploadedDocumentFile,
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
        riskFindings: { document: true },
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
    extractedText: string,
    classification: RiskClassificationResult,
  ) {
    await manager.getRepository(Document).update(documentId, {
      status: DocumentStatus.AVAILABLE,
      extractedText,
      summaryText: classification.summaryText,
      riskLevel: classification.riskLevel,
    });

    await manager.getRepository(RiskFinding).delete({
      documentId,
    });

    const findings = classification.findings.map((finding) =>
      manager.getRepository(RiskFinding).create({
        analysisId,
        documentId,
        code: finding.code,
        title: finding.title,
        description: finding.description,
        severity: finding.severity,
      }),
    );

    if (findings.length > 0) {
      await manager.getRepository(RiskFinding).save(findings);
    }

    await this.syncAnalysisAggregate(manager, analysisId);
  }

  private async completeFailedProcessing(
    manager: EntityManager,
    analysisId: number,
    documentId: number | null,
  ) {
    if (documentId) {
      await manager.getRepository(Document).update(documentId, {
        status: DocumentStatus.FAILED,
        extractedText: null,
        summaryText: null,
        riskLevel: null,
      });

      await manager.getRepository(RiskFinding).delete({
        documentId,
      });

      await this.syncAnalysisAggregate(manager, analysisId);

      return;
    }

    await manager.getRepository(Analysis).update(analysisId, {
      status: AnalysisStatus.FAILED,
      riskLevel: null,
      summaryText: DOCUMENT_MESSAGES.PROCESSING_FAILED,
      completedAt: new Date(),
    });
  }

  private async syncAnalysisAggregate(
    manager: EntityManager,
    analysisId: number,
  ) {
    const documents = await manager.getRepository(Document).find({
      where: { analysisId },
      order: { id: "ASC" },
    });

    const { available, failed, pending } =
      partitionDocumentsByProcessingState(documents);

    const everyDocumentTerminal =
      documents.length > 0 &&
      pending.length === 0 &&
      available.length + failed.length === documents.length;

    const allFailed =
      everyDocumentTerminal && available.length === 0 && failed.length > 0;

    let status: AnalysisStatus;
    let riskLevel: ReturnType<typeof maxDocumentRiskLevel> = null;
    let summaryText: string | null = null;
    let completedAt: Date | null = null;

    if (available.length > 0) {
      status = AnalysisStatus.DONE;
      riskLevel = maxDocumentRiskLevel(
        available.map((document) => document.riskLevel!),
      );
      summaryText = buildConsolidatedAnalysisSummary(available, failed.length);
      completedAt = new Date();
    } else if (allFailed) {
      status = AnalysisStatus.FAILED;
      riskLevel = null;
      summaryText = DOCUMENT_MESSAGES.PROCESSING_FAILED;
      completedAt = new Date();
    } else if (documents.length === 0) {
      status = AnalysisStatus.PENDING;
      riskLevel = null;
      summaryText = null;
      completedAt = null;
    } else {
      status = AnalysisStatus.PROCESSING;
      riskLevel = null;
      summaryText = null;
      completedAt = null;
    }

    await manager.getRepository(Analysis).update(analysisId, {
      status,
      riskLevel,
      summaryText,
      completedAt,
    });
  }

  private assertNonEmptyExtractedText(text: string) {
    if (text.trim().length === 0) {
      throw new BadRequestException(DOCUMENT_MESSAGES.EXTRACTION_EMPTY);
    }
  }

  private validateUploadedFile(
    file: UploadedDocumentFile | undefined,
  ): asserts file is UploadedDocumentFile {
    if (!file) {
      throw new BadRequestException(DOCUMENT_MESSAGES.FILE_REQUIRED);
    }

    this.assertSupportedDocumentType(file);
    this.assertFileSizeWithinLimit(file);
  }

  private assertSupportedDocumentType(file: UploadedDocumentFile) {
    if (
      this.documentTextExtraction.isSupported(file.mimetype, file.originalname)
    ) {
      return;
    }

    throw new BadRequestException(DOCUMENT_MESSAGES.UNSUPPORTED_FILE_TYPE);
  }

  private assertFileSizeWithinLimit(file: UploadedDocumentFile) {
    const maxFileSizeBytes = this.configService.get<number>(
      "storage.maxFileSizeBytes",
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
