import {
  Controller,
  Post,
  Headers,
  Req,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';

@ApiTags('webhooks')
@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('stripe')
  @ApiOperation({ summary: 'Handle Stripe webhooks' })
  async handleStripeWebhook(
    @Req() request: any,
    @Headers('stripe-signature') signature: string,
    @Body() payload: any,
  ) {
    console.log('Received Stripe webhook at /webhook/stripe');

    if (!signature) {
      console.error('Missing Stripe signature header');
      throw new BadRequestException('Missing Stripe signature');
    }

    // Get the raw body from the request
    const rawBody = request.rawBody;
    if (!rawBody) {
      console.error('Raw body not available for Stripe webhook verification');
      throw new BadRequestException('Raw body not available for verification');
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    console.log(
      `Verifying webhook with signature: ${signature.substring(0, 20)}...`,
    );
    console.log(
      `Using endpoint secret: ${endpointSecret ? 'Present (hidden)' : 'Missing!'}`,
    );
    console.log(`Raw body length: ${rawBody.length} bytes`);

    try {
      // Verify the event using the signature and raw body
      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        endpointSecret,
      );

      console.log(`Webhook verified! Event type: ${event.type}`);

      // Process the event using the webhook service
      const result = await this.webhookService.handleStripeEvent(event);

      return result;
    } catch (error) {
      console.error('Stripe webhook error:', error);
      throw new BadRequestException(`Webhook error: ${error.message}`);
    }
  }
}
