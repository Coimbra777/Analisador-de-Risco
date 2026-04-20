import { Analysis } from '../../database/entities';

export function toAnalysisListResponse(analysis: Analysis) {
  return {
    id: analysis.id,
    status: analysis.status,
    riskLevel: analysis.riskLevel,
    summaryText: analysis.summaryText,
    completedAt: analysis.completedAt,
    company: {
      id: analysis.company.id,
      legalName: analysis.company.legalName,
      registrationNumber: analysis.company.registrationNumber,
    },
    createdBy: {
      id: analysis.createdBy.id,
      name: analysis.createdBy.name,
      email: analysis.createdBy.email,
    },
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt,
  };
}

export function toAnalysisDetailResponse(analysis: Analysis) {
  return {
    ...toAnalysisListResponse(analysis),
    documents: analysis.documents.map((document) => ({
      id: document.id,
      originalFilename: document.originalFilename,
      mimeType: document.mimeType,
      storageKey: document.storageKey,
      fileSizeBytes: document.fileSizeBytes,
      status: document.status,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    })),
    riskFindings: analysis.riskFindings.map((riskFinding) => ({
      id: riskFinding.id,
      code: riskFinding.code,
      title: riskFinding.title,
      description: riskFinding.description,
      severity: riskFinding.severity,
      createdAt: riskFinding.createdAt,
      updatedAt: riskFinding.updatedAt,
    })),
  };
}
