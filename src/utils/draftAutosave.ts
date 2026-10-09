type Timer = ReturnType<typeof setTimeout>;

/** Retains the latest edit until it has been handed to the ordered storage writer. */
export function createDraftAutosave<T>(save: (draft: T) => Promise<unknown>, onError: () => void, delay = 1500) {
  let timer: Timer | undefined;
  let pending: T | undefined;
  let revision = 0;
  const flush = () => {
    clearTimeout(timer);
    timer = undefined;
    if (pending === undefined) return;
    const draft = pending;
    const savingRevision = revision;
    pending = undefined;
    void save(draft).catch(() => {
      // Keep a failed edit for the next hide/unmount flush unless a newer edit exists.
      if (revision === savingRevision) pending ??= draft;
      onError();
    });
  };
  return {
    schedule(draft: T) { revision++; pending = draft; clearTimeout(timer); timer = setTimeout(flush, delay); },
    flush,
  };
}
