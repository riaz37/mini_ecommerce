import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Max,
  Min,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRatingDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Product ID',
  })
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Customer ID or "current" to use the authenticated user',
  })
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @ApiProperty({
    example: 4.5,
    description: 'Rating value (1-5)',
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  value: number;

  @ApiProperty({
    example: 'Great product, highly recommended!',
    description: 'Review comment',
    required: false,
  })
  @IsString()
  @IsOptional()
  comment?: string;
}
