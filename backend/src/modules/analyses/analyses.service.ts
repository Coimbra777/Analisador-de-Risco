import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JwtUserPayload } from '../../common/auth/jwt-user-payload.interface';
import { AnalysisStatus } from '../../database/enums/analysis-status.enum';
import { Analysis, Company } from '../../database/entities';
import { CreateAnalysisDto } from './dto/create-analysis.dto';

@Injectable()
export class AnalysesService {
  constructor(
    @InjectRepository(Analysis)
    private readonly analysesRepository: Repository<Analysis>,
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
  ) {}

  async create(createAnalysisDto: CreateAnalysisDto, currentUser: JwtUserPayload) {
    const company = await this.companiesRepository.findOne({
      where: { id: createAnalysisDto.companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found.');
    }

    const analysis = this.analysesRepository.create({
      companyId: company.id,
      createdByUserId: currentUser.sub,
      status: AnalysisStatus.PENDING,
    });

    const savedAnalysis = await this.analysesRepository.save(analysis);

    return this.findOne(savedAnalysis.id);
  }

  async findAll() {
    const analyses = await this.analysesRepository.find({
      relations: {
        company: true,
        createdBy: true,
      },
      order: { createdAt: 'DESC' },
    });

    return analyses.map((analysis) => this.toAnalysisListResponse(analysis));
  }

  async findOne(id: number) {
    const analysis = await this.analysesRepository.findOne({
      where: { id },
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

    return this.toAnalysisDetailResponse(analysis);
  }

  private toAnalysisListResponse(analysis: Analysis) {
    return {
      id: analysis.id,
      status: analysis.status,
      riskLevel: analysis.riskLevel,
      summaryText: analysis.summaryText,
      completedAt: analysis.completedAt,
      company: {
        id: analysis.company.id,
        legalName: analysis.company.legalName,
        registrationNumber: analysis.company.registrationNumber,
      },
      createdBy: {
        id: analysis.createdBy.id,
        name: analysis.createdBy.name,
        email: analysis.createdBy.email,
      },
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt,
    };
  }

  private toAnalysisDetailResponse(analysis: Analysis) {
    return {
      ...this.toAnalysisListResponse(analysis),
      documents: analysis.documents.map((document) => ({
        id: document.id,
        originalFilename: document.originalFilename,
        mimeType: document.mimeType,
        storageKey: document.storageKey,
        fileSizeBytes: document.fileSizeBytes,
        status: document.status,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      })),
      riskFindings: analysis.riskFindings.map((riskFinding) => ({
        id: riskFinding.id,
        code: riskFinding.code,
        title: riskFinding.title,
        description: riskFinding.description,
        severity: riskFinding.severity,
        createdAt: riskFinding.createdAt,
        updatedAt: riskFinding.updatedAt,
      })),
    };
  }
}
