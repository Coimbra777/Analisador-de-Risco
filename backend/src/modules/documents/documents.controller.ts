import { Body, Controller, Post } from '@nestjs/common';

import { RegisterDocumentDto } from './dto/register-document.dto';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  create(@Body() registerDocumentDto: RegisterDocumentDto) {
    return this.documentsService.create(registerDocumentDto);
  }
}
