import type { RiskFinding } from '@/shared/types/api.types';

export function getAnalysisListUi(status: string) {
  if (status === 'pending') {
    return {
      actionLabel: 'Enviar documento',
      nextStepText:
        'Próximo passo: abrir a análise e enviar um documento (PDF, imagem, DOCX ou XLSX).',
    };
  }

  if (status === 'in_progress') {
    return {
      actionLabel: 'Abrir análise',
      nextStepText: 'O documento está em processamento no momento.',
    };
  }

  if (status === 'failed') {
    return {
      actionLabel: 'Abrir análise',
      nextStepText: 'Abra a análise para revisar o erro e tentar enviar novamente.',
    };
  }

  return {
    actionLabel: 'Abrir análise',
    nextStepText: 'Abra a análise para ver o resultado e os documentos enviados.',
  };
}

export function getAnalysisDetailUi(status: string | null) {
  if (status === 'pending') {
    return {
      heroTitle: 'A análise está pronta para receber o documento.',
      nextStepText:
        'Envie um documento (PDF, imagem, DOCX ou XLSX) para iniciar o processamento desta análise.',
      uploadPanelDescription:
        'Envie o documento principal do fornecedor para iniciar a avaliação.',
    };
  }

  if (status === 'in_progress') {
    return {
      heroTitle: 'Estamos processando o documento enviado.',
      nextStepText: 'Aguarde enquanto o documento é processado. O resultado aparecerá nesta tela.',
      uploadPanelDescription:
        'Você pode acompanhar o processamento atual ou reenviar um documento depois.',
    };
  }

  if (status === 'failed') {
    return {
      heroTitle: 'Não foi possível concluir o processamento.',
      nextStepText: 'Revise o documento enviado e tente novamente para processar a análise.',
      uploadPanelDescription:
        'Envie um novo arquivo se quiser atualizar ou tentar novamente esta análise.',
    };
  }

  if (status === 'completed') {
    return {
      heroTitle: 'Resultado disponível para consulta.',
      nextStepText: 'Confira o resumo, os achados e envie um novo documento se quiser atualizar a análise.',
      uploadPanelDescription:
        'Envie um novo arquivo se quiser atualizar ou tentar novamente esta análise.',
    };
  }

  return {
    heroTitle: '',
    nextStepText: '',
    uploadPanelDescription: '',
  };
}

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
