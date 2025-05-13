import { Injectable, BadRequestException } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { PaymentMethodType } from '../orders/dto/checkout.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhookService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly prisma: PrismaService
  ) {}

  async handleStripeEvent(event: any) {
    console.log(`Processing Stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log(`Processing checkout.session.completed for session: ${session.id}`);
        await this.processSuccessfulCheckout(session);
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`Payment succeeded: ${paymentIntent.id}`);
        // Additional handling for successful payments if needed
        break;

      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object;
        console.log(`Payment failed: ${failedPaymentIntent.id}`);
        // Handle failed payment (e.g., notify customer)
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  // Helper method to process successful checkout
  private async processSuccessfulCheckout(session: any) {
    try {
      // Check if an order already exists for this session
      const existingOrder = await this.prisma.order.findFirst({
        where: {
          paymentMethod: {
            contains: session.id
          }
        }
      });

      if (existingOrder) {
        console.log(`Order already exists for session ${session.id}, skipping creation`);
        return existingOrder;
      }

      // Get cart session ID from metadata
      const cartSessionId = session.metadata.sessionId;
      const customerId = session.metadata.customerId;
      const shippingAddress = session.metadata.shippingAddress;

      if (!cartSessionId || !shippingAddress) {
        throw new BadRequestException('Invalid session data');
      }

      // Create order in database
      return await this.ordersService.checkout({
        sessionId: cartSessionId,
        customerId: customerId || undefined,
        shippingAddress: JSON.parse(shippingAddress),
        paymentMethod: {
          type: PaymentMethodType.CREDIT_CARD,
          details: {
            paymentIntentId: session.payment_intent,
            sessionId: session.id, // Store session ID for deduplication
          },
        },
        stripeSession: session,
      });
    } catch (error) {
      console.error(`Error processing checkout session ${session.id}:`, error);
      throw error;
    }
  }
}
