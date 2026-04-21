import { Injectable } from '@nestjs/common';
import mammoth from 'mammoth';

import type {
  DocumentTextExtractInput,
  DocumentTextExtractor,
} from './document-text-extractor.contract';

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

@Injectable()
export class DocxTextExtractor implements DocumentTextExtractor {
  supports(mimetype: string, fileExtension: string): boolean {
    if (mimetype === DOCX_MIME) {
      return true;
    }

    return fileExtension === '.docx';
  }

  async extract(input: DocumentTextExtractInput): Promise<string> {
    const result = await mammoth.extractRawText({ buffer: input.buffer });
    return result.value.replace(/\s+/g, ' ').trim();
  }
}
