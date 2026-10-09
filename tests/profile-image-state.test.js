import assert from 'node:assert/strict';
import test from 'node:test';
import { getConversationAvatarEndpoint, getUserScopedImageUrl } from '../src/utils/profileImageState.ts';

test('a cached profile image is visible only to the user it belongs to', () => {
  const image = { ownerId: 'user-a', url: 'blob:user-a-image' };

  assert.equal(getUserScopedImageUrl(image, 'user-a'), 'blob:user-a-image');
  assert.equal(getUserScopedImageUrl(image, 'user-b'), null);
});

test('logout and a subsequent login cannot reuse the previous user image', () => {
  const userAImage = { ownerId: 'user-a', url: 'blob:user-a-image' };

  assert.equal(getUserScopedImageUrl(userAImage, null), null);
  assert.equal(getUserScopedImageUrl(userAImage, 'user-b'), null);
});

test('separate users do not collide in profile image state', () => {
  const images = new Map([
    ['user-a', { ownerId: 'user-a', url: 'blob:user-a-image' }],
    ['user-b', { ownerId: 'user-b', url: 'blob:user-b-image' }],
  ]);

  assert.equal(getUserScopedImageUrl(images.get('user-a'), 'user-b'), null);
  assert.equal(getUserScopedImageUrl(images.get('user-b'), 'user-b'), 'blob:user-b-image');
});

test('conversation profile image endpoints are specific to the actual participant', () => {
  assert.equal(
    getConversationAvatarEndpoint('employer', 'seeker-a', true),
    '/employer/candidates/seeker-a/profile-picture',
  );
  assert.equal(
    getConversationAvatarEndpoint('employer', 'seeker-b', true),
    '/employer/candidates/seeker-b/profile-picture',
  );
  assert.equal(
    getConversationAvatarEndpoint('seeker', 'employer-a', true),
    '/public/companies/employer-a/logo',
  );
  assert.equal(getConversationAvatarEndpoint('employer', 'seeker-a', false), null);
});
