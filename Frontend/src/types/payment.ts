export interface PaystackConfig {
  key: string;
  email: string;
  amount: number;
  currency: string;
  ref: string;
  metadata: {
    custom_fields: Array<{
      display_name: string;
      variable_name: string;
      value?: string | number;
    }>;
  };
  callback: (response: PaystackResponse) => void;
  onClose: () => string;
}

export interface PaystackResponse {
  reference: string;
  status: 'success' | 'failed' | 'cancelled';
  transaction: string;
  message: string;
} 