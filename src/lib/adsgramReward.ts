// إعلانات المكافآت عبر AdsGram (interstitial) بنظام "النبضة".
//
// بلوكات int-xxx ما عندها reward ولا webhook، فنحسب المكافأة إذا
// المستخدم ضغط على الإعلان وتفاعل معه (طلع من التطبيق) ثانيتين على الأقل:
//   1) أول ما يبدأ الإعلان (حدث onStart) نبدأ مؤقت 7 ثواني.
//   2) عند الثانية 7 تجي "نبضة" وحدة تسأل: المستخدم لسا داخل التطبيق
//      ولا طلع منه؟
//        - طلع (أو كان طلع قبل النبضة) = ضغط الإعلان.
//        - لسا داخل = ما ضغط = no_click.
//   3) إذا ضغط، ننتظر يرجع؛ لازم مجموع غيابه ثانيتين على الأقل وإلا
//      too_short. بعدها السيرفر (ad_pulse_confirm) يمنح المكافأة ويفرض
//      فاصل 15 ثانية بين الإعلانات اليدوية.
//
// الملف هذا ما يمنح شي بنفسه، بس يرجع نتيجة النبضة أو يرمي RewardAdError.

import { tryAcquireGlobalAdLock, releaseGlobalAdLock, getAdLockWaitSeconds } from "./adLock";

// أقل مدة لازم يبقى فيها المستخدم خارج التطبيق (داخل الإعلان) بعد الضغط
export const REWARD_MIN_AWAY_MS = 2000;
// وقت النبضة بعد بداية الإعلان
export const REWARD_PULSE_DELAY_MS = 7000;
// أقصى انتظار لرجوع المستخدم بعد ما يضغط الإعلان
const REWARD_AD_MAX_WAIT_MS = 180000;
// إذا فشلت النبضة (ما ضغط) ننتظر الإعلان يتسكر قبل ما نعرض الرسالة
const REWARD_AD_CLOSE_GRACE_MS = 20000;

// حدث يرسله هذا الملف بعد ما ينعرض إعلان reward، يستخدمه App.tsx
// لجدولة الإعلان التلقائي بعد 10 ثواني من إعلان المكافأة.
export const REWARD_AD_FINISHED_EVENT = "sly:reward-ad-finished";

// حدث إظهار الرسالة (RewardAdNotice يستمع له)
export const REWARD_AD_NOTICE_EVENT = "sly:reward-ad-notice";

export type RewardAdErrorCode =
  | "not_ready"
  | "busy"
  | "no_fill"
  | "no_click"
  | "too_short"
  | "timeout";

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

// أماكن إعلانات المكافآت وبلوك AdsGram (int) الخاص بكل مكان
export type RewardPlacement =
  | "mining"
  | "exchange"
  | "games"
  | "stars"
  | "withdrawal"
  | "tasks";

const INT_REWARD_BLOCK_ID = "int-55014"; // mining + exchange + games (+ stars/withdrawal)
const INT_TASKS_BLOCK_ID = "int-54986"; // مهام الإعلانات (task ads)

const REWARD_BLOCK_BY_PLACEMENT: Record<RewardPlacement, string> = {
  mining: INT_REWARD_BLOCK_ID,
  exchange: INT_REWARD_BLOCK_ID,
  games: INT_REWARD_BLOCK_ID,
  stars: INT_REWARD_BLOCK_ID,
  withdrawal: INT_REWARD_BLOCK_ID,
  tasks: INT_TASKS_BLOCK_ID,
};

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
  const a = (window as any).Adsgram as AdsgramApi | undefined;
  return a && typeof a.init === "function" ? a : null;
}

export function isRewardAdReady(): boolean {
  return getAdsgram() !== null;
}

// نفس blockId يرجّع نفس الـController (حسب توثيق AdsGram)
const controllers = new Map<string, AdsgramController>();
function getController(blockId: string): AdsgramController | null {
  const existing = controllers.get(blockId);
  if (existing) return existing;
  const api = getAdsgram();
  if (!api) return null;
  const controller = api.init({ blockId });
  controllers.set(blockId, controller);
  return controller;
}

// يراقب هل المستخدم داخل التطبيق ولا طلع منه.
function createAwayTracker() {
  let total = 0;
  let awayStart: number | null = null;
  let leftEver = false;
  const backListeners = new Set<() => void>();

  const leave = () => {
    leftEver = true;
    if (awayStart === null) awayStart = Date.now();
  };
  const back = () => {
    if (awayStart !== null) {
      total += Date.now() - awayStart;
      awayStart = null;
    }
    backListeners.forEach((fn) => fn());
  };

  const onVisibility = () => {
    if (document.visibilityState === "hidden") leave();
    else back();
  };

  // نافذة تيليجرام ممكن تعطي blur بدون visibilitychange (مثلاً
  // المتصفح الداخلي يفتح فوق التطبيق). الضغط داخل iframe الإعلان
  // نفسه يعطي blur أيضاً، لكن وقتها document.hasFocus() يبقى true
  // (الفوكس داخل نفس المستند) فنتجاهله، وإذا الفوكس طلع فعلاً نعتبره غياب.
  const onBlur = () => {
    window.setTimeout(() => {
      if (document.hasFocus()) return;
      leave();
    }, 350);
  };
  const onFocus = () => {
    if (document.visibilityState === "hidden") return;
    back();
  };

  const tg = (window as any).Telegram?.WebApp;

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", leave);
  window.addEventListener("pageshow", back);
  window.addEventListener("blur", onBlur);
  window.addEventListener("focus", onFocus);
  try {
    tg?.onEvent?.("deactivated", leave);
    tg?.onEvent?.("activated", back);
  } catch {
    /* بعض إصدارات Telegram ما تدعم هذه الأحداث */
  }

  return {
    /** المستخدم خارج التطبيق الآن؟ */
    isAway() {
      return awayStart !== null || document.visibilityState === "hidden";
    },
    /** المستخدم طلع من التطبيق ولو مرة منذ بدء التتبع؟ */
    hasLeft() {
      return leftEver;
    },
    getAwayMs() {
      return total + (awayStart !== null ? Date.now() - awayStart : 0);
    },
    /** ينتظر لين يرجع المستخدم للتطبيق (أو ينتهي الوقت). */
    waitUntilBack(maxMs: number): Promise<boolean> {
      return new Promise((resolve) => {
        if (!this.isAway()) {
          resolve(true);
          return;
        }
        let done = false;
        const finish = (ok: boolean) => {
          if (done) return;
          done = true;
          backListeners.delete(check);
          window.clearTimeout(timer);
          window.clearInterval(poll);
          resolve(ok);
        };
        const check = () => {
          if (document.visibilityState !== "hidden" && awayStart === null) finish(true);
        };
        backListeners.add(check);
        // احتياط: بعض الأجهزة ما ترسل حدث الرجوع
        const poll = window.setInterval(() => {
          if (document.visibilityState !== "hidden" && document.hasFocus() && awayStart !== null) {
            back();
          }
        }, 500);
        const timer = window.setTimeout(() => finish(false), maxMs);
      });
    },
    stop() {
      backListeners.clear();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", leave);
      window.removeEventListener("pageshow", back);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      try {
        tg?.offEvent?.("deactivated", leave);
        tg?.offEvent?.("activated", back);
      } catch {
        /* ignore */
      }
    },
  };
}

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/**
 * يعرض إعلان مكافأة (AdsGram interstitial) بنظام النبضة. لازم يُستدعى
 * مباشرة من ضغطة المستخدم (بدون await قبله).
 *
 * - أول ما يبدأ الإعلان (onStart) يبدأ مؤقت 7 ثواني.
 * - عند الثانية 7: إذا المستخدم طلع من التطبيق (ضغط الإعلان) ننتظر
 *   يرجع ونتأكد إنه بقي ثانيتين على الأقل، ونرجع { awayMs }.
 *   وإذا لسا داخل نرمي RewardAdError("no_click").
 */
export async function showRewardAdWithPulse(
  placement: RewardPlacement
): Promise<{ awayMs: number }> {
  const controller = getController(REWARD_BLOCK_BY_PLACEMENT[placement]);
  if (!controller) throw new RewardAdError("not_ready");

  if (!tryAcquireGlobalAdLock()) {
    throw new RewardAdError("busy", getAdLockWaitSeconds());
  }

  const tracker = createAwayTracker();
  let shown = false;
  let closed = false;
  let awayMs = 0;
  let failure: RewardAdError | null = null;

  // أحداث AdsGram لهذه المرة بس (نشيلها بالنهاية)
  const listeners: Array<[string, () => void]> = [];
  const on = (event: string, cb: () => void) => {
    controller.addEventListener?.(event, cb);
    listeners.push([event, cb]);
  };

  try {
    let resolveStarted: (ok: boolean) => void = () => {};
    const startedPromise = new Promise<boolean>((resolve) => {
      resolveStarted = resolve;
    });

    on("onStart", () => {
      shown = true;
      resolveStarted(true);
    });
    on("onBannerNotFound", () => resolveStarted(false));
    on("onError", () => resolveStarted(false));
    on("onNonStopShow", () => resolveStarted(false));
    on("onComplete", () => {
      closed = true;
    });
    on("onSkip", () => {
      closed = true;
    });

    // show() يرجع لما الإعلان يتسكر (أو يفشل). إذا المستخدم ضغط الإعلان
    // وراح لرابط، يبقى معلّق لين يرجع ويسكّره، وهذا طبيعي.
    const showPromise = controller
      .show()
      .then(() => {
        closed = true;
      })
      .catch(() => {
        closed = true;
        resolveStarted(false); // فشل قبل ما يبدأ
      })
      .then(() => {
        resolveStarted(false); // انتهى بدون ما يبدأ (no fill)
      });

    // ننتظر بداية الإعلان؛ إذا ما بدأ خلال 15 ثانية أو فشل = ما في إعلان
    const started = await Promise.race([
      startedPromise,
      sleep(15000).then(() => false),
    ]);

    if (!started) {
      failure = new RewardAdError("no_fill");
    } else {
      // ===== النبضة الوحيدة، 7 ثواني بعد بداية الإعلان =====
      await sleep(REWARD_PULSE_DELAY_MS);

      const clicked = tracker.isAway() || tracker.hasLeft();

      if (clicked) {
        // ضغط الإعلان: ننتظر يرجع للتطبيق
        const returned = await tracker.waitUntilBack(REWARD_AD_MAX_WAIT_MS);
        awayMs = tracker.getAwayMs();
        if (!returned) failure = new RewardAdError("timeout");
        else if (awayMs < REWARD_MIN_AWAY_MS) failure = new RewardAdError("too_short");
      } else {
        // ما ضغط: ننتظر الإعلان يتسكر حتى ما تطلع الرسالة فوقه
        if (!closed) {
          await Promise.race([showPromise, sleep(REWARD_AD_CLOSE_GRACE_MS)]);
        }
        failure = new RewardAdError("no_click");
      }
    }
  } finally {
    tracker.stop();
    releaseGlobalAdLock();
    for (const [event, cb] of listeners) {
      try {
        controller.removeEventListener?.(event, cb);
      } catch {
        /* ignore */
      }
    }
  }

  // الإعلان انعرض فعلاً: نخبر App.tsx (إعلان تلقائي بعد 10 ثواني)
  if (shown) {
    try {
      window.dispatchEvent(new CustomEvent(REWARD_AD_FINISHED_EVENT));
    } catch {
      /* ignore */
    }
  }

  if (failure) throw failure;
  return { awayMs };
}

/** يحوّل أي خطأ إعلان لرسالة مترجمة. */
export function rewardAdErrorMessage(
  err: unknown,
  t: (key: string, vars?: Record<string, string | number>) => string
): string | null {
  if (!(err instanceof RewardAdError)) return null;
  switch (err.code) {
    case "not_ready":
      return t("rewardAd.notReady");
    case "busy":
      return err.waitSeconds
        ? t("rewardAd.pleaseWaitSeconds", { seconds: err.waitSeconds })
        : t("rewardAd.busy");
    case "no_fill":
      return t("rewardAd.noFill");
    case "no_click":
      return t("rewardAd.needClick");
    case "too_short":
      return t("rewardAd.tooShort");
    case "timeout":
      return t("rewardAd.timeout");
  }
}

/**
 * إذا الخطأ RewardAdError يعرض رسالة ثابتة (ما تروح لين المستخدم
 * يضغط عليها) ويرجع true. غير هيك يرجع false والمستدعي يتعامل معه.
 */
export function notifyRewardAdError(
  err: unknown,
  t: (key: string, vars?: Record<string, string | number>) => string
): boolean {
  if (!(err instanceof RewardAdError)) return false;
  const message = rewardAdErrorMessage(err, t);
  if (!message) return false;

  const titleKey =
    err.code === "no_click" || err.code === "too_short"
      ? "rewardAd.titleNeedClick"
      : err.code === "busy"
        ? "rewardAd.titleWait"
        : "rewardAd.titleError";

  try {
    window.dispatchEvent(
      new CustomEvent(REWARD_AD_NOTICE_EVENT, {
        detail: { code: err.code, title: t(titleKey), message },
      })
    );
  } catch {
    return false;
  }
  return true;
}
