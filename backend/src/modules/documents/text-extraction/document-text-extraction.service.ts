import { BadRequestException, Injectable } from '@nestjs/common';
import { extname } from 'node:path';

import { DOCUMENT_MESSAGES } from '../../../common/http/api-messages';
import type {
  DocumentTextExtractInput,
  DocumentTextExtractor,
} from './document-text-extractor.contract';
import { DocxTextExtractor } from './docx-text.extractor';
import { ImageOcrTextExtractor } from './image-ocr-text.extractor';
import { PdfTextExtractor } from './pdf-text.extractor';
import { XlsxTextExtractor } from './xlsx-text.extractor';

/**
 * Orquestrador mínimo: escolhe o primeiro extractor compatível com mime/extensão.
 * Ordem importa quando `application/octet-stream` cai na extensão para desambiguar.
 */
@Injectable()
export class DocumentTextExtractionService {
  private readonly extractors: DocumentTextExtractor[];

  constructor(
    private readonly pdfTextExtractor: PdfTextExtractor,
    private readonly docxTextExtractor: DocxTextExtractor,
    private readonly xlsxTextExtractor: XlsxTextExtractor,
    private readonly imageOcrTextExtractor: ImageOcrTextExtractor,
  ) {
    this.extractors = [
      this.pdfTextExtractor,
      this.docxTextExtractor,
      this.xlsxTextExtractor,
      this.imageOcrTextExtractor,
    ];
  }

  isSupported(mimetype: string, originalFilename: string): boolean {
    const fileExtension = extname(originalFilename).toLowerCase();

    return this.extractors.some((extractor) =>
      extractor.supports(mimetype, fileExtension),
    );
  }

  async extractText(input: DocumentTextExtractInput): Promise<string> {
    const fileExtension = extname(input.originalFilename).toLowerCase();
    const extractor = this.extractors.find((candidate) =>
      candidate.supports(input.mimetype, fileExtension),
    );

    if (!extractor) {
      throw new BadRequestException(DOCUMENT_MESSAGES.UNSUPPORTED_FILE_TYPE);
    }

    return extractor.extract(input);
  }
}
