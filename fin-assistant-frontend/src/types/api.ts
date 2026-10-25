export interface User {
  id: number;
  email: string;
  created_at?: string;
}

export interface Account {
  id: number;
  name: string;
  balance: string;
  created_at?: string;
  updated_at?: string;
}

export type CategoryType = 'income' | 'expense';

export interface Category {
  id: number;
  name: string;
  type: CategoryType;
}

export type OperationType = 'income' | 'expense' | 'transfer';

export interface Operation {
  id: number;
  type: OperationType;
  amount: string;
  occurred_at: string;
  from_account_id: number;
  to_account_id?: number | null;
  category_id?: number | null;
  comment?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface OperationsFilterParams {
  limit?: number;
  offset?: number;
  type?: OperationType | '';
  account_id?: number | '';
  category_id?: number | '';
  from?: string;
  to?: string;
}

export type PlannedExpenseStatus = 'pending' | 'paid';

export interface PlannedExpense {
  id: number;
  name: string;
  amount: string;
  due_date: string;
  status: PlannedExpenseStatus;
  created_at?: string;
  updated_at?: string;
}

export interface PayPlannedExpensePayload {
  account_id: number;
  category_id: number;
  occurred_at?: string;
  comment?: string;
}

export interface Reserve {
  amount: string;
  updated_at?: string;
}

export interface Dashboard {
  total_balance: string;
  upcoming_expenses_total: string;
  reserve_amount: string;
  available_amount: string;
  currency: string;
  accounts: Pick<Account, 'id' | 'name' | 'balance'>[];
  upcoming_expenses: Pick<PlannedExpense, 'id' | 'name' | 'amount' | 'due_date' | 'status'>[];
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  fields?: ApiFieldError[];
}

export interface ApiErrorResponse {
  detail: ApiErrorDetail | string | Array<{ loc: (string | number)[]; msg: string }>;
}
