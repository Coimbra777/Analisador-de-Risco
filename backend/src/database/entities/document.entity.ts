import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { AnalysisRiskLevel } from '../enums/analysis-risk-level.enum';
import { DocumentStatus } from '../enums/document-status.enum';
import { Analysis } from './analysis.entity';
import { RiskFinding } from './risk-finding.entity';

@Entity({ name: 'documents' })
export class Document {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'original_filename', type: 'varchar', length: 255 })
  originalFilename!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100, nullable: true })
  mimeType!: string | null;

  @Column({ name: 'storage_key', type: 'varchar', length: 255, nullable: true })
  storageKey!: string | null;

  @Column({ name: 'file_size_bytes', type: 'int', unsigned: true, nullable: true })
  fileSizeBytes!: number | null;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status!: DocumentStatus;

  @Column({ name: 'extracted_text', type: 'longtext', nullable: true })
  extractedText!: string | null;

  @Column({ name: 'summary_text', type: 'text', nullable: true })
  summaryText!: string | null;

  @Column({
    name: 'risk_level',
    type: 'enum',
    enum: AnalysisRiskLevel,
    nullable: true,
  })
  riskLevel!: AnalysisRiskLevel | null;

  @OneToMany(() => RiskFinding, (riskFinding) => riskFinding.document)
  riskFindings!: RiskFinding[];

  @ManyToOne(() => Analysis, (analysis) => analysis.documents, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'analysis_id' })
  analysis!: Analysis;

  @Column({ name: 'analysis_id', type: 'int' })
  analysisId!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
