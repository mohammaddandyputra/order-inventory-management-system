import { 
  IsNotEmpty, 
  IsNumber, 
  IsUUID, 
  Min, 
  Max, 
  IsPositive 
} from "class-validator";

export class CreateOrderDto {
  @IsNotEmpty({ message: 'User ID is required' })
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  userId: string;

  @IsNotEmpty({ message: 'Item ID is required' })
  @IsUUID('4', { message: 'Item ID must be a valid UUID' })
  itemId: string;

  @IsNotEmpty({ message: 'Quantity is required' })
  @IsNumber({}, { message: 'Quantity must be a number' })
  @IsPositive({ message: 'Quantity must be positive' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(1000, { message: 'Quantity cannot exceed 1000' })
  quantity: number;
}
