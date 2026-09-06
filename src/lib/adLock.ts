// Coordinates access to the single AdsGram ad "surface" so we never try
// to show two ads at once, and so ads never fire so close together that
// AdsGram flags the session as spam (its onNonStopShow event) and quietly
// stops delivering/counting fresh impressions.

let globalAdLock = false;
let lastAdEndedAt = 0;

// Minimum silence between the end of one ad (any block) and the start of
// the next one (any block). This is what actually fixes "spam" — it does
// not reduce how many ads a user can watch per session, it just stops two
// from firing in the same second.
export const MIN_GAP_BETWEEN_ADS_MS = 12000;

/**
 * Non-blocking lock. Use this for anything triggered directly by a user
 * tap (Watch Ad buttons, task ads, withdrawal ads, mining ads).
 *
 * AdsGram only reliably attributes .show() to the user's tap when it is
 * called in the very same tick as the click. The old version of this
 * lock (`await acquireGlobalAdLock()`) could sit and wait — sometimes
 * several seconds — if another ad happened to be showing, which meant
 * .show() fired well after the click. AdsGram no longer sees that as a
 * genuine user-triggered show, so the ad can play but not get counted as
 * a real Impression on their side, even though our own server still
 * thought the ad completed. Failing fast instead of waiting avoids that
 * mismatch entirely.
 */
export function tryAcquireGlobalAdLock(): boolean {
  if (globalAdLock) return false;
  if (Date.now() - lastAdEndedAt < MIN_GAP_BETWEEN_ADS_MS) return false;
  globalAdLock = true;
  return true;
}

export function releaseGlobalAdLock(): void {
  globalAdLock = false;
  lastAdEndedAt = Date.now();
}
