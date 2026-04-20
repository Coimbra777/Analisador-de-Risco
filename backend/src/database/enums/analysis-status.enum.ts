export enum AnalysisStatus {
  PENDING = 'pending',
  // Keep persisted values stable to preserve database/frontend compatibility.
  PROCESSING = 'in_progress',
  DONE = 'completed',
  FAILED = 'failed',
}
