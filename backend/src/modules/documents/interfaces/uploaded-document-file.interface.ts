/** Arquivo recebido via multipart (campos usados pelo fluxo de documentos). */
export interface UploadedDocumentFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}
