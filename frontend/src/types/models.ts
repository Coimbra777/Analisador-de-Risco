export type User = {
  id: number;
  name: string;
  email: string;
};

export type AuthResponse = {
  accessToken: string;
  tokenType: string;
  user: User;
};

export type Company = {
  id: number;
  legalName: string;
  tradeName: string | null;
  registrationNumber: string;
  country: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentItem = {
  id: number;
  originalFilename: string;
  mimeType: string | null;
  storageKey: string | null;
  fileSizeBytes: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type RiskFinding = {
  id: number;
  code: string | null;
  title: string;
  description: string | null;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
};

export type AnalysisListItem = {
  id: number;
  status: string;
  riskLevel: 'low' | 'medium' | 'high' | null;
  summaryText: string | null;
  completedAt: string | null;
  company: {
    id: number;
    legalName: string;
    registrationNumber: string;
  };
  createdBy: User;
  createdAt: string;
  updatedAt: string;
};

export type AnalysisDetail = AnalysisListItem & {
  documents: DocumentItem[];
  riskFindings: RiskFinding[];
};
