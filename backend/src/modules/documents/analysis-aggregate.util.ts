import { AnalysisRiskLevel } from '../../database/enums/analysis-risk-level.enum';
import { DocumentStatus } from '../../database/enums/document-status.enum';
import { Document } from '../../database/entities/document.entity';

const RISK_RANK: Record<AnalysisRiskLevel, number> = {
  [AnalysisRiskLevel.LOW]: 1,
  [AnalysisRiskLevel.MEDIUM]: 2,
  [AnalysisRiskLevel.HIGH]: 3,
};

export function maxDocumentRiskLevel(
  levels: AnalysisRiskLevel[],
): AnalysisRiskLevel | null {
  if (levels.length === 0) {
    return null;
  }

  return levels.reduce(
    (max, current) =>
      RISK_RANK[current] > RISK_RANK[max] ? current : max,
    levels[0],
  );
}

export function buildConsolidatedAnalysisSummary(
  availableDocs: Document[],
  failedCount: number,
): string {
  const body = availableDocs
    .map((document) => `${document.originalFilename}: ${document.summaryText ?? ''}`)
    .join('\n');

  if (failedCount === 0) {
    return body;
  }

  const note =
    failedCount === 1
      ? 'Observação: 1 documento falhou no processamento.'
      : `Observação: ${failedCount} documentos falharam no processamento.`;

  return body ? `${body}\n\n${note}` : note;
}

export function partitionDocumentsByProcessingState(documents: Document[]) {
  const available = documents.filter(
    (document) =>
      document.status === DocumentStatus.AVAILABLE && document.riskLevel != null,
  );
  const failed = documents.filter(
    (document) => document.status === DocumentStatus.FAILED,
  );
  const pending = documents.filter(
    (document) => document.status === DocumentStatus.PENDING,
  );

  return { available, failed, pending };
}
