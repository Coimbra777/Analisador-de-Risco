import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LlmRiskAnalyzer } from './llm-risk.analyzer';
import type { RiskClassificationResult } from './interfaces/risk-classification-result.interface';
import type { RiskAnalyzer, RiskAnalyzerInput } from './risk-analyzer.contract';
import { RiskRulesService } from './services/risk-rules.service';

/**
 * Seleciona keyword vs LLM (ou LLM com fallback) conforme RISK_ANALYZER_MODE.
 */
@Injectable()
export class SelectingRiskAnalyzer implements RiskAnalyzer {
  private readonly logger = new Logger(SelectingRiskAnalyzer.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly keywordAnalyzer: RiskRulesService,
    private readonly llmAnalyzer: LlmRiskAnalyzer,
  ) {}

  async analyze(input: RiskAnalyzerInput): Promise<RiskClassificationResult> {
    const mode = this.configService
      .get<string>('riskAnalyzer.mode', 'keyword')
      .trim()
      .toLowerCase();

    if (mode === 'llm') {
      return this.llmAnalyzer.analyze(input);
    }

    if (mode === 'llm_with_fallback') {
      try {
        return await this.llmAnalyzer.analyze(input);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(`LLM failed, using keyword analyzer: ${message}`);
        return this.keywordAnalyzer.analyze(input);
      }
    }

    return this.keywordAnalyzer.analyze(input);
  }
}
