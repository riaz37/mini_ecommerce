import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckoutDto {
  @ApiProperty({
    example: 'session-123456',
    description: 'Session ID associated with the cart',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Customer ID for the order',
  })
  @IsString()
  @IsNotEmpty()
  customerId: string;
}
