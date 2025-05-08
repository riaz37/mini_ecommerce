import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({
    example: 'session-123456',
    description: 'Unique session identifier for the cart',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Product ID to add to cart',
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    example: 2,
    description: 'Quantity of the product to add (minimum 1)',
  })
  @IsNumber()
  @Min(1)
  quantity: number;
}
