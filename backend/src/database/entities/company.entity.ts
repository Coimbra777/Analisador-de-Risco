import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { Analysis } from './analysis.entity';

@Entity({ name: 'companies' })
export class Company {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'legal_name', type: 'varchar', length: 255 })
  legalName!: string;

  @Column({ name: 'trade_name', type: 'varchar', length: 255, nullable: true })
  tradeName!: string | null;

  @Column({ name: 'registration_number', type: 'varchar', length: 50, unique: true })
  registrationNumber!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country!: string | null;

  @OneToMany(() => Analysis, (analysis) => analysis.company)
  analyses!: Analysis[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
