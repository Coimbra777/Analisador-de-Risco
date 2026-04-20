import { Injectable } from '@nestjs/common';
import pdfParse from 'pdf-parse';

@Injectable()
export class PdfTextExtractorService {
  async extractText(fileBuffer: Buffer): Promise<string> {
    try {
      const result = await pdfParse(fileBuffer);

      return this.normalizeText(result.text);
    } catch {
      return '';
    }
  }

  private normalizeText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }
}
