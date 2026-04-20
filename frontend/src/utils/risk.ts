import type { RiskFinding } from '@/types/models';

export function calculateRiskScore(findings: RiskFinding[], riskLevel: string | null) {
  const baseScore = findings.reduce((total, finding) => {
    if (finding.severity === 'high') {
      return total + 45;
    }

    if (finding.severity === 'medium') {
      return total + 25;
    }

    return total + 10;
  }, 0);

  if (baseScore > 0) {
    return Math.min(baseScore, 100);
  }

  if (riskLevel === 'high') {
    return 80;
  }

  if (riskLevel === 'medium') {
    return 50;
  }

  return 20;
}

export function formatRiskLabel(riskLevel: string | null) {
  if (riskLevel === 'high') {
    return 'High';
  }

  if (riskLevel === 'medium') {
    return 'Medium';
  }

  if (riskLevel === 'low') {
    return 'Low';
  }

  return 'Pending';
}
