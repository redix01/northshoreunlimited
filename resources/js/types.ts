export interface AuthUser {
  id: number;
  name: string;
  username: string | null;
  email: string;
  role: 'admin' | 'user';
  balance: number;
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

/* ─── Client portal dashboard ───────────────────────────────────────────── */

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  live: boolean;
}

/** A value paired with its percentage against the relevant base. */
export interface Change {
  value: number;
  percent: number;
}

export interface PortfolioSummary {
  base_symbol: string;
  base_price: number;
  daily_yield_rate: number;

  total_value: number;
  total_value_base: number;

  deposited: number;
  deposited_base: number;
  withdrawn: number;
  withdrawn_base: number;
  available: number;
  available_base: number;

  daily: Change;
  weekly: Change;
  all_time: Change;
  headline: Change;
}

export interface PortfolioHighlights {
  assets: number;
  daily_yield: number;
  best: { symbol: string; change: number } | null;
  worst: { symbol: string; change: number } | null;
}

export interface HoldingAsset {
  symbol: string;
  name: string;
  amount: number;
  price: number;
  change: number;
  value: number;
  daily_return: number;
  yield_rate: number;
  allocation: number;
}

export interface SeriesPoint {
  at: string;
  label: string;
  value: number;
}

export type ChartRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

export type PortfolioSeries = Record<ChartRange, SeriesPoint[]>;

/* ─── Account, profile and documents ────────────────────────────────────── */

export interface ProfileUser {
  name: string;
  email: string;
  email_verified: boolean;
  phone: string | null;
  date_of_birth: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  /** One-line composed address, for display. */
  address: string | null;
  employment_status: string | null;
  occupation: string | null;
  source_of_funds: string | null;
  pep_status: boolean;
  tax_id_last4: string | null;
  member_id: string | null;
  is_verified: boolean;
  is_vip: boolean;
  notifications_enabled: boolean;
  avatar_url: string | null;
  avatar_preset: string | null;
  initials: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface VerificationStep {
  key: string;
  label: string;
  done: boolean;
}

export interface Verification {
  is_verified: boolean;
  steps: VerificationStep[];
  progress: number;
  document_type: string | null;
  tax_id_last4: string | null;
  verified_at: string | null;
  name_match: boolean;
}

export interface UserDocumentItem {
  id: number;
  type: string;
  type_label: string;
  label: string | null;
  original_name: string;
  size: number;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  url: string;
  created_at: string;
}

export interface WalletSummary {
  base_symbol: string;
  base_price: number;

  balance: number;
  balance_base: number;
  deposited: number;
  deposited_base: number;
  pending: number;
  pending_base: number;
  withdrawn: number;

  daily_rate: number;
  daily: number;
  daily_base: number;
  profit_today: number;
  profit_today_base: number;
}

export interface AccountTransaction {
  id: string;
  kind: 'deposit' | 'withdrawal';
  amount: number;
  amount_base: number;
  currency: string;
  status: string;
  address: string | null;
  created_at: string;
}

export interface DashboardUser {
  name: string;
  email: string;
  balance: number;
  is_verified: boolean;
  member_id: string | null;
  avatar: string | null;
  created_at: string | null;
}
