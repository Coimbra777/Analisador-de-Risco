import { Injectable } from '@nestjs/common';
import { createWorker } from 'tesseract.js';

import type {
  DocumentTextExtractInput,
  DocumentTextExtractor,
} from './document-text-extractor.contract';

/**
 * OCR via tesseract.js (WASM). MVP: um worker por requisição (simples; próximo passo = pool/singleton).
 * Idiomas por env para equilibrar acurácia vs download de modelos na primeira execução.
 */
@Injectable()
export class ImageOcrTextExtractor implements DocumentTextExtractor {
  supports(mimetype: string, fileExtension: string): boolean {
    if (
      mimetype === 'image/jpeg' ||
      mimetype === 'image/jpg' ||
      mimetype === 'image/png'
    ) {
      return true;
    }

    return (
      fileExtension === '.jpg' ||
      fileExtension === '.jpeg' ||
      fileExtension === '.png'
    );
  }

  async extract(input: DocumentTextExtractInput): Promise<string> {
    const languages = process.env.OCR_LANGS ?? 'por+eng';
    const worker = await createWorker(languages);

    try {
      const {
        data: { text },
      } = await worker.recognize(input.buffer);

      return text.replace(/\s+/g, ' ').trim();
    } finally {
      await worker.terminate();
    }
  }
}
