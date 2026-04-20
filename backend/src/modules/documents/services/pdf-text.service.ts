import { Injectable } from '@nestjs/common';
import { inflateSync } from 'node:zlib';
import pdfParse from 'pdf-parse';

@Injectable()
export class PdfTextService {
  async extractText(fileBuffer: Buffer): Promise<string> {
    try {
      const result = await pdfParse(fileBuffer);
      const normalizedText = this.normalizeText(result.text);

      if (normalizedText) {
        return normalizedText;
      }
    } catch {
      // Fall back to a simple stream decoder for basic text PDFs.
    }

    return this.extractTextFromPdfStreams(fileBuffer);
  }

  private normalizeText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  private extractTextFromPdfStreams(fileBuffer: Buffer): string {
    const pdfContent = fileBuffer.toString('latin1');
    const streamMatches = [...pdfContent.matchAll(/<<([\s\S]*?)>>\s*stream\r?\n([\s\S]*?)endstream/g)];
    const extractedChunks: string[] = [];

    for (const [, dictionary, streamBody] of streamMatches) {
      const filters = this.extractFilters(dictionary);
      const decodedStream = this.decodeStream(Buffer.from(streamBody.trim(), 'latin1'), filters);

      if (!decodedStream) {
        continue;
      }

      const text = this.extractTextOperators(decodedStream.toString('latin1'));

      if (text) {
        extractedChunks.push(text);
      }
    }

    return this.normalizeText(extractedChunks.join(' '));
  }

  private extractFilters(dictionary: string): string[] {
    const filterMatch = dictionary.match(/\/Filter\s*(\[[^\]]+\]|\/[A-Za-z0-9]+)/);

    if (!filterMatch) {
      return [];
    }

    return [...filterMatch[1].matchAll(/\/([A-Za-z0-9]+)/g)].map(([, filter]) => filter);
  }

  private decodeStream(streamBody: Buffer, filters: string[]) {
    let decoded = streamBody;

    try {
      for (const filter of filters) {
        if (filter === 'ASCII85Decode') {
          decoded = this.decodeAscii85(decoded.toString('latin1'));
          continue;
        }

        if (filter === 'FlateDecode') {
          decoded = inflateSync(decoded);
          continue;
        }

        return null;
      }

      return decoded;
    } catch {
      return null;
    }
  }

  private decodeAscii85(content: string): Buffer {
    const sanitizedContent = content.replace(/\s+/g, '').replace(/~>$/, '');
    const bytes: number[] = [];

    for (let index = 0; index < sanitizedContent.length; ) {
      if (sanitizedContent[index] === 'z') {
        bytes.push(0, 0, 0, 0);
        index += 1;
        continue;
      }

      const chunk = sanitizedContent.slice(index, index + 5);
      const paddedChunk = chunk.padEnd(5, 'u');
      let value = 0;

      for (const character of paddedChunk) {
        value = value * 85 + (character.charCodeAt(0) - 33);
      }

      const chunkBytes = [
        (value >>> 24) & 255,
        (value >>> 16) & 255,
        (value >>> 8) & 255,
        value & 255,
      ];

      bytes.push(...chunkBytes.slice(0, chunk.length - 1));
      index += 5;
    }

    return Buffer.from(bytes);
  }

  private extractTextOperators(content: string): string {
    const literalStrings = [...content.matchAll(/\((?:\\.|[^\\)])*\)\s*Tj/g)].map(([match]) =>
      match.replace(/\)\s*Tj$/, ''),
    );

    const normalizedStrings = literalStrings
      .map((value) => this.decodePdfLiteralString(value))
      .filter(Boolean);

    return normalizedStrings.join(' ');
  }

  private decodePdfLiteralString(value: string): string {
    let decoded = value.slice(1);

    decoded = decoded.replace(/\\([0-7]{1,3})/g, (_, octalValue: string) =>
      String.fromCharCode(Number.parseInt(octalValue, 8)),
    );
    decoded = decoded.replace(/\\n/g, '\n');
    decoded = decoded.replace(/\\r/g, '\r');
    decoded = decoded.replace(/\\t/g, '\t');
    decoded = decoded.replace(/\\b/g, '\b');
    decoded = decoded.replace(/\\f/g, '\f');
    decoded = decoded.replace(/\\\(/g, '(');
    decoded = decoded.replace(/\\\)/g, ')');
    decoded = decoded.replace(/\\\\/g, '\\');

    return decoded;
  }
}
