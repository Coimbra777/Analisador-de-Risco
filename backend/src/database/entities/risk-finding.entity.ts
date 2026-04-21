import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { RiskSeverity } from '../enums/risk-severity.enum';
import { Analysis } from './analysis.entity';
import { Document } from './document.entity';

@Entity({ name: 'risk_findings' })
export class RiskFinding {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  code!: string | null;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: RiskSeverity,
    default: RiskSeverity.MEDIUM,
  })
  severity!: RiskSeverity;

  @ManyToOne(() => Analysis, (analysis) => analysis.riskFindings, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'analysis_id' })
  analysis!: Analysis;

  @Column({ name: 'analysis_id', type: 'int' })
  analysisId!: number;

  @ManyToOne(() => Document, (document) => document.riskFindings, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'document_id' })
  document!: Document;

  @Column({ name: 'document_id', type: 'int' })
  documentId!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
