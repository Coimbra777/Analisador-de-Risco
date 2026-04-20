import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Analysis } from './analysis.entity';
import { User } from './user.entity';

@Index('IDX_COMPANIES_CREATED_BY_USER_ID', ['createdByUserId'])
@Index('UQ_COMPANIES_USER_REGISTRATION_NUMBER', ['createdByUserId', 'registrationNumber'], {
  unique: true,
})
@Entity({ name: 'companies' })
export class Company {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'created_by_user_id', type: 'int' })
  createdByUserId!: number;

  @Column({ name: 'legal_name', type: 'varchar', length: 255 })
  legalName!: string;

  @Column({ name: 'trade_name', type: 'varchar', length: 255, nullable: true })
  tradeName!: string | null;

  @Column({ name: 'registration_number', type: 'varchar', length: 50, unique: true })
  registrationNumber!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country!: string | null;

  @ManyToOne(() => User, (user) => user.companies, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy!: User;

  @OneToMany(() => Analysis, (analysis) => analysis.company)
  analyses!: Analysis[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
