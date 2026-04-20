import { Injectable } from '@nestjs/common';

import { AnalysisRiskLevel } from '../../../database/enums/analysis-risk-level.enum';
import { RiskSeverity } from '../../../database/enums/risk-severity.enum';
import {
  ClassifiedRiskFinding,
  RiskClassificationResult,
} from '../interfaces/risk-classification-result.interface';

const CRITICAL_TERMS = [
  'lawsuit',
  'litigation',
  'judicial process',
  'court order',
  'processo judicial',
  'ação judicial',
  'litígio',
  'ordem judicial',
  'fraud',
  'bribery',
  'corruption',
  'money laundering',
  'fraude',
  'suborno',
  'corrupção',
  'lavagem de dinheiro',
  'sanction',
  'blacklist',
  'compliance breach',
  'penalty',
  'sanção',
  'lista restritiva',
  'descumprimento',
  'multa',
];

const ATTENTION_TERMS = [
  'bankruptcy',
  'insolvency',
  'default',
  'debt restructuring',
  'falência',
  'insolvência',
  'inadimplência',
  'reestruturação de dívida',
  'delay',
  'late delivery',
  'backlog',
  'service interruption',
  'atraso',
  'entrega em atraso',
  'interrupção de serviço',
  'paralisação',
];

@Injectable()
export class RiskRulesService {
  classify(text: string): RiskClassificationResult {
    const normalizedText = text.trim().toLowerCase();
    const hasReadableText = normalizedText.length > 0;
    const criticalMatches = this.findMatches(normalizedText, CRITICAL_TERMS);
    const attentionMatches = this.findMatches(normalizedText, ATTENTION_TERMS);
    const findings = this.buildFindings(criticalMatches, attentionMatches);
    const riskLevel = this.calculateRiskLevel(criticalMatches, attentionMatches);
    const summaryText = this.buildSummary(
      hasReadableText,
      riskLevel,
      criticalMatches,
      attentionMatches,
    );

    return {
      riskLevel,
      summaryText,
      findings,
    };
  }

  private findMatches(text: string, terms: string[]) {
    return [...new Set(terms.filter((term) => text.includes(term)))];
  }

  private buildFindings(
    criticalMatches: string[],
    attentionMatches: string[],
  ): ClassifiedRiskFinding[] {
    const findings: ClassifiedRiskFinding[] = [];

    if (criticalMatches.length > 0) {
      findings.push({
        code: 'critical-terms',
        title: 'Critical risk terms found',
        description: `Matched terms: ${criticalMatches.join(', ')}.`,
        severity: RiskSeverity.HIGH,
      });
    }

    if (attentionMatches.length > 0) {
      findings.push({
        code: 'attention-terms',
        title: 'Attention terms found',
        description: `Matched terms: ${attentionMatches.join(', ')}.`,
        severity: RiskSeverity.MEDIUM,
      });
    }

    return findings;
  }

  private buildSummary(
    hasReadableText: boolean,
    riskLevel: AnalysisRiskLevel,
    criticalMatches: string[],
    attentionMatches: string[],
  ): string {
    if (!hasReadableText) {
      return 'No readable text could be extracted from the PDF.';
    }

    if (riskLevel === AnalysisRiskLevel.HIGH) {
      return `Critical terms found: ${criticalMatches.join(', ')}.`;
    }

    if (riskLevel === AnalysisRiskLevel.MEDIUM) {
      return `Attention terms found: ${attentionMatches.join(', ')}.`;
    }

    return 'No relevant risk terms were found in the document.';
  }

  private calculateRiskLevel(
    criticalMatches: string[],
    attentionMatches: string[],
  ): AnalysisRiskLevel {
    if (criticalMatches.length > 0) {
      return AnalysisRiskLevel.HIGH;
    }

    if (attentionMatches.length > 0) {
      return AnalysisRiskLevel.MEDIUM;
    }

    return AnalysisRiskLevel.LOW;
  }
}
