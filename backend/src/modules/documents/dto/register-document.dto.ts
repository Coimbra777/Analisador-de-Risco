import { IsInt, IsString, MaxLength, Min } from 'class-validator';

export class RegisterDocumentDto {
  @IsInt()
  @Min(1)
  analysisId!: number;

  @IsString()
  @MaxLength(255)
  originalFilename!: string;
}
