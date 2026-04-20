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
import { AnalysisStatus } from '../enums/analysis-status.enum';
import { Company } from './company.entity';
import { Document } from './document.entity';
import { RiskFinding } from './risk-finding.entity';
import { User } from './user.entity';

@Entity({ name: 'analyses' })
export class Analysis {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'company_id', type: 'int' })
  companyId!: number;

  @Column({ name: 'created_by_user_id', type: 'int' })
  createdByUserId!: number;

  @Column({
    type: 'enum',
    enum: AnalysisStatus,
    default: AnalysisStatus.PENDING,
  })
  status!: AnalysisStatus;

  @Column({
    name: 'risk_level',
    type: 'enum',
    enum: AnalysisRiskLevel,
    nullable: true,
  })
  riskLevel!: AnalysisRiskLevel | null;

  @Column({ name: 'summary_text', type: 'text', nullable: true })
  summaryText!: string | null;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt!: Date | null;

  @ManyToOne(() => Company, (company) => company.analyses, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @ManyToOne(() => User, (user) => user.analyses, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy!: User;

  @OneToMany(() => Document, (document) => document.analysis)
  documents!: Document[];

  @OneToMany(() => RiskFinding, (riskFinding) => riskFinding.analysis)
  riskFindings!: RiskFinding[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
