export const AUTH_MESSAGES = {
  EMAIL_ALREADY_IN_USE: 'Email is already in use.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  MISSING_BEARER_TOKEN: 'Missing or invalid bearer token.',
  INVALID_OR_EXPIRED_TOKEN: 'Invalid or expired token.',
} as const;

export const COMPANY_MESSAGES = {
  NOT_FOUND: 'Company not found.',
  FORBIDDEN: 'You do not have access to this company.',
  REGISTRATION_NUMBER_ALREADY_IN_USE:
    'A company with this registration number already exists for your account.',
} as const;

export const ANALYSIS_MESSAGES = {
  NOT_FOUND: 'Analysis not found.',
  FORBIDDEN: 'You do not have access to this analysis.',
} as const;

export const DOCUMENT_MESSAGES = {
  UPLOAD_SUCCESS: 'Document uploaded and analysis processed successfully.',
  PDF_REQUIRED: 'A PDF file is required.',
  PDF_ONLY: 'Only PDF files are allowed.',
  UNREADABLE_PDF: 'No readable text could be extracted from the PDF.',
  PROCESSING_FAILED:
    'The document could not be processed because no readable text was extracted from the PDF.',
} as const;

export const COMMON_ERROR_MESSAGES = {
  INTERNAL_SERVER_ERROR: 'Internal server error.',
  UNEXPECTED_ERROR: 'Unexpected error.',
} as const;
