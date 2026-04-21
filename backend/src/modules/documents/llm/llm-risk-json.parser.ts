import { AnalysisRiskLevel } from '../../../database/enums/analysis-risk-level.enum';
import { RiskSeverity } from '../../../database/enums/risk-severity.enum';
import type {
  ClassifiedRiskFinding,
  RiskClassificationResult,
} from '../interfaces/risk-classification-result.interface';

const RISK_LEVELS = new Set<string>(Object.values(AnalysisRiskLevel));
const SEVERITIES = new Set<string>(Object.values(RiskSeverity));

function stripMarkdownFences(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  if (match) {
    return match[1].trim();
  }

  return trimmed;
}

function normalizeSeverity(value: unknown): RiskSeverity {
  if (typeof value === 'string' && SEVERITIES.has(value)) {
    return value as RiskSeverity;
  }

  return RiskSeverity.MEDIUM;
}

/**
 * Valida e mapeia o JSON pedido ao modelo (`riskLevel`, `summary`, `findings`)
 * para o tipo de domínio (`summaryText`, enums).
 */
export function parseRiskClassificationFromLlmJson(
  rawContent: string,
): RiskClassificationResult {
  const cleaned = stripMarkdownFences(rawContent);

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('LLM returned invalid JSON');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('LLM JSON root must be an object');
  }

  const root = parsed as Record<string, unknown>;

  const riskLevelRaw = root.riskLevel;
  if (
    typeof riskLevelRaw !== 'string' ||
    !RISK_LEVELS.has(riskLevelRaw)
  ) {
    throw new Error(
      'LLM JSON must include riskLevel as one of: low, medium, high',
    );
  }

  const summaryRaw = root.summary;
  if (typeof summaryRaw !== 'string' || !summaryRaw.trim()) {
    throw new Error('LLM JSON must include a non-empty summary string');
  }

  const findingsRaw = root.findings;
  if (!Array.isArray(findingsRaw)) {
    throw new Error('LLM JSON must include findings as an array');
  }

  const findings: ClassifiedRiskFinding[] = findingsRaw.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`findings[${index}] must be an object`);
    }

    const row = item as Record<string, unknown>;
    const code = typeof row.code === 'string' ? row.code.trim() : '';
    const title = typeof row.title === 'string' ? row.title.trim() : '';
    const description =
      typeof row.description === 'string' ? row.description.trim() : '';

    if (!code || !title) {
      throw new Error(
        `findings[${index}] must include non-empty code and title`,
      );
    }

    return {
      code,
      title,
      description,
      severity: normalizeSeverity(row.severity),
    };
  });

  return {
    riskLevel: riskLevelRaw as AnalysisRiskLevel,
    summaryText: summaryRaw.trim(),
    findings,
  };
}
