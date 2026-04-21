import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';

import type {
  DocumentTextExtractInput,
  DocumentTextExtractor,
} from './document-text-extractor.contract';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@Injectable()
export class XlsxTextExtractor implements DocumentTextExtractor {
  supports(mimetype: string, fileExtension: string): boolean {
    if (mimetype === XLSX_MIME) {
      return true;
    }

    return fileExtension === '.xlsx';
  }

  async extract(input: DocumentTextExtractInput): Promise<string> {
    const workbook = XLSX.read(input.buffer, { type: 'buffer' });
    const parts: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];

      if (!sheet) {
        continue;
      }

      const asCsv = XLSX.utils.sheet_to_csv(sheet);
      parts.push(`--- ${sheetName} ---\n${asCsv}`);
    }

    return parts.join('\n\n').trim();
  }
}
