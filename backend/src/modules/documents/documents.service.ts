import { Injectable, NotImplementedException } from '@nestjs/common';

import { RegisterDocumentDto } from './dto/register-document.dto';

@Injectable()
export class DocumentsService {
  create(_registerDocumentDto: RegisterDocumentDto) {
    throw new NotImplementedException('Document registration is not implemented yet.');
  }
}
