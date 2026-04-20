export function getAnalysisListUi(status: string) {
  if (status === 'pending') {
    return {
      actionLabel: 'Enviar documento',
      nextStepText: 'Próximo passo: abrir a análise e enviar o documento PDF.',
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
      nextStepText: 'Envie um documento PDF para iniciar o processamento desta análise.',
      uploadPanelDescription: 'Envie o PDF principal do fornecedor para iniciar a avaliação.',
    };
  }

  if (status === 'in_progress') {
    return {
      heroTitle: 'Estamos processando o documento enviado.',
      nextStepText: 'Aguarde enquanto o documento é processado. O resultado aparecerá nesta tela.',
      uploadPanelDescription: 'Você pode acompanhar o processamento atual ou reenviar um documento depois.',
    };
  }

  if (status === 'failed') {
    return {
      heroTitle: 'Não foi possível concluir o processamento.',
      nextStepText: 'Revise o documento enviado e tente novamente para processar a análise.',
      uploadPanelDescription: 'Envie um novo PDF se quiser atualizar ou tentar novamente esta análise.',
    };
  }

  if (status === 'completed') {
    return {
      heroTitle: 'Resultado disponível para consulta.',
      nextStepText: 'Confira o resumo, os achados e envie um novo documento se quiser atualizar a análise.',
      uploadPanelDescription: 'Envie um novo PDF se quiser atualizar ou tentar novamente esta análise.',
    };
  }

  return {
    heroTitle: '',
    nextStepText: '',
    uploadPanelDescription: '',
  };
}
