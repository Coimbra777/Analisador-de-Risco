import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

import { UploadedPdfFile } from '../interfaces/uploaded-pdf-file.interface';

@Injectable()
export class LocalFileStorageService {
  constructor(private readonly configService: ConfigService) {}

  async savePdf(file: UploadedPdfFile, analysisId: number) {
    const uploadDir = this.configService.get<string>(
      'storage.uploadDir',
      'storage/uploads',
    );
    const analysisDir = join(process.cwd(), uploadDir, `analysis-${analysisId}`);

    await mkdir(analysisDir, { recursive: true });

    const fileExtension = extname(file.originalname) || '.pdf';
    const filename = `${Date.now()}-${randomUUID()}${fileExtension.toLowerCase()}`;
    const fullPath = join(analysisDir, filename);

    await writeFile(fullPath, file.buffer);

    const relativePath = join(uploadDir, `analysis-${analysisId}`, filename);

    return {
      filename,
      fullPath,
      relativePath,
    };
  }
}
