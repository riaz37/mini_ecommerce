import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsObject,
  ValidateNested,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethodType {
  CREDIT_CARD = 'credit_card',
}

export class PaymentMethodDto {
  @ApiProperty({ enum: PaymentMethodType, description: 'Payment method type' })
  @IsEnum(PaymentMethodType)
  @IsNotEmpty()
  type: PaymentMethodType;

  @ApiPropertyOptional({ description: 'Additional payment details' })
  @IsObject()
  @IsOptional()
  details?: Record<string, any>;
}

export class AddressDto {
  @ApiProperty({ description: 'Street address' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'State or province' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ description: 'Postal code' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiProperty({ description: 'Country' })
  @IsString()
  @IsNotEmpty()
  country: string;
}

export class CheckoutDto {
  @ApiPropertyOptional({ description: 'Session ID for the cart' })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Customer ID if available' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ description: 'Shipping address' })
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress: AddressDto;

  @ApiProperty({ description: 'Payment method information' })
  @IsObject()
  @ValidateNested()
  @Type(() => PaymentMethodDto)
  paymentMethod: PaymentMethodDto;

  @ApiPropertyOptional({ description: 'Stripe session data if using Stripe' })
  @IsObject()
  @IsOptional()
  stripeSession?: Record<string, any>;
}
