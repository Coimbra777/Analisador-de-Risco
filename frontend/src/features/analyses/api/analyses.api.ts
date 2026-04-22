import { apiClient } from '@/shared/http/api-client';
import type { AnalysisDetail, AnalysisListItem } from '@/shared/types/api.types';

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

export async function uploadAnalysisDocument(analysisId: number, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await apiClient.post<{ message: string; analysis: AnalysisDetail }>(
    `/analyses/${analysisId}/document`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return data;
}
