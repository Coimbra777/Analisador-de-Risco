import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsString()
  @MaxLength(50)
  documentNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;
}
