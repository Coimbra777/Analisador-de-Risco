import { Analysis } from '../../database/entities';
import { RiskFinding } from '../../database/entities/risk-finding.entity';
import { RiskSeverity } from '../../database/enums/risk-severity.enum';

const SEVERITY_RANK: Record<RiskSeverity, number> = {
  [RiskSeverity.HIGH]: 3,
  [RiskSeverity.MEDIUM]: 2,
  [RiskSeverity.LOW]: 1,
};

function mergeRiskFindingsForResponse(findings: RiskFinding[]) {
  if (findings.length === 0) {
    return [];
  }

  const byCode = new Map<string, RiskFinding[]>();

  for (const finding of findings) {
    const key = finding.code ?? `finding-${finding.id}`;
    const group = byCode.get(key) ?? [];
    group.push(finding);
    byCode.set(key, group);
  }

  return [...byCode.values()].map((group) => mergeFindingGroup(group));
}

function mergeFindingGroup(group: RiskFinding[]) {
  const sorted = [...group].sort((a, b) => a.id - b.id);
  const [first] = sorted;

  const severity = sorted.reduce(
    (max, finding) =>
      SEVERITY_RANK[finding.severity] > SEVERITY_RANK[max]
        ? finding.severity
        : max,
    first.severity,
  );

  const lead = sorted
    .filter((finding) => finding.severity === severity)
    .sort((a, b) => a.id - b.id)[0];

  const descriptionPieces: string[] = [];
  const seenDescriptions = new Set<string>();

  for (const finding of sorted) {
    const filename = finding.document?.originalFilename ?? 'documento';
    const rawDescription = finding.description ?? '';
    const label = `${filename}: ${rawDescription}`.trim();

    if (!seenDescriptions.has(rawDescription)) {
      seenDescriptions.add(rawDescription);
      descriptionPieces.push(label);
    }
  }

  const id = Math.min(...sorted.map((finding) => finding.id));

  return {
    id,
    code: lead.code,
    title: lead.title,
    description:
      descriptionPieces.join(' | ') || lead.description,
    severity,
    createdAt: first.createdAt,
    updatedAt: first.updatedAt,
  };
}

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
  const mergedFindings = mergeRiskFindingsForResponse(analysis.riskFindings ?? []);

  return {
    ...toAnalysisListResponse(analysis),
    documents: analysis.documents.map((document) => ({
      id: document.id,
      originalFilename: document.originalFilename,
      mimeType: document.mimeType,
      storageKey: document.storageKey,
      fileSizeBytes: document.fileSizeBytes,
      status: document.status,
      summaryText: document.summaryText,
      riskLevel: document.riskLevel,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    })),
    riskFindings: mergedFindings.map((riskFinding) => ({
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
