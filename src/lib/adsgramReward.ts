// Shared AdsGram Reward block used by every reward placement.
// Rewards are unlocked server-side only after AdsGram calls the Reward URL.
import { tryAcquireGlobalAdLock, releaseGlobalAdLock, getAdLockWaitSeconds } from "./adLock";

export const REWARD_AD_FINISHED_EVENT = "sly:reward-ad-finished";
export const REWARD_AD_NOTICE_EVENT = "sly:reward-ad-notice";

export type RewardPlacement = "mining" | "exchange" | "games" | "stars" | "tasks";
export type RewardAdErrorCode = "not_ready" | "busy" | "no_fill" | "timeout";

const ADSGRAM_REWARD_BLOCK_ID = "61952";
const REWARD_AD_MAX_WAIT_MS = 180000;

type AdsgramShowResult = {
  error?: boolean;
  done?: boolean;
  state?: string;
  description?: string;
};

type AdsgramController = {
  show: () => Promise<AdsgramShowResult>;
  addEventListener?: (event: string, callback: () => void) => void;
  removeEventListener?: (event: string, callback: () => void) => void;
};

type AdsgramApi = {
  init: (opts: { blockId: string }) => AdsgramController;
};

function getAdsgram(): AdsgramApi | null {
  const api = (window as any).Adsgram as AdsgramApi | undefined;
  return api && typeof api.init === "function" ? api : null;
}

export function isRewardAdReady(): boolean {
  return getAdsgram() !== null;
}

const controllers = new Map<string, AdsgramController>();
function getController(): AdsgramController | null {
  const existing = controllers.get(ADSGRAM_REWARD_BLOCK_ID);
  if (existing) return existing;

  const api = getAdsgram();
  if (!api) return null;

  try {
    const controller = api.init({ blockId: ADSGRAM_REWARD_BLOCK_ID });
    controllers.set(ADSGRAM_REWARD_BLOCK_ID, controller);
    return controller;
  } catch (error) {
    console.error("[AdsGram] Could not initialize Reward block", error);
    return null;
  }
}

export class RewardAdError extends Error {
  code: RewardAdErrorCode;
  waitSeconds?: number;

  constructor(code: RewardAdErrorCode, waitSeconds?: number) {
    super(code);
    this.name = "RewardAdError";
    this.code = code;
    this.waitSeconds = waitSeconds;
  }
}

/**
 * Show the single AdsGram Reward block used by all reward features.
 * AdsGram resolves show() only after a rewarded view; skipped/failed ads reject.
 * The Reward URL callback is still the server-side source of truth for credit.
 */
export async function showRewardAdWithPulse(
  _placement: RewardPlacement
): Promise<{ awayMs: number }> {
  const controller = getController();
  if (!controller) throw new RewardAdError("not_ready");

  if (!tryAcquireGlobalAdLock()) {
    throw new RewardAdError("busy", getAdLockWaitSeconds());
  }

  let timeoutId: number | undefined;
  let failure: RewardAdError | null = null;
  const listeners: Array<[string, () => void]> = [];
  const on = (event: string, callback: () => void) => {
    controller.addEventListener?.(event, callback);
    listeners.push([event, callback]);
  };

  try {
    on("onBannerNotFound", () => { failure = new RewardAdError("no_fill"); });
    on("onError", () => { failure = new RewardAdError("no_fill"); });

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(
        () => reject(new RewardAdError("timeout")),
        REWARD_AD_MAX_WAIT_MS
      );
    });

    const result = await Promise.race([controller.show(), timeoutPromise]);
    if (failure) throw failure;
    if (result?.error || result?.done !== true) {
      throw new RewardAdError("no_fill");
    }

    // App.tsx uses this event to keep its separate automatic INT ad schedule.
    window.dispatchEvent(new CustomEvent(REWARD_AD_FINISHED_EVENT));
    return { awayMs: 0 };
  } catch (error) {
    if (error instanceof RewardAdError) throw error;
    throw failure || new RewardAdError("no_fill");
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    for (const [event, callback] of listeners) {
      try { controller.removeEventListener?.(event, callback); } catch {}
    }
    releaseGlobalAdLock();
  }
}

export function rewardAdErrorMessage(
  err: unknown,
  t: (key: string, vars?: Record<string, string | number>) => string
): string | null {
  if (!(err instanceof RewardAdError)) return null;
  switch (err.code) {
    case "not_ready": return t("rewardAd.notReady");
    case "busy":
      return err.waitSeconds
        ? t("rewardAd.pleaseWaitSeconds", { seconds: err.waitSeconds })
        : t("rewardAd.busy");
    case "no_fill": return t("rewardAd.noFill");
    case "timeout": return t("rewardAd.timeout");
  }
}

export function notifyRewardAdError(
  err: unknown,
  t: (key: string, vars?: Record<string, string | number>) => string
): boolean {
  if (!(err instanceof RewardAdError)) return false;
  const message = rewardAdErrorMessage(err, t);
  if (!message) return false;
  const titleKey = err.code === "busy" ? "rewardAd.titleWait" : "rewardAd.titleError";
  try {
    window.dispatchEvent(new CustomEvent(REWARD_AD_NOTICE_EVENT, {
      detail: { code: err.code, title: t(titleKey), message },
    }));
    return true;
  } catch {
    return false;
  }
}
