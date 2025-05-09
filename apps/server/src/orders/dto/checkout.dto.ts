import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ShippingAddressDto {
  @IsString()
  fullName: string;

  @IsString()
  address1: string;

  @IsOptional()
  @IsString()
  address2?: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  postalCode: string;

  @IsString()
  country: string;

  @IsString()
  phone: string;
}

export class PaymentMethodDto {
  @IsEnum(['credit_card', 'paypal'])
  type: 'credit_card' | 'paypal';
}

export class CheckoutDto {
  @IsString()
  sessionId: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ValidateNested()
  @Type(() => PaymentMethodDto)
  paymentMethod: PaymentMethodDto;
}
