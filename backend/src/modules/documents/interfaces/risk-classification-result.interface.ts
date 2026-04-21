import { AnalysisRiskLevel } from '../../../database/enums/analysis-risk-level.enum';
import { RiskSeverity } from '../../../database/enums/risk-severity.enum';

/** Um achado retornado pelo motor de risco (keyword ou LLM). */
export interface ClassifiedRiskFinding {
  code: string;
  title: string;
  description: string;
  severity: RiskSeverity;
}

/**
 * Resultado da análise de risco para um documento (nível, resumo curto, achados).
 * É o que o fluxo de upload persiste em `documents` / `risk_findings` e agrega na análise.
 */
export interface RiskClassificationResult {
  riskLevel: AnalysisRiskLevel;
  summaryText: string;
  findings: ClassifiedRiskFinding[];
}

/** Alias explícito: mesmo tipo, nome alinhado ao domínio “análise por documento”. */
export type DocumentRiskAnalysisResult = RiskClassificationResult;
