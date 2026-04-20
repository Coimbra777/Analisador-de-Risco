import { apiClient } from '@/shared/http/api-client';
import type { AnalysisDetail } from '@/shared/types/models';

export async function uploadAnalysisDocument(
  analysisId: number,
  file: File,
) {
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
