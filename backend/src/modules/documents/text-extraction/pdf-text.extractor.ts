import { Injectable } from '@nestjs/common';

import { PdfTextService } from '../services/pdf-text.service';
import type {
  DocumentTextExtractInput,
  DocumentTextExtractor,
} from './document-text-extractor.contract';

@Injectable()
export class PdfTextExtractor implements DocumentTextExtractor {
  constructor(private readonly pdfTextService: PdfTextService) {}

  supports(mimetype: string, fileExtension: string): boolean {
    if (mimetype === 'application/pdf') {
      return true;
    }

    return fileExtension === '.pdf';
  }

  extract(input: DocumentTextExtractInput): Promise<string> {
    return this.pdfTextService.extractText(input.buffer);
  }
}
