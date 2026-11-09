export const ADMIN_DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const draftStorageKey = (userId, draftId) => (
  `leamjobs:admin-draft:v1:${encodeURIComponent(userId)}:${encodeURIComponent(draftId)}`
);

const getStorage = (storageOverride) => {
  if (storageOverride) return storageOverride;
  if (typeof window === 'undefined') return null;
  return window.localStorage;
};

const removeStoredDraft = (key, storage) => {
  try {
    storage.removeItem(key);
    return null;
  } catch {
    return 'This saved draft could not be removed from this browser.';
  }
};

export function readAdminDraft(userId, draftId, validate, storageOverride, now = Date.now()) {
  if (!userId || !draftId) return { draft: null, error: null };

  try {
    const storage = getStorage(storageOverride);
    if (!storage) return { draft: null, error: null };
    const key = draftStorageKey(userId, draftId);
    const stored = storage.getItem(key);
    if (!stored) return { draft: null, error: null };

    let envelope;
    try {
      envelope = JSON.parse(stored);
    } catch {
      return { draft: null, error: removeStoredDraft(key, storage) ?? 'A saved draft could not be read and was discarded.' };
    }

    if (
      !envelope
      || envelope.version !== 1
      || !Number.isFinite(envelope.savedAt)
      || envelope.savedAt > now + 5 * 60 * 1000
      || now - envelope.savedAt > ADMIN_DRAFT_TTL_MS
    ) {
      const expired = Number.isFinite(envelope?.savedAt) && now - envelope.savedAt > ADMIN_DRAFT_TTL_MS;
      const error = removeStoredDraft(key, storage);
      return { draft: null, error: error ?? (expired ? null : 'An invalid saved draft was discarded.') };
    }

    if (!validate(envelope.data)) {
      const error = removeStoredDraft(key, storage);
      return { draft: null, error: error ?? 'An invalid saved draft was discarded.' };
    }

    return { draft: envelope.data, error: null };
  } catch {
    return { draft: null, error: 'Saved drafts are unavailable in this browser session.' };
  }
}

export function writeAdminDraft(userId, draftId, data, storageOverride, now = Date.now()) {
  if (!userId || !draftId) return { ok: false, error: 'A signed-in administrator is required to save this draft.' };

  try {
    const storage = getStorage(storageOverride);
    if (!storage) return { ok: false, error: 'Saved drafts are unavailable in this browser session.' };
    storage.setItem(draftStorageKey(userId, draftId), JSON.stringify({
      version: 1,
      savedAt: now,
      data,
    }));
    return { ok: true, error: null };
  } catch {
    return { ok: false, error: 'This draft could not be saved in browser storage.' };
  }
}

export function clearAdminDraft(userId, draftId, storageOverride) {
  if (!userId || !draftId) return { ok: true, error: null };

  try {
    const storage = getStorage(storageOverride);
    if (!storage) return { ok: false, error: 'Saved drafts are unavailable in this browser session.' };
    storage.removeItem(draftStorageKey(userId, draftId));
    return { ok: true, error: null };
  } catch {
    return { ok: false, error: 'This saved draft could not be removed from this browser.' };
  }
}
