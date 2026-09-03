import { apiClient } from './client';

export interface ReceiptScanResponse {
  amount?: number;
  expense_date?: string;
  merchant_name?: string;
  suggested_category_name?: string;
  suggested_category_id?: number;
  payment_mode?: string;
  note?: string;
  confidence: number;
  raw_text?: string;
}

export interface ExpenseParseResponse {
  amount: number;
  expense_date: string;
  suggested_category_name?: string;
  suggested_category_id?: number;
  payment_mode: string;
  note?: string;
  confidence: number;
}

export interface SuggestedAction {
  label: string;
  href: string;
}

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIChatResponse {
  reply: string;
  suggested_actions: SuggestedAction[];
}

export interface VelocityWarning {
  has_warning: boolean;
  category_name?: string;
  predicted_exhaustion_date?: string;
  message: string;
}

export interface AIInsightsResponse {
  velocity_warning: VelocityWarning;
  savings_tips: string[];
}

export const aiApi = {
  scanReceipt: async (file: File): Promise<ReceiptScanResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient<ReceiptScanResponse>('/api/ai/scan-receipt', {
      method: 'POST',
      body: formData,
    });
  },

  parseExpense: async (text: string): Promise<ExpenseParseResponse> => {
    return apiClient<ExpenseParseResponse>('/api/ai/parse-expense', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  chat: async (message: string, history: AIChatMessage[] = []): Promise<AIChatResponse> => {
    return apiClient<AIChatResponse>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    });
  },

  getInsights: async (): Promise<AIInsightsResponse> => {
    return apiClient<AIInsightsResponse>('/api/ai/insights', {
      method: 'GET',
    });
  },
};
