// Global ad lock (AdsGram).
//
// يمنع تشغيل إعلانين بنفس الوقت، ويضمن وجود فاصل
// 15 ثانية بين نهاية إعلان reward وبداية إعلان reward التالي.

let globalAdLock = false;
let lastAdEndedAt = 0;
let lockAcquiredAt = 0;

export const MIN_GAP_BETWEEN_ADS_MS = 15000;

// تقدير فقط لعرض رسالة الانتظار أثناء كون إعلان آخر يعمل.
const ASSUMED_MAX_AD_DURATION_MS = 30000;

/**
 * محاولة حجز مساحة الإعلان بدون انتظار.
 *
 * مهم:
 * هذه الدالة لا تنتظر.
 * إذا كان هناك إعلان يعمل ترجع false مباشرة (هذا الشرط ينطبق
 * على كل الإعلانات، تلقائية أو يدوية، حتى ما يطلع إعلانين
 * بنفس اللحظة).
 *
 * أما فاصل الـ15 ثانية فينطبق فقط على الإعلانات اليدوية
 * (isAuto = false). الإعلانات التلقائية (isAuto = true) ما
 * تتقيد فيه وتقدر تشتغل حتى لو لسا داخل نافذة الـ15 ثانية.
 */
export function tryAcquireGlobalAdLock(isAuto: boolean = false): boolean {
  const now = Date.now();

  // إعلان آخر يعمل حالياً (ينطبق على الكل بلا استثناء)
  if (globalAdLock) {
    return false;
  }

  // فاصل 15 ثانية بعد آخر إعلان - الإعلانات التلقائية معفية منه
  if (!isAuto) {
    const elapsedSinceLastAd =
      now - lastAdEndedAt;

    if (
      lastAdEndedAt > 0 &&
      elapsedSinceLastAd < MIN_GAP_BETWEEN_ADS_MS
    ) {
      return false;
    }
  }

  globalAdLock = true;
  lockAcquiredAt = now;

  return true;
}

/**
 * تحرير قفل الإعلان عند انتهاء show().
 *
 * من هذه اللحظة يبدأ حساب الـ15 ثانية - بس فقط إذا كان الإعلان
 * يدوي (isAuto = false). الإعلان التلقائي لما يخلص ما "يضيف"
 * فاصل الـ15 ثانية على الإعلانات الثانية.
 */
export function releaseGlobalAdLock(isAuto: boolean = false): void {
  globalAdLock = false;
  if (!isAuto) {
    lastAdEndedAt = Date.now();
  }
  lockAcquiredAt = 0;
}

/**
 * عدد الثواني التقريبي المتبقية قبل السماح
 * بإعلان جديد.
 */
export function getAdLockWaitSeconds(): number {
  const now = Date.now();

  // إذا كان إعلان آخر يعمل
  if (globalAdLock) {
    const elapsed =
      now - lockAcquiredAt;

    const remaining =
      ASSUMED_MAX_AD_DURATION_MS - elapsed;

    if (remaining > 0) {
      return Math.max(
        1,
        Math.ceil(remaining / 1000)
      );
    }
  }

  // فاصل الـ15 ثانية بعد آخر إعلان
  if (lastAdEndedAt > 0) {
    const elapsed =
      now - lastAdEndedAt;

    const remaining =
      MIN_GAP_BETWEEN_ADS_MS - elapsed;

    if (remaining > 0) {
      return Math.max(
        1,
        Math.ceil(remaining / 1000)
      );
    }
  }

  return 0;
}
