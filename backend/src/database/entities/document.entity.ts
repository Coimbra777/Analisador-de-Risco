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

import { DocumentStatus } from '../enums/document-status.enum';
import { Analysis } from './analysis.entity';

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

  @ManyToOne(() => Analysis, (analysis) => analysis.documents, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'analysis_id' })
  analysis!: Analysis;

  @RelationId((document: Document) => document.analysis)
  analysisId!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
