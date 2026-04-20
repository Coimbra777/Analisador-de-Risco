import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Company } from '../../database/entities';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
  ) {}

  async create(createCompanyDto: CreateCompanyDto) {
    const existingCompany = await this.companiesRepository.findOne({
      where: { registrationNumber: createCompanyDto.registrationNumber },
    });

    if (existingCompany) {
      throw new ConflictException('Registration number is already in use.');
    }

    const company = this.companiesRepository.create({
      legalName: createCompanyDto.legalName,
      tradeName: createCompanyDto.tradeName ?? null,
      registrationNumber: createCompanyDto.registrationNumber,
      country: createCompanyDto.country ?? null,
    });

    const savedCompany = await this.companiesRepository.save(company);

    return this.toCompanyResponse(savedCompany);
  }

  async findAll() {
    const companies = await this.companiesRepository.find({
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
