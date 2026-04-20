import {
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { UploadedPdfFile } from './interfaces/uploaded-pdf-file.interface';
import { DocumentsService } from './documents.service';

@UseGuards(JwtAuthGuard)
@Controller('analyses/:analysisId/document')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('analysisId', ParseIntPipe) analysisId: number,
    @UploadedFile() file: UploadedPdfFile,
  ) {
    return this.documentsService.uploadAndProcess(analysisId, file);
  }
}
