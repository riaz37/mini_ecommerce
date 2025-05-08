import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRatingDto {
  @ApiProperty({
    example: 4,
    description: 'Rating value (1-5)',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  value: number;

  @ApiProperty({
    example: 'Great product, highly recommended!',
    description: 'Optional comment with the rating',
    required: false,
  })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Product ID to rate',
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Customer ID submitting the rating',
  })
  @IsString()
  @IsNotEmpty()
  customerId: string;
}