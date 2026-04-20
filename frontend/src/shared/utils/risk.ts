import type { RiskFinding } from '@/shared/types/models';

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
    return 'Alto';
  }

  if (riskLevel === 'medium') {
    return 'Médio';
  }

  if (riskLevel === 'low') {
    return 'Baixo';
  }

  return 'Pendente';
}

export function formatAnalysisStatusLabel(status: string | null) {
  if (status === 'pending') {
    return 'Aguardando documento';
  }

  if (status === 'in_progress') {
    return 'Processando documento';
  }

  if (status === 'completed') {
    return 'Concluída';
  }

  if (status === 'failed') {
    return 'Falhou';
  }

  if (status === 'available') {
    return 'Disponível';
  }

  return status ?? '-';
}

export function formatDocumentStatusLabel(status: string | null) {
  if (status === 'pending') {
    return 'Enviado';
  }

  if (status === 'available') {
    return 'Processado';
  }

  if (status === 'failed') {
    return 'Falhou';
  }

  return status ?? '-';
}

export function getAnalysisStatusTone(status: string | null) {
  if (status === 'completed') {
    return 'completed';
  }

  if (status === 'failed') {
    return 'failed';
  }

  if (status === 'in_progress') {
    return 'processing';
  }

  return 'pending';
}

export function getDocumentStatusTone(status: string | null) {
  if (status === 'available') {
    return 'completed';
  }

  if (status === 'failed') {
    return 'failed';
  }

  return 'pending';
}
