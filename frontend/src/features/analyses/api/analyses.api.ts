import { apiClient } from '@/shared/http/api-client';
import type { AnalysisDetail, AnalysisListItem } from '@/shared/types/models';

export async function fetchAnalysisList() {
  const { data } = await apiClient.get<AnalysisListItem[]>('/analyses');

  return data;
}

export async function fetchAnalysisDetail(analysisId: number) {
  const { data } = await apiClient.get<AnalysisDetail>(`/analyses/${analysisId}`);

  return data;
}

export async function createAnalysis(payload: { companyId: number }) {
  const { data } = await apiClient.post<AnalysisDetail>('/analyses', payload);

  return data;
}
