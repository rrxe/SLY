// إعلانات المكافآت عبر AdsGram (interstitial عادي int-xxx).
//
// ما نشترط ضغط على الإعلان. الشرط الوحيد: المستخدم يشوف الإعلان 5 ثواني
// على الأقل (من بداية الإعلان onStart لين يتسكر). إذا سكّره قبل هيك
// نرمي RewardAdError("too_short").
//
// الملف هذا ما يمنح شي بنفسه، بس يرجع { awayMs } (مدة المشاهدة بالمللي ثانية)
// أو يرمي RewardAdError. المكافأة يمنحها السيرفر (ad_pulse_confirm).

import { tryAcquireGlobalAdLock, releaseGlobalAdLock, getAdLockWaitSeconds } from "./adLock";

// أقل مدة مشاهدة للإعلان حتى تنحسب المكافأة
export const REWARD_MIN_WATCH_MS = 5000;
// أقصى مدة ننتظر فيها الإعلان لين يتسكر
const REWARD_AD_MAX_WAIT_MS = 180000;
// إذا الإعلان ما بدأ خلال هالمدة نعتبره no_fill
const REWARD_AD_START_TIMEOUT_MS = 15000;
// أقصى مدة نبقي القفل بعد ما ينتهي الإعلان إذا show() ما رجع (احتياط)
const REWARD_AD_LOCK_MAX_HOLD_MS = 60000;

// ===== إعلانات السحب فقط: لازم ضغط + بقاء 5 ثواني (نبضة anyopen) =====
// النبضة الأولى (كشف الضغط): أول ما يبدأ الإعلان (onStart) تبدأ نافذة 15 ثانية،
// إذا المستخدم طلع من البوت (ضغط الإعلان) بأي لحظة خلالها تنجح النبضة الأولى.
// النبضة الثانية (تأكيد البقاء): ننتظره يرجع للبوت، ولازم يكون بقي 5 ثواني.
export const REWARD_CLICK_MIN_AWAY_MS = 5000;
export const REWARD_CLICK_WINDOW_MS = 15000;
const REWARD_CLICK_POLL_MS = 200;
// إذا الإعلان انسكر بدون ما نلاحظ خروج، مهلة صغيرة قبل ما نعتبره ما ضغط
const REWARD_CLOSED_GRACE_MS = 1500;
// إذا فشلت النبضة (ما ضغط) ننتظر الإعلان يتسكر قبل ما نعرض الرسالة
const REWARD_AD_CLOSE_GRACE_MS = 20000;
// هل نحسب مجرد لمس داخل iframe الإعلان كضغطة؟ (إشارة ضعيفة، خلّيها false)
const REWARD_ACCEPT_IFRAME_TAP = false;

// الأماكن اللي تتطلب ضغط على الإعلان
const CLICK_REQUIRED_PLACEMENTS: ReadonlyArray<string> = ["withdrawal"];

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
  | "away_short"
  | "timeout";

export class RewardAdError extends Error {
  code: RewardAdErrorCode;
  waitSeconds?: number;
  debug?: string;

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
const INT_TASKS_BLOCK_ID = "int-55014"; // مهام الإعلانات (task ads)

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

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

// يراقب هل المستخدم داخل التطبيق ولا طلع منه.
function createAwayTracker() {
  let total = 0;
  let awayStart: number | null = null;
  let leftEver = false;
  const backListeners = new Set<() => void>();

  // ===== إشارات "ضغط الإعلان" بدون ما نعتمد على خروج المستخدم من البوت =====
  // بعض الإعلانات يفتح الرابط بمتصفح تيليجرام الداخلي فوق البوت بدون ما
  // يتغير visibility. لكن فتح الرابط لازم يمر عبر openLink أو window.open
  // أو رسالة web_app_open_link، فنراقبها طول عمر الإعلان.
  let clickAt = 0;
  let iframeTapAt = 0;
  const signals: string[] = [];
  const mark = (source: string) => {
    signals.push(source);
    if (!clickAt) clickAt = Date.now();
    try {
      console.log("[sly-ad] click signal:", source);
      (window as any).__slyAdSignals = signals;
    } catch {
      /* ignore */
    }
  };
  const restores: Array<() => void> = [];
  const wrap = (obj: any, key: string, source: string) => {
    try {
      const orig = obj?.[key];
      if (typeof orig !== "function") return;
      const wrapper = function (this: any, ...args: any[]) {
        mark(source);
        return orig.apply(this, args);
      };
      obj[key] = wrapper;
      restores.push(() => {
        try {
          if (obj[key] === wrapper) obj[key] = orig;
        } catch {
          /* ignore */
        }
      });
    } catch {
      /* ignore */
    }
  };
  const onMessage = (e: MessageEvent) => {
    let d: any = e.data;
    if (typeof d === "string") {
      if (d.indexOf("web_app_open") === -1) return;
      try {
        d = JSON.parse(d);
      } catch {
        return;
      }
    }
    const type = d && d.eventType;
    if (type === "web_app_open_link" || type === "web_app_open_tg_link") {
      mark("message:" + type);
    }
  };

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
      if (document.hasFocus()) {
        // الفوكس لسا داخل المستند: إذا العنصر النشط iframe يعني المستخدم
        // لمس شي داخل الإعلان (إشارة ضعيفة، ما نعرف أي زر).
        if (document.activeElement && document.activeElement.tagName === "IFRAME") {
          iframeTapAt = Date.now();
          try {
            console.log("[sly-ad] iframe tap");
          } catch {
            /* ignore */
          }
          if (REWARD_ACCEPT_IFRAME_TAP) mark("iframe-tap");
        }
        // الفوكس رجع بسرعة وما هو داخل iframe: فتح/إغلاق سريع لشي فوق
        // البوت (WebView جزء من الثانية) = ضغط الإعلان.
        leave();
        back();
        return;
      }
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
  window.addEventListener("message", onMessage);
  wrap(tg, "openLink", "tg.openLink");
  wrap(tg, "openTelegramLink", "tg.openTelegramLink");
  wrap(window, "open", "window.open");
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
    /** وصلت إشارة قوية إن الإعلان فتح رابط (ضغطة CTA)؟ */
    hasClickSignal() {
      return clickAt > 0;
    },
    /** كم مضى من لحظة إشارة الضغطة (0 إذا ما في إشارة). */
    clickElapsedMs() {
      return clickAt ? Date.now() - clickAt : 0;
    },
    /** لمس داخل iframe الإعلان (إشارة ضعيفة، للتشخيص). */
    hasIframeTap() {
      return iframeTapAt > 0;
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
      window.removeEventListener("message", onMessage);
      restores.forEach((fn) => fn());
      restores.length = 0;
      try {
        tg?.offEvent?.("deactivated", leave);
        tg?.offEvent?.("activated", back);
      } catch {
        /* ignore */
      }
    },
  };
}

/**
 * يعرض إعلان مكافأة (AdsGram interstitial). لازم يُستدعى مباشرة من ضغطة
 * المستخدم (بدون await قبله). يرجع { awayMs } = مدة مشاهدة الإعلان، أو
 * يرمي RewardAdError (no_fill / too_short / timeout / busy / not_ready).
 *
 * إعلان السحب (placement="withdrawal") يشتغل بنظام النبضة: لازم يضغط على
 * الإعلان ويبقى 5 ثواني (no_click / away_short). باقي الأماكن: مشاهدة 5 ثواني.
 */
export async function showRewardAdWithPulse(
  placement: RewardPlacement
): Promise<{ awayMs: number }> {
  const controller = getController(REWARD_BLOCK_BY_PLACEMENT[placement]);
  if (!controller) throw new RewardAdError("not_ready");

  if (!tryAcquireGlobalAdLock()) {
    throw new RewardAdError("busy", getAdLockWaitSeconds());
  }

  const requireClick = CLICK_REQUIRED_PLACEMENTS.includes(placement);
  const tracker = requireClick ? createAwayTracker() : null;
  let clickClosed = false;
  let shown = false;
  let startedAtTs = 0;
  let closedAtTs = 0;
  let failure: RewardAdError | null = null;
  let watchedMs = 0;
  let showPromiseRef: Promise<void> | null = null;
  let lockReleased = false;

  // نحرر القفل (ونخبر App.tsx لجدولة الإعلان التلقائي) لما الإعلان يتسكر
  // فعلاً، حتى ما يطلع الإعلان التلقائي فوق إعلان المكافأة.
  const finalizeAd = () => {
    if (lockReleased) return;
    lockReleased = true;
    releaseGlobalAdLock();
    if (shown) {
      try {
        window.dispatchEvent(new CustomEvent(REWARD_AD_FINISHED_EVENT));
      } catch {
        /* ignore */
      }
    }
  };

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
      startedAtTs = Date.now();
      resolveStarted(true);
    });
    on("onComplete", () => {
      clickClosed = true;
    });
    on("onSkip", () => {
      clickClosed = true;
    });
    on("onBannerNotFound", () => resolveStarted(false));
    on("onError", () => resolveStarted(false));
    on("onNonStopShow", () => resolveStarted(false));

    // show() يرجع لما الإعلان يتسكر (أو يفشل)
    const showPromise: Promise<void> = controller
      .show()
      .then(
        () => {},
        () => {}
      )
      .then(() => {
        closedAtTs = closedAtTs || Date.now();
        clickClosed = true;
        resolveStarted(false); // إذا ما بدأ أصلاً = no fill (ما يأثر إذا بدأ)
      });
    showPromiseRef = showPromise;

    const started = await Promise.race([startedPromise, sleep(REWARD_AD_START_TIMEOUT_MS).then(() => false)]);

    if (!started) {
      failure = new RewardAdError("no_fill");
    } else if (requireClick) {
      // ===== النبضة الأولى: نافذة 15 ثانية من بداية الإعلان =====
      const windowEnd = Date.now() + REWARD_CLICK_WINDOW_MS;
      let closedAt = 0;
      let clicked = false;

      while (Date.now() < windowEnd) {
        if (tracker!.isAway() || tracker!.hasLeft() || tracker!.hasClickSignal()) {
          clicked = true;
          break;
        }
        if (clickClosed) {
          if (!closedAt) closedAt = Date.now();
          if (Date.now() - closedAt >= REWARD_CLOSED_GRACE_MS) break;
        }
        await sleep(REWARD_CLICK_POLL_MS);
      }
      if (!clicked) {
        clicked = tracker!.isAway() || tracker!.hasLeft() || tracker!.hasClickSignal();
      }

      if (clicked) {
        // ===== النبضة الثانية: ضغط الإعلان، لازم يبقى 5 ثواني ثم يرجع =====
        if (tracker!.hasClickSignal()) {
          const remaining = REWARD_CLICK_MIN_AWAY_MS - tracker!.clickElapsedMs();
          if (remaining > 0) await sleep(remaining);
        }
        const returned = await tracker!.waitUntilBack(REWARD_AD_MAX_WAIT_MS);
        watchedMs = Math.max(tracker!.getAwayMs(), tracker!.clickElapsedMs());
        if (!returned) failure = new RewardAdError("timeout");
        else if (watchedMs < REWARD_CLICK_MIN_AWAY_MS) failure = new RewardAdError("away_short");
      } else {
        // ما ضغط: ننتظر الإعلان يتسكر حتى ما تطلع الرسالة فوقه
        if (!clickClosed) {
          await Promise.race([showPromise, sleep(REWARD_AD_CLOSE_GRACE_MS)]);
        }
        failure = new RewardAdError("no_click");
      }
    } else {
      await Promise.race([showPromise, sleep(REWARD_AD_MAX_WAIT_MS)]);
      if (!closedAtTs) {
        failure = new RewardAdError("timeout");
      } else {
        watchedMs = closedAtTs - (startedAtTs || closedAtTs);
        if (watchedMs < REWARD_MIN_WATCH_MS) failure = new RewardAdError("too_short");
      }
    }
  } finally {
    tracker?.stop();
    if (showPromiseRef) {
      showPromiseRef.then(finalizeAd, finalizeAd);
      window.setTimeout(finalizeAd, failure?.code === "no_fill" ? 5000 : REWARD_AD_LOCK_MAX_HOLD_MS);
    } else {
      finalizeAd();
    }
    for (const [event, cb] of listeners) {
      try {
        controller.removeEventListener?.(event, cb);
      } catch {
        /* ignore */
      }
    }
  }

  if (failure) throw failure;
  return { awayMs: watchedMs };
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
    case "away_short":
      return t("rewardAd.awayShort");
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
    err.code === "no_click" || err.code === "too_short" || err.code === "away_short"
      ? "rewardAd.titleNeedClick"
      : err.code === "busy"
        ? "rewardAd.titleWait"
        : "rewardAd.titleError";

  try {
    window.dispatchEvent(
      new CustomEvent(REWARD_AD_NOTICE_EVENT, {
        detail: { code: err.code, title: t(titleKey), message, debug: err.debug },
      })
    );
  } catch {
    return false;
  }
  return true;
}
