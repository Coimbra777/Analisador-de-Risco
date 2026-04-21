import type { RiskClassificationResult } from './interfaces/risk-classification-result.interface';

/**
 * Token Nest: por padrão resolve para `SelectingRiskAnalyzer` (keyword / LLM / fallback via env).
 */
export const RISK_ANALYZER = Symbol('RISK_ANALYZER');

/** Entrada mínima do motor de risco; no futuro pode ganhar ids de contexto sem quebrar chamadas atuais. */
export type RiskAnalyzerInput = {
  extractedText: string;
};

/**
 * Contrato único para análise de risco pós-extração de texto.
 * Assíncrono para acomodar chamadas HTTP a LLM sem mudar o fluxo do upload depois.
 */
export interface RiskAnalyzer {
  analyze(input: RiskAnalyzerInput): Promise<RiskClassificationResult>;
}
