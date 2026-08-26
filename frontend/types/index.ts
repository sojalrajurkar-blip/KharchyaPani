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
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCreateInput {
  amount: number;
  category_id: number;
  expense_date: string;
  note?: string;
}

export interface ExpenseUpdateInput {
  amount: number;
  category_id: number;
  expense_date: string;
  note?: string;
}

export interface CategorySummaryItem {
  category_id: number;
  category_name: string;
  total: number;
  count: number;
}

export interface DashboardSummary {
  total_expense: number;
  expense_count: number;
  recent_expenses: Expense[];
  category_summary: CategorySummaryItem[];
}

export interface ExpenseFilterParams {
  category_id?: number;
  date?: string;
  date_from?: string;
  date_to?: string;
}

export interface APIError {
  detail: string | { msg: string; loc: string[] }[];
  linked_expense_count?: number;
}

export interface HealthResponse {
  status: string;
  database: string;
}
