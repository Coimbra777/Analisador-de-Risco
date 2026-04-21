import { Injectable } from '@nestjs/common';

import { AnalysisRiskLevel } from '../../../database/enums/analysis-risk-level.enum';
import { RiskSeverity } from '../../../database/enums/risk-severity.enum';
import {
  ClassifiedRiskFinding,
  RiskClassificationResult,
} from '../interfaces/risk-classification-result.interface';
import type { RiskAnalyzer, RiskAnalyzerInput } from '../risk-analyzer.contract';

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

type RiskMatches = {
  criticalTerms: string[];
  attentionTerms: string[];
};

@Injectable()
export class RiskRulesService implements RiskAnalyzer {
  async analyze(input: RiskAnalyzerInput): Promise<RiskClassificationResult> {
    return Promise.resolve(this.classify(input.extractedText));
  }

  classify(text: string): RiskClassificationResult {
    const normalizedText = text.trim().toLowerCase();
    const matches = this.findRiskMatches(normalizedText);
    const riskLevel = this.determineRiskLevel(matches);

    return {
      riskLevel,
      summaryText: this.buildSummary(riskLevel, matches),
      findings: this.buildFindings(matches),
    };
  }

  private findRiskMatches(text: string): RiskMatches {
    return {
      criticalTerms: this.findMatchedTerms(text, CRITICAL_TERMS),
      attentionTerms: this.findMatchedTerms(text, ATTENTION_TERMS),
    };
  }

  private findMatchedTerms(text: string, terms: string[]) {
    return [...new Set(terms.filter((term) => text.includes(term)))];
  }

  private determineRiskLevel(matches: RiskMatches): AnalysisRiskLevel {
    if (matches.criticalTerms.length > 0) {
      return AnalysisRiskLevel.HIGH;
    }

    if (matches.attentionTerms.length > 0) {
      return AnalysisRiskLevel.MEDIUM;
    }

    return AnalysisRiskLevel.LOW;
  }

  private buildFindings(matches: RiskMatches): ClassifiedRiskFinding[] {
    const findings: ClassifiedRiskFinding[] = [];

    if (matches.criticalTerms.length > 0) {
      findings.push({
        code: 'critical-terms',
        title: 'Critical risk terms found',
        description: `Matched terms: ${matches.criticalTerms.join(', ')}.`,
        severity: RiskSeverity.HIGH,
      });
    }

    if (matches.attentionTerms.length > 0) {
      findings.push({
        code: 'attention-terms',
        title: 'Attention terms found',
        description: `Matched terms: ${matches.attentionTerms.join(', ')}.`,
        severity: RiskSeverity.MEDIUM,
      });
    }

    return findings;
  }

  private buildSummary(
    riskLevel: AnalysisRiskLevel,
    matches: RiskMatches,
  ): string {
    if (riskLevel === AnalysisRiskLevel.HIGH) {
      return `Critical terms found: ${matches.criticalTerms.join(', ')}.`;
    }

    if (riskLevel === AnalysisRiskLevel.MEDIUM) {
      return `Attention terms found: ${matches.attentionTerms.join(', ')}.`;
    }

    return 'No relevant risk terms were found in the document.';
  }
}
