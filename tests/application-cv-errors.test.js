import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeApiError } from '../src/utils/userFacingError.ts';

test('missing CV storage objects produce a useful message without exposing object keys', () => {
  const objectKey = 'seekers/private-user/resume/secret-file.pdf';
  const error = normalizeApiError({
    status: 404,
    code: 'STORAGE_OBJECT_MISSING',
    message: `NoSuchKey: ${objectKey}`,
    context: 'upload',
  });

  assert.equal(error.message, 'The uploaded CV file is no longer available.');
  assert.equal(error.code, 'STORAGE_OBJECT_MISSING');
  assert.doesNotMatch(error.message, /seekers|private-user|secret-file|NoSuchKey/);
});

test('unavailable CV references do not reveal internal storage references', () => {
  const error = normalizeApiError({
    status: 404,
    code: 'CV_REFERENCE_UNAVAILABLE',
    message: 'resumeObjectKey points to private storage metadata',
    context: 'upload',
  });

  assert.equal(error.message, 'This CV cannot be retrieved securely. Upload it again before using it.');
  assert.doesNotMatch(error.message, /resumeObjectKey|storage metadata/);
});

test('CV network failures return understandable connectivity guidance', () => {
  const error = normalizeApiError({
    status: 0,
    message: 'fetch failed: ECONNRESET at https://private-api.example.test',
    context: 'upload',
  });

  assert.match(error.message, /couldn't connect to LeamJobs/);
  assert.doesNotMatch(error.message, /ECONNRESET|private-api|https:\/\//);
});

test('CV server failures do not expose provider errors, paths, or stack traces', () => {
  const error = normalizeApiError({
    status: 500,
    message: 'AccessDenied at R2 bucket/private/path: Error at readObject (storage.service.js:101)',
    context: 'upload',
  });

  assert.equal(error.message, 'Something went wrong on our side. Please try again shortly.');
  assert.doesNotMatch(error.message, /AccessDenied|R2|private\/path|storage\.service\.js/);
});

test('general error behavior stays unchanged for unrelated business and authorization failures', () => {
  assert.equal(normalizeApiError({ status: 422, message: 'Invalid withdrawal amount.' }).message, 'Invalid withdrawal amount.');
  assert.equal(normalizeApiError({ status: 403, message: 'internal details' }).message, "You don't have permission to perform this action.");
  assert.equal(normalizeApiError({ status: 500, message: 'database stack trace' }).message, 'Something went wrong on our side. Please try again shortly.');
});
