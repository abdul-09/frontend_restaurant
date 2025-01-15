import { PaystackConfig, PaystackResponse } from '../types/payment';

class PaymentService {
  private static instance: PaymentService;

  private constructor() {}

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  getPaymentConfig(
    amount: number,
    email: string,
    orderId?: string,
    bookingId?: string,
    callback?: (response: PaystackResponse) => void,
    onClose?: () => string
  ): PaystackConfig {
    return {
      key: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY!,
      email,
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'KES',
      ref: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        custom_fields: [
          {
            display_name: orderId ? "Order ID" : "Booking ID",
            variable_name: orderId ? "order_id" : "booking_id",
            value: orderId || bookingId || "pending"
          }
        ]
      },
      callback: callback || (() => {}),
      onClose: onClose || (() => 'cancelled'),
    };
  }

  async verifyPayment(reference: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/v1/payments/verify/${reference}`);
      const data = await response.json();
      return data.status === 'success';
    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    }
  }
}

export default PaymentService.getInstance(); 