import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { COMPANY_MESSAGES } from '../../common/http/api-messages';
import { JwtUserPayload } from '../../common/auth/jwt-user-payload.interface';
import { Company } from '../../database/entities';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
  ) {}

  async create(createCompanyDto: CreateCompanyDto, currentUser: JwtUserPayload) {
    const existingCompany = await this.companiesRepository.findOne({
      where: {
        createdByUserId: currentUser.sub,
        registrationNumber: createCompanyDto.registrationNumber,
      },
    });

    if (existingCompany) {
      throw new ConflictException(
        COMPANY_MESSAGES.REGISTRATION_NUMBER_ALREADY_IN_USE,
      );
    }

    const company = this.companiesRepository.create({
      createdByUserId: currentUser.sub,
      legalName: createCompanyDto.legalName,
      tradeName: createCompanyDto.tradeName ?? null,
      registrationNumber: createCompanyDto.registrationNumber,
      country: createCompanyDto.country ?? null,
    });

    const savedCompany = await this.companiesRepository.save(company);

    return this.toCompanyResponse(savedCompany);
  }

  async findAll(currentUser: JwtUserPayload) {
    const companies = await this.companiesRepository.find({
      where: { createdByUserId: currentUser.sub },
      order: { createdAt: 'DESC' },
    });

    return companies.map((company) => this.toCompanyResponse(company));
  }

  private toCompanyResponse(company: Company) {
    return {
      id: company.id,
      legalName: company.legalName,
      tradeName: company.tradeName,
      registrationNumber: company.registrationNumber,
      country: company.country,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }
}
