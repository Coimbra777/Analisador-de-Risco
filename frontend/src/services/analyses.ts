import { api } from './api';
import type { AnalysisDetail, AnalysisListItem } from '@/types/models';

export async function fetchAnalyses() {
  const { data } = await api.get<AnalysisListItem[]>('/analyses');

  return data;
}

export async function fetchAnalysisDetail(id: number) {
  const { data } = await api.get<AnalysisDetail>(`/analyses/${id}`);

  return data;
}

export async function createAnalysis(payload: { companyId: number }) {
  const { data } = await api.post<AnalysisDetail>('/analyses', payload);

  return data;
}
