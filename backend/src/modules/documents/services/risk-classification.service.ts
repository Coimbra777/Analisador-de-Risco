import { Injectable } from '@nestjs/common';

import { AnalysisRiskLevel } from '../../../database/enums/analysis-risk-level.enum';
import { RiskSeverity } from '../../../database/enums/risk-severity.enum';
import {
  ClassifiedRiskFinding,
  RiskClassificationResult,
} from '../interfaces/risk-classification-result.interface';

type RuleDefinition = {
  code: string;
  title: string;
  severity: RiskSeverity;
  keywords: string[];
};

const RISK_RULES: RuleDefinition[] = [
  {
    code: 'lawsuit',
    title: 'Potential legal dispute mention',
    severity: RiskSeverity.HIGH,
    keywords: [
      'lawsuit',
      'litigation',
      'judicial process',
      'court order',
      'processo judicial',
      'ação judicial',
      'litígio',
      'ordem judicial',
    ],
  },
  {
    code: 'fraud',
    title: 'Potential fraud or corruption mention',
    severity: RiskSeverity.HIGH,
    keywords: [
      'fraud',
      'bribery',
      'corruption',
      'money laundering',
      'fraude',
      'suborno',
      'corrupção',
      'lavagem de dinheiro',
    ],
  },
  {
    code: 'sanction',
    title: 'Potential sanction or compliance issue',
    severity: RiskSeverity.HIGH,
    keywords: [
      'sanction',
      'blacklist',
      'compliance breach',
      'penalty',
      'sanção',
      'lista restritiva',
      'descumprimento',
      'multa',
    ],
  },
  {
    code: 'financial-distress',
    title: 'Potential financial distress mention',
    severity: RiskSeverity.MEDIUM,
    keywords: [
      'bankruptcy',
      'insolvency',
      'default',
      'debt restructuring',
      'falência',
      'insolvência',
      'inadimplência',
      'reestruturação de dívida',
    ],
  },
  {
    code: 'delay',
    title: 'Potential operational delay mention',
    severity: RiskSeverity.LOW,
    keywords: [
      'delay',
      'late delivery',
      'backlog',
      'service interruption',
      'atraso',
      'entrega em atraso',
      'interrupção de serviço',
      'paralisação',
    ],
  },
];

@Injectable()
export class RiskClassificationService {
  classify(text: string): RiskClassificationResult {
    const extractedText = text.trim();
    const findings = this.buildFindings(extractedText);
    const summaryText = this.buildSummary(extractedText, findings);
    const riskLevel = this.calculateRiskLevel(findings);

    return {
      riskLevel,
      summaryText,
      findings,
      extractedText,
    };
  }

  private buildFindings(text: string): ClassifiedRiskFinding[] {
    const normalizedText = text.toLowerCase();

    return RISK_RULES.filter((rule) =>
      rule.keywords.some((keyword) => normalizedText.includes(keyword)),
    ).map((rule) => ({
      code: rule.code,
      title: rule.title,
      description: `Keyword match found for: ${rule.keywords.join(', ')}.`,
      severity: rule.severity,
    }));
  }

  private buildSummary(text: string, findings: ClassifiedRiskFinding[]): string {
    if (!text) {
      return 'No readable text could be extracted from the PDF.';
    }

    const sentenceMatches = text
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean)
      .slice(0, 3);

    if (sentenceMatches.length > 0) {
      return sentenceMatches.join(' ');
    }

    if (findings.length > 0) {
      return `The document mentions ${findings
        .map((finding) => finding.title.toLowerCase())
        .join(', ')}.`;
    }

    return text.slice(0, 280);
  }

  private calculateRiskLevel(
    findings: ClassifiedRiskFinding[],
  ): AnalysisRiskLevel {
    const hasHighRisk = findings.some(
      (finding) => finding.severity === RiskSeverity.HIGH,
    );
    const mediumOrHigherCount = findings.filter(
      (finding) =>
        finding.severity === RiskSeverity.HIGH ||
        finding.severity === RiskSeverity.MEDIUM,
    ).length;

    if (hasHighRisk || mediumOrHigherCount >= 2) {
      return AnalysisRiskLevel.HIGH;
    }

    if (findings.length > 0) {
      return AnalysisRiskLevel.MEDIUM;
    }

    return AnalysisRiskLevel.LOW;
  }
}
