import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

export class CreateItemDto {
  @IsString()
  category: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsOptional()
  colors?: any;

  @IsOptional()
  seasons?: any;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}

export class UpdateItemDto extends CreateItemDto {
  @IsString()
  @IsOptional()
  meshUrl?: string;
}
