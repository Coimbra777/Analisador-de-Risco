const MESSAGE_TRANSLATIONS: Record<string, string> = {
  'Email is already in use.': 'Já existe um usuário com este e-mail.',
  'Invalid email or password.': 'E-mail ou senha inválidos.',
  'Missing authorization token.': 'Sua sessão expirou. Entre novamente para continuar.',
  'Invalid or expired authorization token.':
    'Sua sessão expirou. Entre novamente para continuar.',
  'Company not found.': 'Empresa não encontrada.',
  'Analysis not found.': 'Análise não encontrada.',
  'Document not found.': 'Documento não encontrado.',
  'You do not have access to this company.': 'Você não tem acesso a esta empresa.',
  'You do not have access to this analysis.': 'Você não tem acesso a esta análise.',
  'A company with this registration number already exists for your account.':
    'Já existe uma empresa com este número de registro na sua conta.',
  'Unsupported file type. Allowed: PDF, PNG, JPEG, DOCX, XLSX.':
    'Tipo de arquivo não suportado. Use PDF, PNG, JPEG, DOCX ou XLSX.',
  'No readable text could be extracted from this file.':
    'Não foi possível extrair texto legível deste arquivo.',
  'A file is required.': 'Selecione um arquivo para enviar.',
  'Only PDF files are allowed.': 'Envie um arquivo em PDF.',
  'No readable text could be extracted from the PDF.':
    'Não foi possível extrair texto legível do PDF enviado.',
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
    return 'O arquivo excede o tamanho máximo permitido.';
  }

  return message;
}
