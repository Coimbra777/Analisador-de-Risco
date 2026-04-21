import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

import { UploadedDocumentFile } from '../interfaces/uploaded-document-file.interface';

@Injectable()
export class FileStorageService {
  constructor(private readonly configService: ConfigService) {}

  async saveUploadedFile(file: UploadedDocumentFile, analysisId: number) {
    const uploadDir = this.configService.get<string>(
      'storage.uploadDir',
      'storage/uploads',
    );
    const analysisDir = join(process.cwd(), uploadDir, `analysis-${analysisId}`);

    await mkdir(analysisDir, { recursive: true });

    const fileExtension = extname(file.originalname) || '.bin';
    const filename = `${Date.now()}-${randomUUID()}${fileExtension.toLowerCase()}`;
    const fullPath = join(analysisDir, filename);

    await writeFile(fullPath, file.buffer);

    return join(uploadDir, `analysis-${analysisId}`, filename);
  }
}
