import { api } from './api';
import type { Company } from '@/types/models';

export async function fetchCompanies() {
  const { data } = await api.get<Company[]>('/companies');

  return data;
}

export async function createCompany(payload: {
  legalName: string;
  tradeName?: string;
  registrationNumber: string;
  country?: string;
}) {
  const { data } = await api.post<Company>('/companies', payload);

  return data;
}
