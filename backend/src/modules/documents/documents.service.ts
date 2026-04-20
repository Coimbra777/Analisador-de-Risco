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
import { RiskClassificationResult } from './interfaces/risk-classification-result.interface';
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

    const analysis = await this.analysesRepository.findOneBy({ id: analysisId });

    if (!analysis) {
      throw new NotFoundException('Analysis not found.');
    }

    await this.analysesRepository.update(analysisId, {
      status: AnalysisStatus.IN_PROGRESS,
      completedAt: null,
    });

    const savedFile = await this.localFileStorageService.savePdf(file, analysisId);
    let savedDocumentId: number | null = null;

    try {
      savedDocumentId = await this.insertDocumentRecord(analysisId, file, savedFile.relativePath);

      const extractedText = await this.pdfTextExtractorService.extractText(file.buffer);
      const classification = this.riskClassificationService.classify(extractedText);

      await this.persistSuccessfulProcessing(
        analysisId,
        savedDocumentId,
        classification,
      );
    } catch (error) {
      await this.persistFailedProcessing(analysisId, savedDocumentId);

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

  private async insertDocumentRecord(
    analysisId: number,
    file: UploadedPdfFile,
    storageKey: string,
  ): Promise<number> {
    const result = (await this.documentsRepository.query(
      `
        INSERT INTO documents (
          analysis_id,
          original_filename,
          mime_type,
          storage_key,
          file_size_bytes,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        analysisId,
        file.originalname,
        file.mimetype,
        storageKey,
        file.size,
        DocumentStatus.PENDING,
      ],
    )) as { insertId?: number };

    const documentId = Number(result.insertId);

    if (!documentId) {
      throw new Error('Failed to persist document record.');
    }

    return documentId;
  }

  private async persistSuccessfulProcessing(
    analysisId: number,
    documentId: number,
    classification: RiskClassificationResult,
  ) {
    await this.documentsRepository.manager.transaction(async (manager) => {
      await manager.query('UPDATE documents SET status = ? WHERE id = ?', [
        DocumentStatus.AVAILABLE,
        documentId,
      ]);

      await manager.query('DELETE FROM risk_findings WHERE analysis_id = ?', [
        analysisId,
      ]);

      for (const finding of classification.findings) {
        await manager.query(
          `
            INSERT INTO risk_findings (
              analysis_id,
              code,
              title,
              description,
              severity
            )
            VALUES (?, ?, ?, ?, ?)
          `,
          [
            analysisId,
            finding.code,
            finding.title,
            finding.description,
            finding.severity,
          ],
        );
      }

      await manager.query(
        `
          UPDATE analyses
          SET status = ?, risk_level = ?, summary_text = ?, completed_at = ?
          WHERE id = ?
        `,
        [
          AnalysisStatus.COMPLETED,
          classification.riskLevel,
          classification.summaryText,
          new Date(),
          analysisId,
        ],
      );
    });
  }

  private async persistFailedProcessing(
    analysisId: number,
    documentId: number | null,
  ) {
    await this.documentsRepository.manager.transaction(async (manager) => {
      if (documentId) {
        await manager.query('UPDATE documents SET status = ? WHERE id = ?', [
          DocumentStatus.FAILED,
          documentId,
        ]);
      }

      await manager.query(
        `
          UPDATE analyses
          SET status = ?, risk_level = ?, summary_text = ?, completed_at = ?
          WHERE id = ?
        `,
        [
          AnalysisStatus.FAILED,
          AnalysisRiskLevel.HIGH,
          'The document could not be processed successfully.',
          new Date(),
          analysisId,
        ],
      );
    });
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
