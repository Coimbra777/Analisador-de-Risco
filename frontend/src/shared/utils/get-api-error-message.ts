const MESSAGE_TRANSLATIONS: Record<string, string> = {
  'Email is already in use.': 'Ja existe um usuario com este email.',
  'Invalid email or password.': 'Email ou senha invalidos.',
  'Missing authorization token.': 'Sua sessao expirou. Entre novamente para continuar.',
  'Invalid or expired authorization token.':
    'Sua sessao expirou. Entre novamente para continuar.',
  'Company not found.': 'Empresa nao encontrada.',
  'Analysis not found.': 'Analise nao encontrada.',
  'Document not found.': 'Documento nao encontrado.',
  'You do not have access to this company.': 'Voce nao tem acesso a esta empresa.',
  'You do not have access to this analysis.': 'Voce nao tem acesso a esta analise.',
  'A company with this registration number already exists for your account.':
    'Ja existe uma empresa com este numero de registro na sua conta.',
  'Only PDF files are allowed.': 'Envie um arquivo em PDF.',
  'No readable text could be extracted from the PDF.':
    'Nao foi possivel extrair texto legivel do PDF enviado.',
  'Unexpected error.': 'Ocorreu um erro inesperado. Tente novamente.',
  'Internal server error.': 'Ocorreu um erro interno. Tente novamente.',
};

export function getApiErrorMessage(error: unknown, fallback: string) {
  const maybeAxiosError = error as {
    response?: { data?: { message?: string | string[] } };
  };
  const message = maybeAxiosError.response?.data?.message;

  if (Array.isArray(message)) {
    return message.map(translateMessage).join(', ');
  }

  return translateMessage(message) ?? fallback;
}

function translateMessage(message?: string) {
  if (!message) {
    return undefined;
  }

  if (MESSAGE_TRANSLATIONS[message]) {
    return MESSAGE_TRANSLATIONS[message];
  }

  if (message.startsWith('File is too large')) {
    return 'O arquivo excede o tamanho maximo permitido.';
  }

  return message;
}
