import assert from 'node:assert/strict';
import test from 'node:test';
import { bonusSubmissionAction, type VideoGenerationJournal } from '../../scripts/bonus-video-policy';

const journal = (status: VideoGenerationJournal['status'], operation?: string): VideoGenerationJournal => ({
  status, operation, fingerprint: 'same-input', model: 'veo-3.1-lite-generate-preview', submittedAt: '2026-10-15',
});

test('bonus generation resumes saved operations and never retries uncertain or failed paid requests', () => {
  assert.equal(bonusSubmissionAction(undefined, 'same-input', false), 'new');
  for (const status of ['submitted', 'downloaded', 'submitting'] as const) {
    assert.equal(bonusSubmissionAction(journal(status, 'saved-operation'), 'same-input', false), 'resume');
  }
  for (const retry of [false, true]) {
    assert.throws(() => bonusSubmissionAction(journal('submitting'), 'same-input', retry), /Unresolved/);
    assert.throws(() => bonusSubmissionAction(journal('failed', 'saved-operation'), 'same-input', retry), /Unresolved/);
  }
});

test('only an explicitly rejected bonus request can be retried, with identical reviewed inputs', () => {
  assert.throws(() => bonusSubmissionAction(journal('rejected'), 'same-input', false), /rejected/);
  assert.equal(bonusSubmissionAction(journal('rejected'), 'same-input', true), 'retry-rejected');
  assert.throws(() => bonusSubmissionAction(journal('rejected'), 'changed-input', true), /Changed/);
  assert.throws(() => bonusSubmissionAction(journal('downloaded', 'saved-operation'), 'changed-input', false), /Changed/);
});
