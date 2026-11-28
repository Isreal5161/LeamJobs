import assert from 'node:assert/strict';
import test from 'node:test';
import { getPublicAccountRole, normalizeApiError } from '../src/utils/userFacingError.ts';

test('invalid manual sign-in credentials remain generic', () => {
  const result = normalizeApiError({
    status: 401,
    message: 'Invalid email or password.',
    context: 'login',
  });

  assert.equal(result.message, 'Invalid email or password.');
});

test('manual sign-in role conflicts preserve safe, field-free role guidance', () => {
  const result = normalizeApiError({
    status: 403,
    code: 'ROLE_MISMATCH',
    message: 'This account is registered as a Seeker. Continue with Seeker sign-in.',
    context: 'login',
  });

  assert.equal(result.message, 'This account is registered as a Seeker. Continue with Seeker sign-in.');
  assert.equal(result.code, 'ROLE_MISMATCH');
});

test('only recognized seeker and employer roles are extracted from public error details', () => {
  assert.equal(getPublicAccountRole({ role: 'SEEKER' }), 'SEEKER');
  assert.equal(getPublicAccountRole({ role: 'EMPLOYER' }), 'EMPLOYER');
  assert.equal(getPublicAccountRole({ role: 'ADMIN' }), undefined);
  assert.equal(getPublicAccountRole(null), undefined);
});
