import api from './client';
import type { BankAccountDto, BankAccountRequest } from '../types/vendor';

export async function getBankAccount(): Promise<BankAccountDto | null> {
  const res = await api.get<BankAccountDto | null>('/vendors/bank-account');
  return res.data ?? null;
}

export async function saveBankAccount(request: BankAccountRequest): Promise<BankAccountDto> {
  const res = await api.post<BankAccountDto>('/vendors/bank-account', request);
  return res.data;
}

export async function deleteBankAccount(accountId: number): Promise<void> {
  await api.delete(`/vendors/bank-account/${accountId}`);
}
