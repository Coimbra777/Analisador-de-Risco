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

import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { JwtUserPayload } from '../../common/auth/jwt-user-payload.interface';
import { UploadedDocumentFile } from './interfaces/uploaded-document-file.interface';
import { DocumentsService } from './documents.service';

@UseGuards(JwtAuthGuard)
@Controller('analyses/:analysisId/document')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @Param('analysisId', ParseIntPipe) analysisId: number,
    @UploadedFile() file: UploadedDocumentFile,
    @CurrentUser() currentUser: JwtUserPayload,
  ) {
    return this.documentsService.uploadForAnalysis(
      analysisId,
      file,
      currentUser,
    );
  }
}
