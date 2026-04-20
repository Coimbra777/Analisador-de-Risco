import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JwtUserPayload } from '../../common/auth/jwt-user-payload.interface';
import { AnalysisStatus } from '../../database/enums/analysis-status.enum';
import { Analysis, Company } from '../../database/entities';
import {
  toAnalysisDetailResponse,
  toAnalysisListResponse,
} from './analysis-response.mapper';
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

    return analyses.map(toAnalysisListResponse);
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

    return toAnalysisDetailResponse(analysis);
  }
}
