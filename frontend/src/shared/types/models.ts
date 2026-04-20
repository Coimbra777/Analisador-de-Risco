export type User = {
  id: number;
  name: string;
  email: string;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};

export type Company = {
  id: number;
  legalName: string;
  tradeName: string | null;
  registrationNumber: string;
  country: string | null;
};

export type DocumentItem = {
  id: number;
  originalFilename: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  status: string;
  createdAt: string;
};

export type RiskFinding = {
  id: number;
  code: string | null;
  title: string;
  description: string | null;
  severity: 'low' | 'medium' | 'high';
};

export type AnalysisListItem = {
  id: number;
  status: string;
  riskLevel: 'low' | 'medium' | 'high' | null;
  summaryText: string | null;
  company: {
    id: number;
    legalName: string;
    registrationNumber: string;
  };
};

export type AnalysisDetail = AnalysisListItem & {
  documents: DocumentItem[];
  riskFindings: RiskFinding[];
};
