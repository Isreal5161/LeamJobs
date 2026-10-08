export type UserScopedImage = {
  ownerId: string;
  url: string;
};

export const getUserScopedImageUrl = (
  image: UserScopedImage | null,
  ownerId: string | null | undefined,
): string | null => (ownerId && image?.ownerId === ownerId ? image.url : null);
