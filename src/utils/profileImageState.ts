export type UserScopedImage = {
  ownerId: string;
  url: string;
};

export const getUserScopedImageUrl = (
  image: UserScopedImage | null,
  ownerId: string | null | undefined,
): string | null => (ownerId && image?.ownerId === ownerId ? image.url : null);

export const getConversationAvatarEndpoint = (
  role: 'seeker' | 'employer',
  participantId: string,
  hasImage: boolean,
): string | null => {
  if (!participantId || !hasImage) return null;

  return role === 'employer'
    ? `/employer/candidates/${encodeURIComponent(participantId)}/profile-picture`
    : `/public/companies/${encodeURIComponent(participantId)}/logo`;
};
