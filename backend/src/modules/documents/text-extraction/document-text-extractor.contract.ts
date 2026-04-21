/**
 * Contrato por tipo de arquivo. Evolução típica:
 * - trocar uma implementação (ex.: OCR mais robusto) sem mudar o fluxo de upload;
 * - ou introduzir um extractor “faixa larga” (ex.: Apache Tika) que aceite mimes genéricos,
 *   mantendo estes extractores como fallback ou legado.
 */
export type DocumentTextExtractInput = {
  buffer: Buffer;
  mimetype: string;
  originalFilename: string;
};

export interface DocumentTextExtractor {
  supports(mimetype: string, fileExtension: string): boolean;
  extract(input: DocumentTextExtractInput): Promise<string>;
}
