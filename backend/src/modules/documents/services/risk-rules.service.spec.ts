import { AnalysisRiskLevel } from '../../../database/enums/analysis-risk-level.enum';
import { RiskSeverity } from '../../../database/enums/risk-severity.enum';
import { RiskRulesService } from './risk-rules.service';

describe('RiskRulesService', () => {
  let service: RiskRulesService;

  beforeEach(() => {
    service = new RiskRulesService();
  });

  it('classify returns HIGH when a critical term appears in text', () => {
    const result = service.classify('Company mentioned fraud in the report');
    expect(result.riskLevel).toBe(AnalysisRiskLevel.HIGH);
    expect(result.findings[0].severity).toBe(RiskSeverity.HIGH);
    expect(result.findings[0].code).toBe('critical-terms');
  });

  it('classify returns MEDIUM when only attention terms appear', () => {
    const result = service.classify('There was a delay in delivery and backlog');
    expect(result.riskLevel).toBe(AnalysisRiskLevel.MEDIUM);
    expect(result.findings[0].severity).toBe(RiskSeverity.MEDIUM);
  });

  it('classify returns LOW when no risk terms are found', () => {
    const result = service.classify('Routines and procedures look normal for Q3.');
    expect(result.riskLevel).toBe(AnalysisRiskLevel.LOW);
    expect(result.findings).toHaveLength(0);
  });

  it('analyze delegates to classify', async () => {
    const result = await service.analyze({
      extractedText: 'Mentioned lawsuit against supplier',
    });
    expect(result.riskLevel).toBe(AnalysisRiskLevel.HIGH);
  });
});
