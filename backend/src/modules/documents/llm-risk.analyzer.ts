import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { RiskClassificationResult } from './interfaces/risk-classification-result.interface';
import { parseRiskClassificationFromLlmJson } from './llm/llm-risk-json.parser';
import type { RiskAnalyzer, RiskAnalyzerInput } from './risk-analyzer.contract';

/**
 * Análise via API compatível com OpenAI Chat Completions (env: LLM_*).
 * Saída esperada do modelo: JSON com riskLevel, summary, findings (validado em parseRiskClassificationFromLlmJson).
 */
@Injectable()
export class LlmRiskAnalyzer implements RiskAnalyzer {
  private readonly logger = new Logger(LlmRiskAnalyzer.name);

  constructor(private readonly configService: ConfigService) {}

  async analyze(input: RiskAnalyzerInput): Promise<RiskClassificationResult> {
    const apiKey = this.configService.get<string>('llm.apiKey', '').trim();

    if (!apiKey) {
      throw new Error('LLM_API_KEY is not configured');
    }

    const baseUrl = this.configService.get<string>(
      'llm.baseUrl',
      'https://api.openai.com/v1',
    );
    const model = this.configService.get<string>('llm.model', 'gpt-4o-mini');
    const maxInputChars = this.configService.get<number>(
      'llm.maxInputChars',
      12000,
    );
    const timeoutMs = this.configService.get<number>('llm.timeoutMs', 60000);
    const jsonObjectMode = this.configService.get<boolean>(
      'llm.jsonObjectMode',
      true,
    );

    const text = input.extractedText.slice(0, Math.max(0, maxInputChars));

    const systemPrompt = `You assess supplier / third-party hiring risk from document text only.
Respond with ONLY a JSON object (no markdown fences, no commentary). Shape:
{
  "riskLevel": "low" | "medium" | "high",
  "summary": "2-4 sentences, same language as the document when possible",
  "findings": [
    {
      "code": "snake_case_identifier",
      "title": "short label",
      "description": "what in the text supports this",
      "severity": "low" | "medium" | "high"
    }
  ]
}
Rules: base riskLevel on substance; use findings=[] if nothing notable; do not invent facts not supported by the text.`;

    const userPrompt = `Document text:\n\n${text}`;

    const body: Record<string, unknown> = {
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    };

    if (jsonObjectMode) {
      body.response_format = { type: 'json_object' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;

    try {
      response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      this.logger.warn(
        `LLM HTTP ${response.status}: ${errBody.slice(0, 500)}`,
      );
      throw new Error(`LLM request failed with status ${response.status}`);
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = json.choices?.[0]?.message?.content;

    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('LLM returned empty content');
    }

    return parseRiskClassificationFromLlmJson(content);
  }
}
