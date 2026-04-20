import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { JwtUserPayload } from '../../common/auth/jwt-user-payload.interface';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';

@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  create(
    @Body() createCompanyDto: CreateCompanyDto,
    @CurrentUser() currentUser: JwtUserPayload,
  ) {
    return this.companiesService.create(createCompanyDto, currentUser);
  }

  @Get()
  findAll(@CurrentUser() currentUser: JwtUserPayload) {
    return this.companiesService.findAll(currentUser);
  }
}
