import { AnalysisRiskLevel } from '../../database/enums/analysis-risk-level.enum';
import { DocumentStatus } from '../../database/enums/document-status.enum';
import { Document } from '../../database/entities/document.entity';
import {
  buildConsolidatedAnalysisSummary,
  maxDocumentRiskLevel,
  partitionDocumentsByProcessingState,
} from './analysis-aggregate.util';

function makeDoc(
  partial: Pick<Document, 'id' | 'status' | 'riskLevel' | 'originalFilename' | 'summaryText'>,
): Document {
  return partial as Document;
}

describe('analysis-aggregate.util', () => {
  describe('maxDocumentRiskLevel', () => {
    it('returns null for empty list', () => {
      expect(maxDocumentRiskLevel([])).toBeNull();
    });

    it('picks the highest level', () => {
      expect(
        maxDocumentRiskLevel([
          AnalysisRiskLevel.LOW,
          AnalysisRiskLevel.HIGH,
          AnalysisRiskLevel.MEDIUM,
        ]),
      ).toBe(AnalysisRiskLevel.HIGH);
    });
  });

  describe('buildConsolidatedAnalysisSummary', () => {
    it('joins per-document lines when there are no failures', () => {
      const doc = makeDoc({
        id: 1,
        status: DocumentStatus.AVAILABLE,
        riskLevel: AnalysisRiskLevel.LOW,
        originalFilename: 'a.pdf',
        summaryText: 'ok',
      });
      expect(buildConsolidatedAnalysisSummary([doc], 0)).toBe('a.pdf: ok');
    });

    it('appends failure note when some documents failed', () => {
      const doc = makeDoc({
        id: 1,
        status: DocumentStatus.AVAILABLE,
        riskLevel: AnalysisRiskLevel.LOW,
        originalFilename: 'a.pdf',
        summaryText: 'x',
      });
      const text = buildConsolidatedAnalysisSummary([doc], 2);
      expect(text).toContain('2 documentos falharam');
    });
  });

  describe('partitionDocumentsByProcessingState', () => {
    it('splits by status and requires riskLevel for available', () => {
      const a = makeDoc({
        id: 1,
        status: DocumentStatus.AVAILABLE,
        riskLevel: AnalysisRiskLevel.MEDIUM,
        originalFilename: 'a.pdf',
        summaryText: '',
      });
      const b = makeDoc({
        id: 2,
        status: DocumentStatus.FAILED,
        riskLevel: null,
        originalFilename: 'b.pdf',
        summaryText: null,
      });
      const c = makeDoc({
        id: 3,
        status: DocumentStatus.PENDING,
        riskLevel: null,
        originalFilename: 'c.pdf',
        summaryText: null,
      });
      const { available, failed, pending } = partitionDocumentsByProcessingState([a, b, c]);
      expect(available).toEqual([a]);
      expect(failed).toEqual([b]);
      expect(pending).toEqual([c]);
    });
  });
});
