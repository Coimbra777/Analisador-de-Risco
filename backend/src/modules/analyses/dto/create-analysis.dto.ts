import { IsInt, Min } from 'class-validator';

export class CreateAnalysisDto {
  @IsInt()
  @Min(1)
  companyId!: number;
}
