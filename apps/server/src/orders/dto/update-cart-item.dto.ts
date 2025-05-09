import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCartItemDto {
  @ApiProperty({
    example: 'session-123456',
    description: 'Unique session identifier for the cart',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    example: 3,
    description: 'New quantity for the cart item (minimum 1)',
  })
  @IsNumber()
  @Min(1)
  quantity: number;
}