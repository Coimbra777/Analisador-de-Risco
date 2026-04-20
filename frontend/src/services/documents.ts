import { api } from './api';
import type { AnalysisDetail } from '@/types/models';

export async function uploadAnalysisDocument(
  analysisId: number,
  file: File,
) {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post<{ message: string; analysis: AnalysisDetail }>(
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
