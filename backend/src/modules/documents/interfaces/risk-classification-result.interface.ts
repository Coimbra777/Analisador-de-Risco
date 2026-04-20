import { AnalysisRiskLevel } from '../../../database/enums/analysis-risk-level.enum';
import { RiskSeverity } from '../../../database/enums/risk-severity.enum';

export interface ClassifiedRiskFinding {
  code: string;
  title: string;
  description: string;
  severity: RiskSeverity;
}

export interface RiskClassificationResult {
  riskLevel: AnalysisRiskLevel;
  summaryText: string;
  findings: ClassifiedRiskFinding[];
}
