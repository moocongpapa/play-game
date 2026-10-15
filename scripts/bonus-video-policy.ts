export interface VideoGenerationJournal {
  fingerprint: string;
  model: string;
  status: 'submitting' | 'submitted' | 'downloaded' | 'failed' | 'rejected';
  operation?: string;
  error?: string;
  submittedAt: string;
}

/** An uncertain submission may already be billed; only explicit rejections can be retried. */
export function bonusSubmissionAction(journal: VideoGenerationJournal | undefined, fingerprint: string, retryRejected: boolean) {
  if (!journal) return 'new';
  if (journal.fingerprint !== fingerprint) throw new Error('Changed bonus inputs; review the saved request before continuing.');
  if (journal.status === 'rejected') {
    if (!retryRejected) throw new Error('Bonus request was rejected; resolve its cause and explicitly use --retry-rejected.');
    return 'retry-rejected';
  }
  if (journal.status === 'failed' || !journal.operation) {
    throw new Error('Unresolved bonus request; no automatic duplicate generation. Inspect its saved operation first.');
  }
  return 'resume';
}
