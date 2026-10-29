/** Reset play settings only. Artwork and saved audio belong to separate stores. */
export function resetPlayPreferences(storage: Pick<Storage, 'removeItem'>) {
  for (const key of ['ITSME_APP_STATE', 'ITSME_CHILD_PROFILE', 'ITSME_GEMINI_TTS_ENABLED']) storage.removeItem(key);
}
