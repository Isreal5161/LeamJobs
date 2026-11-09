export const ADMIN_DRAFT_TTL_MS: number;

export type AdminDraftReadResult<T> = {
  draft: T | null;
  error: string | null;
};

export type AdminDraftWriteResult = {
  ok: boolean;
  error: string | null;
};

export interface AdminDraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function readAdminDraft<T>(
  userId: string,
  draftId: string,
  validate: (value: unknown) => value is T,
  storage?: AdminDraftStorage,
  now?: number,
): AdminDraftReadResult<T>;

export function writeAdminDraft(
  userId: string,
  draftId: string,
  data: unknown,
  storage?: AdminDraftStorage,
  now?: number,
): AdminDraftWriteResult;

export function clearAdminDraft(
  userId: string,
  draftId: string,
  storage?: AdminDraftStorage,
): AdminDraftWriteResult;
