import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class EditProductDto {
  @IsOptional()
    @IsString()
    name?: string;
  
    @IsOptional()
    @IsString()
    code?: string;
  
    @IsOptional()
    @IsString()
    unit?: string;
  
    @IsOptional()
    @IsNumber()
    in_price?: number;
  
    @IsOptional()
    @IsNumber()
    price?: number;
  
    @IsOptional()
    @IsNumber()
    vat?: number;
  
    @IsOptional()
    @IsString()
    currency?: string;
  
    @IsOptional()
    @IsInt()
    stock?: number;
  
    @IsString()
    @IsOptional()
    description?: string;
}
