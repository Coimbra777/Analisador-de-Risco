import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { JwtUserPayload } from '../../common/auth/jwt-user-payload.interface';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { AnalysesService } from './analyses.service';

@UseGuards(JwtAuthGuard)
@Controller('analyses')
export class AnalysesController {
  constructor(private readonly analysesService: AnalysesService) {}

  @Post()
  create(
    @Body() createAnalysisDto: CreateAnalysisDto,
    @CurrentUser() currentUser: JwtUserPayload,
  ) {
    return this.analysesService.create(createAnalysisDto, currentUser);
  }

  @Get()
  findAll(@CurrentUser() currentUser: JwtUserPayload) {
    return this.analysesService.findAll(currentUser);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtUserPayload,
  ) {
    return this.analysesService.findOne(id, currentUser);
  }
}
