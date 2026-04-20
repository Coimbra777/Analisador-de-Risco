import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';

import { RiskSeverity } from '../enums/risk-severity.enum';
import { Analysis } from './analysis.entity';

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

  @RelationId((riskFinding: RiskFinding) => riskFinding.analysis)
  analysisId!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
