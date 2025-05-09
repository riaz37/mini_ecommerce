import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({
    example: 'product-123',
    description: 'Product ID to add to cart',
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    example: 2,
    description: 'Quantity to add (minimum 1)',
  })
  @IsNumber()
  @Min(1)
  quantity: number;

  // sessionId is not included in DTO as it should come from cookies
}
