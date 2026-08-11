export interface AuthUser {
  id: number;
  name: string;
  username: string | null;
  email: string;
  role: 'admin' | 'user';
  status?: 'active' | 'suspended';
  balance: number;
  topup_enabled?: boolean;
  daily_topup_percent?: string | null;
  last_topup_at?: string | null;
  is_verified: boolean;
  member_id: string | null;
  avatar: string | null;
  phone: string | null;
  address: string | null;
  created_at: string | null;
}

export interface PageProps {
  auth: { user: AuthUser | null };
  flash: { success?: string; error?: string };
}

export interface Deposit {
  id: number;
  user_id: number;
  amount: string;
  currency: string;
  wallet_address: string | null;
  tx_hash: string | null;
  proof_path: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  user?: AuthUser;
}

export interface Withdrawal {
  id: number;
  user_id: number;
  amount: string;
  fee: string;
  currency: string;
  wallet_address: string;
  network: string | null;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
  admin_notes: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  user?: AuthUser;
}

export type EarningType = 'daily_topup' | 'manual_credit' | 'manual_debit';

export interface Earning {
  id: number;
  user_id: number;
  type: EarningType;
  rate: string | null;
  amount: string;
  balance_before: string;
  balance_after: string;
  note: string | null;
  created_at: string;
  user?: AuthUser;
}

export type SettingValue = string | number | boolean;

export interface SettingField {
  key: string;
  type: 'string' | 'bool' | 'int' | 'float';
  label: string;
  help: string;
}

export interface SettingGroup {
  key: string;
  label: string;
  description: string;
  fields: SettingField[];
}

export interface Wallet {
  id: number;
  name: string;
  currency: string;
  network: string | null;
  address: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedData<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
  links: { url: string | null; label: string; active: boolean }[];
}

export type StatusVariant = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
