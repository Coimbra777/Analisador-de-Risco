import { apiClient } from '@/shared/http/api-client';
import type { Company } from '@/shared/types/api.types';

export async function fetchCompanyList() {
  const { data } = await apiClient.get<Company[]>('/companies');

  return data;
}

export async function createCompany(payload: {
  legalName: string;
  tradeName?: string;
  registrationNumber: string;
  country?: string;
}) {
  const { data } = await apiClient.post<Company>('/companies', payload);

  return data;
}
