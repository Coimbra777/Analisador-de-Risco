import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JwtUserPayload } from '../../common/auth/jwt-user-payload.interface';
import {
  ANALYSIS_MESSAGES,
  COMPANY_MESSAGES,
} from '../../common/http/api-messages';
import {
  toAnalysisDetailResponse,
  toAnalysisListResponse,
} from '../../common/mappers/analysis-response.mapper';
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
    const company = await this.getOwnedCompanyOrFail(
      createAnalysisDto.companyId,
      currentUser.sub,
    );

    const analysis = this.analysesRepository.create({
      companyId: company.id,
      createdByUserId: currentUser.sub,
      status: AnalysisStatus.PENDING,
    });

    const savedAnalysis = await this.analysesRepository.save(analysis);

    return this.findOne(savedAnalysis.id, currentUser);
  }

  async findAll(currentUser: JwtUserPayload) {
    const analyses = await this.analysesRepository.find({
      where: { createdByUserId: currentUser.sub },
      relations: {
        company: true,
        createdBy: true,
      },
      order: { createdAt: 'DESC' },
    });

    return analyses.map(toAnalysisListResponse);
  }

  async findOne(id: number, currentUser: JwtUserPayload) {
    const analysis = await this.analysesRepository.findOne({
      where: { id },
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

    if (analysis.createdByUserId !== currentUser.sub) {
      throw new ForbiddenException(ANALYSIS_MESSAGES.FORBIDDEN);
    }

    return toAnalysisDetailResponse(analysis);
  }

  private async getOwnedCompanyOrFail(companyId: number, userId: number) {
    const company = await this.companiesRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(COMPANY_MESSAGES.NOT_FOUND);
    }

    if (company.createdByUserId !== userId) {
      throw new ForbiddenException(COMPANY_MESSAGES.FORBIDDEN);
    }

    return company;
  }
}
