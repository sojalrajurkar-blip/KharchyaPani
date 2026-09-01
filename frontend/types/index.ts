export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterInput {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  current_password: string;
  new_password: string;
}

export interface ResetPasswordInput {
  token: string;
  new_password: string;
}

export interface Category {
  id: number;
  name: string;
  created_at: string;
}

export interface CategoryCreateInput {
  name: string;
}

export interface CategoryUpdateInput {
  name: string;
}

export interface Expense {
  id: number;
  amount: number;
  category_id: number;
  category_name?: string;
  expense_date: string;
  payment_mode?: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCreateInput {
  amount: number;
  category_id: number;
  expense_date: string;
  payment_mode?: string;
  note?: string;
}

export interface ExpenseUpdateInput {
  amount: number;
  category_id: number;
  expense_date: string;
  payment_mode?: string;
  note?: string;
}

export interface CategorySummaryItem {
  category_id: number;
  category_name: string;
  total: number;
  count: number;
}

export interface PaymentModeSummaryItem {
  payment_mode: string;
  total: number;
  count: number;
}

export interface Budget {
  id: number;
  period_type: 'daily' | 'monthly';
  category_id?: number | null;
  category_name?: string | null;
  amount_limit: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetCreateInput {
  period_type: 'daily' | 'monthly';
  category_id?: number | null;
  amount_limit: number;
}

export interface BudgetUpdateInput {
  amount_limit: number;
}

export interface BudgetProgress {
  id?: number | null;
  period_type: 'daily' | 'monthly';
  category_id?: number | null;
  category_name?: string | null;
  amount_limit: number;
  spent_amount: number;
  remaining_amount: number;
  percentage: number;
}

export interface DashboardSummary {
  total_expense: number;
  expense_count: number;
  recent_expenses: Expense[];
  category_summary: CategorySummaryItem[];
  payment_mode_summary: PaymentModeSummaryItem[];
  daily_budget_progress?: BudgetProgress | null;
}

export interface ExpenseFilterParams {
  category_id?: number;
  date?: string;
  date_from?: string;
  date_to?: string;
  payment_mode?: string;
}

export interface APIError {
  detail: string | { msg: string; loc: string[] }[];
  linked_expense_count?: number;
}

export interface HealthResponse {
  status: string;
  database: string;
}
