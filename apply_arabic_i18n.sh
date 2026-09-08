#!/data/data/com.termux/files/usr/bin/bash
# شغّل هذا داخل مجلد المشروع (SLY-main) عبر Termux
set -e

mkdir -p "$(dirname "src/i18n/en.ts")"
cat > "src/i18n/en.ts" << 'SLYEOF'
// English dictionary. Keep keys identical in shape to ar.ts.
const en = {
  common: {
    cancel: "Cancel",
    close: "Close",
    confirm: "Confirm",
    copy: "Copy",
    copied: "Copied",
    loading: "Loading...",
    max: "MAX",
    coins: "Coins",
    coin: "Coin",
    days: "days",
  },

  language: {
    label: "Language",
    english: "English",
    arabic: "العربية",
  },

  topbar: {
    kicker: "SLY MINING",
    home: { label: "SLY", sub: "Mine & earn" },
    tasks: { label: "Tasks", sub: "Daily missions" },
    games: { label: "Games", sub: "Play & earn" },
    referrals: { label: "Referrals", sub: "Invite & earn" },
    stars: { label: "Stars", sub: "Weekly leaderboard" },
    profile: { label: "Profile", sub: "Exchange & withdraw" },
    coins: "Coins",
    usdt: "USDT",
  },

  bottomnav: {
    home: "Home",
    tasks: "Tasks",
    stars: "Stars",
    games: "Games",
    referrals: "Referrals",
    profile: "Profile",
  },

  home: {
    heroBadge: "SLY MINING",
    heroTitle: "Mine Coins",
    heroDesc:
      "Start a 2-hour mining cycle, then watch one more ad to claim your reward.",
    rewardEvery2h: "Coins every 2 hours",
    statusReadyLabel: "READY TO START",
    statusReadyTitle: "Watch an ad to activate mining",
    statusReadyNote: "One rewarded ad starts your 2-hour cycle.",
    statusClaimLabel: "CLAIM READY",
    statusClaimTitle: "{{amount}} Coins waiting",
    statusClaimNote: "Watch one rewarded ad to claim.",
    statusActiveLabel: "MINING IN PROGRESS",
    statusStartedAt: "Started at {{time}}",
    buttonWatching: "Watching...",
    buttonStart: "Watch Ad & Start Mining",
    buttonClaim: "Watch Ad & Claim {{amount}}",
    buttonInProgress: "Mining in Progress",
    preparingAds: "Preparing rewarded mining ads...",

    giftEyebrow: "Redeem",
    giftTitle: "Gift Code",
    giftHint: "Have a promo or gift code? Enter it below for bonus coins.",
    giftPlaceholder: "Enter your gift code",
    giftButton: "Enter Gift Code",
    giftButtonBusy: "Redeeming...",

    checkinEyebrow: "Daily Check-in",
    checkinPoints: "+{{points}} points today",
    checkinStatus: "Checked in",
    milestoneCommon: "Common",
    milestoneEpic: "Epic",
    milestoneLegendary: "Legendary",
    milestoneMythic: "Mythic",
    nextRewardIn: "Next reward in {{days}} days",
    allRewardsUnlocked: "All rewards unlocked",
    chestUnlocked: "{{chest}} unlocked",
    keepStreakGoing: "Keep your streak going",

    leaderboardEyebrow: "Top 10",
    leaderboardTitle: "Leaderboard",
    noLeaderboardData: "No leaderboard data from server",
    coinsSuffix: "coins",
    tierCommon: "Common",
    tierRare: "Rare",
    tierEpic: "Epic",
    tierLegendary: "Legendary",
    tierMythic: "Mythic",
  },

  tasks: {
    heroTitle: "Earn Coins",
    heroSubtitle: "Complete tasks to earn coins",
    tabAll: "All",
    tabAds: "Ads",
    tabJoinChannel: "Join Channel",
    tabBots: "Bots",
    loadingTasks: "Loading tasks...",
    noTasks: "No tasks available right now.",
    typeSmartAd: "smart ad",
    typeAdsGram: "adsgram",
    typeGigaPub: "giga pub",
    typeTask: "task",
    completed: "Completed",
    watchAdToEarn: "Watch the ad to earn coins",
    openLinkFirst: "Open link first",
    sendingCoinsIn: "Sending coins in {{seconds}} seconds",
    verifying: "Verifying...",
    readyProgress: "Ready {{completed}}/{{max}}",
    botJoinNote: "🤖 Bot-join tasks don't count toward referral progress.",
    openingAction: "Opening...",
    loadingAdAction: "Loading ad...",
    watchAdAction: "Watch Ad",
    openAction: "Open",
    taskLimitReached: "Task limit reached.",
    invalidTaskType: "Invalid task type.",
    adsgramNotReady: "AdsGram ad not ready yet. Try again.",
    pleaseWaitSeconds: "Please wait {{seconds}}s to watch another ad.",
    adFailedToLoad: "Ad failed to load.",
    adWatchedClaiming: "Ad watched. Claiming coins...",
    gigaPubNotReady: "GigaPub ad not ready yet. Try again.",
    taskNoUrl: "Task has no URL.",
    openedSendingIn: "Opened. Sending coins in {{seconds}} seconds.",
    failedToOpenTask: "Failed to open task.",
    failedToProcessTask: "Failed to process task",
    failedToVerifyTask: "Failed to verify task",
    coinsRewardToast: "+{{amount}} coins",
    taskProgressMeta: "Task {{completed}}/{{max}} +{{reward}} coins",
  },

  referrals: {
    title: "Referrals",
    description:
      "Your referral is accepted after the invited user completes {{tasks}} tasks. Every successful task completion counts, including repeatable tasks. You receive {{reward}} USDT when the referral is confirmed.",
    qualifiedReferrals: "Qualified Referrals",
    requirementTitle: "Referral requirement",
    requirementBody:
      "The invited user must complete {{tasks}} tasks before the referral is counted.",
    requirementExample:
      "Example: 3 normal tasks + 2 ad completions = {{tasks}} tasks. Repeating an allowed task also counts each successful completion.",
    linkLabel: "Your Referral Link",
    linkUnavailable: "Referral link unavailable",
    copy: "Copy",
    copied: "Copied!",
  },

  stars: {
    title: "Stars Leaderboard",
    intro:
      "The longer you keep the bot open this week, the higher you climb. Top 3 win real Telegram Stars every week — from {{low}} up to {{high}}",
    introSub:
      "Ranks #4 and #5 also win a prize — from {{low}} up to {{high}}",
    yourRank: "Your rank: #{{rank}}",
    watchAdsCardTitle: "Watch Ads for Time",
    cycleRunning: "Cycle running — your time is climbing automatically.",
    unlocksIn: "Unlocks in {{time}}",
    watchAdsToUnlock:
      "Watch {{count}} ads to unlock {{time}} of climbing time.",
    adsWatched: "{{count}}/{{required}} watched",
    balanceReady: "Balance ready: {{count}} ads = {{time}}",
    watchAd: "Watch Ad",
    loadingEllipsis: "Loading…",
    useBalance: "Use Balance",
    useBalanceCount: "Use Balance ({{count}})",
    takingAWhile: "Taking a while? This will auto-reset in a few seconds.",
    loadingLeaderboard: "Loading leaderboard…",
    failedToLoad: "Failed to load leaderboard",
    noActivityThisWeek: "No activity recorded yet this week.",
    footerNote: "Rankings reset weekly by the team once prizes are sent out.",
  },

  games: {
    eyebrow: "GAMES",
    title: "Play & Earn More",
    subtitle: "Limited daily attempts — earn extra attempts by watching an ad",
    attemptsLeft: "attempts left today",
    freeCount: "{{count}} free",
    bonusCount: "{{count}} from ads",
    loadingAd: "Loading ad...",
    watchAdBonus: "Watch Ad (+1 attempt)",
    laserEscapeTitle: "Laser Escape",
    laserEscapeDesc: "Dodge meteors and fire your laser through 5 waves of space",
    coinsPerWave: "+100 coins / wave",
    lives: "5 lives",
    noAttemptsLeft: "No attempts left",
    playNow: "Play Now",
    comingSoon: "Coming Soon",
    comingSoonDesc: "New space games joining this section soon",
  },

  gameCanvas: {
    backToLobby: "Back to lobby",
    wave: "Wave",
    coins: "Coins",
    energy: "Energy",
    victory: "Victory",
    runEnded: "Run Ended",
    waveLabel: "WAVE {{n}}",
    braceForImpact: "Brace for impact",
    finalStorm: "Final storm",
    meteorPressureRising: "Meteor pressure rising",
    incomingRocks: "Incoming rocks",
    waveStatus: "Wave {{n}} / {{total}}",
    missionComplete: "MISSION COMPLETE",
    missionCompleteStatus: "Mission complete",
    runFailed: "RUN FAILED",
    runFailedStatus: "Run failed",
    meteorEscaped: "A meteor escaped.",
    shipHit: "Your ship was hit.",
    waveClearedTitle: "WAVE {{n}} CLEARED",
    waveClearedCoins: "+{{amount}} coins",
    waveClearedStatus: "Wave {{n}} cleared +{{amount}} coins",
    missionCompleteSubtitle: "You cleared all {{total}} waves and earned {{coins}} coins.",
    runFailedText: "{{reason}} You earned {{coins}} coins this run.",
    minusOneLife: "-1 LIFE",
    livesLeft: "{{count}} {{unit}} left",
    life: "life",
    lives: "lives",
  },

  profile: {
    walletCenter: "Wallet Center",
    walletConnected: "Wallet connected",
    connectWallet: "Connect your GRAM (TON) wallet",
    walletLead:
      "Link a TON address to withdraw as GRAM. Prefer Binance? You can also withdraw USDT directly to your Binance ID — no wallet needed for that option.",
    connectedAddress: "Connected address",
    copy: "Copy",
    copied: "Copied",
    disconnect: "Disconnect",
    disconnectConfirm: "Disconnect this wallet?",
    cancel: "Cancel",
    walletPlaceholder: "TON wallet address",
    connect: "Connect",
    errorEmptyAddress: "Enter your TON wallet address.",
    errorInvalidAddress: "That doesn't look like a valid TON address.",
    earned: "Earned",
    exchanged: "Exchanged",
    usdt: "USDT",
    exchangeCoins: "Exchange Coins",
    withdrawUsdt: "Withdraw USDT",
    yourRequests: "Your requests",
    withdrawalHistory: "Withdrawal History",
    noWithdrawalsYet: "No withdrawal requests yet",
    binanceId: "Binance ID",
    gramWallet: "GRAM Wallet (TON)",
    statusPending: "Pending",
    statusApproved: "Approved",
    statusRejected: "Rejected",
    languageSection: "Language",
    languageHint: "Choose the language for the whole app.",
  },

  exchangeModal: {
    eyebrow: "Exchange",
    title: "Coins → USDT",
    rateLabel: "Rate",
    rateValue: "1000 Coins = 0.0025 USDT",
    amountLabel: "Amount",
    amountPlaceholder: "Enter coins",
    max: "MAX",
    youReceive: "You receive",
    available: "Available",
    coinsSuffix: "Coins",
    noteDefault:
      "You will watch an ad before the exchange is confirmed. After that, the coins are deducted and USDT is added instantly.",
    notEnoughCoins: "Not enough coins for exchange.",
    minimumExchange: "Minimum exchange is {{amount}} coins.",
    watchingAd: "Watching ad...",
    pleaseWaitSeconds: "Please wait {{seconds}}s to watch another ad.",
    adsUnavailable: "Ads are currently unavailable. Please try again.",
    adFailed: "The ad could not be completed. Please try again.",
    cancel: "Cancel",
    confirmWatching: "Watching Ad...",
    confirmWatch: "Watch Ad & Exchange",
  },

  withdrawModal: {
    eyebrow: "Withdraw",
    title: "Withdraw USDT",
    watchAdsToUnlock: "Watch ads to unlock withdrawal",
    unlocked: "Unlocked ✓",
    confirmingReward: "Confirming reward...",
    watchAd: "Watch Ad",
    binanceMethod: "Binance ID (USDT)",
    gramMethod: "GRAM Wallet (TON)",
    binanceIdLabel: "Binance ID",
    binanceIdPlaceholder: "Your Binance User ID",
    gramAddressLabel: "GRAM Address (TON)",
    gramAddressPlaceholder: "Your GRAM (TON) wallet address",
    amountLabel: "Amount (USDT)",
    amountPlaceholder: "Min {{min}} / Max {{max}} USDT",
    max: "MAX",
    availableBalance: "Available Balance",
    noteBinance: "Funds will be sent as USDT directly to your Binance account ID.",
    noteGram:
      "Funds will be sent as GRAM (TON) to your wallet address. The amount is entered in USDT; the equivalent GRAM is sent manually by the admin.",
    minMax: "Minimum withdrawal: {{min}} USDT • Maximum per withdrawal: {{max}} USDT",
    cancel: "Cancel",
    confirmWithdraw: "Confirm Withdraw",
    errorMaxPerWithdrawal: "Maximum withdrawal is {{max}} USDT per withdrawal.",
    errorWatchMoreAds: "Watch {{count}} more ad(s) to unlock withdrawal.",
    errorEnterValidAmount: "Please enter a valid amount.",
    errorMinWithdrawal: "Minimum withdrawal is {{min}} USDT.",
    errorInsufficientBalance: "Insufficient USDT balance.",
    errorEnterBinanceId: "Enter your Binance ID.",
    errorEnterGramAddress: "Enter your GRAM (TON) wallet address.",
    adsUnavailable: "Ads are currently unavailable. Please try again.",
    adFailed: "The ad could not be completed. Please try again.",
    pleaseWaitSeconds: "Please wait {{seconds}}s to watch another ad.",
  },

  giftCodeModal: {
    eyebrow: "Gift Code",
    title: "Redeem Code",
    codeLabel: "Code",
    codePlaceholder: "Enter your gift code",
    noteDefault: "Enter a gift code to claim your bonus coins.",
    cancel: "Cancel",
    redeeming: "Redeeming...",
    redeem: "Redeem",
  },

  mandatorySubscription: {
    title: "Join to Continue",
    body: "You must join the channels below to use the bot and unlock your reward.",
    joined: "Joined",
    join: "Join",
    checking: "Checking...",
    verified: "Membership Verified",
    verify: "Verify Membership",
    checkingMembership: "Checking membership...",
  },

  app: {
    duplicateNotice:
      "Heads up: this device/network already has an account. New accounts from here won't earn referral rewards — your own account and gameplay aren't affected.",
    dismiss: "Dismiss",
    bootErrorAuth:
      "Open the game inside the Telegram app so your account can be recognized.",
    bootErrorGeneric: "Couldn't reach the server. Try closing and reopening the app.",
    adStillLoading: "Ads are still loading, try again in a moment.",
    adFailedToLoadOrComplete: "Ad failed to load or complete.",
    somethingWentWrong: "Something went wrong. Please try again.",
    adNotReady: "Ad is not ready yet. Try again in a moment.",
    adTimeoutRetry: "Ad did not report completion in time. Please try again.",
    pleaseWaitSeconds: "Please wait {{seconds}}s to watch another ad.",
    stillConfirmingAd:
      "Still confirming your ad with AdsGram — this can take a minute on mobile networks. Try again shortly; no need to rewatch.",
    adVerifiedBy: "Ad verified by AdsGram — {{count}}/{{required}}",
    watchOneAdFirst: "Watch at least one ad before using the balance.",
    balanceActivated: "Balance activated — your time is climbing automatically now.",
    couldNotUseBalance: "Couldn't use the balance, try again.",
    gotBonusAttempt: "Nice! You got +1 attempt 🎮",
    couldNotStartRun: "Couldn't start the round, try again.",
    gameRewardTitle: "Laser Escape +{{amount}}",
    gameRewardMeta: "Game reward",
    couldntRecordReward: "Couldn't record the reward",
    tryReopeningApp: "Try reopening the app",
    miningAdNotReady: "Mining ad is not ready yet. Try again in a moment.",
    miningCycleNotReady: "Mining cycle is not ready yet.",
    tryStartAgainShortly:
      "Still confirming your ad with AdsGram — this can take a minute on mobile networks. Try Start again shortly; no need to rewatch if it was already confirmed.",
    tryClaimAgainShortly:
      "Still confirming your ad with AdsGram — this can take a minute on mobile networks. Try Claim again shortly; no need to rewatch if it was already confirmed.",
    miningStarted: "Mining started. Come back in 2 hours.",
    miningRewardTitle: "Mining reward +{{amount}}",
    miningRewardMeta: "Coins earned from SLY Mining",
    miningRewardToast: "+{{amount}} coins",
    miningActionFailed: "Mining action failed.",
    dailyCheckinTitle: "Daily check-in +{{amount}}",
    dailyCheckinMeta: "Reward claimed automatically",
    exchangeCompletedTitle: "Exchange completed",
    exchangeCompletedMeta: "{{coins}} Coins → {{usdt}} USDT",
    exchangeFailedTitle: "Exchange failed",
    giftCodeRedeemedTitle: "Gift code redeemed",
    giftCodeRedeemedMeta: "+{{amount}} Coins",
    giftCodeReceived: "You received {{amount}} coins!",
    giftCodeFailed: "Failed to redeem code",
    withdrawalRequestedTitle: "Withdrawal requested",
    withdrawalToBinance: "{{amount}} USDT to Binance ID {{target}}",
    withdrawalToGram: "{{amount}} USDT to GRAM (TON) address {{target}}",
    withdrawalFailedTitle: "Withdrawal failed",
    channelLeftSingle:
      "You left a channel — that task was reset and 1000 coins were deducted. Rejoin and complete it again.",
    adsLockedDuringCycle: "Ads are locked while your 2-hour cycle is running.",
    channelLeftMultiple:
      "You left {{count}} channels — those tasks were reset and coins were deducted. Rejoin and complete them again.",
  },
} as const;

export default en;
export type Dictionary = typeof en;

SLYEOF

mkdir -p "$(dirname "src/i18n/ar.ts")"
cat > "src/i18n/ar.ts" << 'SLYEOF'
import type { Dictionary } from "./en";

// Natural, professional Modern Standard Arabic — not a literal/machine
// translation. Keep keys identical in shape to en.ts.
const ar: Dictionary = {
  common: {
    cancel: "إلغاء",
    close: "إغلاق",
    confirm: "تأكيد",
    copy: "نسخ",
    copied: "تم النسخ",
    loading: "جارِ التحميل...",
    max: "الحد الأقصى",
    coins: "الكوينز",
    coin: "كوين",
    days: "أيام",
  },

  language: {
    label: "اللغة",
    english: "English",
    arabic: "العربية",
  },

  topbar: {
    kicker: "SLY MINING",
    home: { label: "الرئيسية", sub: "التعدين والأرباح" },
    tasks: { label: "المهام", sub: "مهام يومية" },
    games: { label: "الألعاب", sub: "العب واربح" },
    referrals: { label: "الإحالات", sub: "ادعُ واربح" },
    stars: { label: "النجوم", sub: "الترتيب الأسبوعي" },
    profile: { label: "حسابي", sub: "التحويل والسحب" },
    coins: "الكوينز",
    usdt: "USDT",
  },

  bottomnav: {
    home: "الرئيسية",
    tasks: "المهام",
    stars: "النجوم",
    games: "الألعاب",
    referrals: "الإحالات",
    profile: "حسابي",
  },

  home: {
    heroBadge: "SLY MINING",
    heroTitle: "عدّن الكوينز",
    heroDesc:
      "ابدأ دورة تعدين مدتها ساعتان، ثم شاهد إعلاناً واحداً إضافياً لاستلام مكافأتك.",
    rewardEvery2h: "كوينز كل ساعتين",
    statusReadyLabel: "جاهز للبدء",
    statusReadyTitle: "شاهد إعلاناً لتفعيل التعدين",
    statusReadyNote: "مشاهدة إعلان واحد تبدأ دورة الساعتين.",
    statusClaimLabel: "المكافأة جاهزة",
    statusClaimTitle: "{{amount}} كوين بانتظارك",
    statusClaimNote: "شاهد إعلاناً واحداً للاستلام.",
    statusActiveLabel: "التعدين جارٍ",
    statusStartedAt: "بدأ الساعة {{time}}",
    buttonWatching: "جارِ المشاهدة...",
    buttonStart: "شاهد إعلاناً وابدأ التعدين",
    buttonClaim: "شاهد إعلاناً واستلم {{amount}}",
    buttonInProgress: "التعدين جارٍ",
    preparingAds: "جارِ تجهيز إعلانات التعدين...",

    giftEyebrow: "استبدال",
    giftTitle: "كود الهدية",
    giftHint: "عندك كود ترويجي أو كود هدية؟ أدخله بالأسفل واحصل على كوينز إضافية.",
    giftPlaceholder: "أدخل كود الهدية",
    giftButton: "إدخال كود الهدية",
    giftButtonBusy: "جارِ الاستبدال...",

    checkinEyebrow: "تسجيل الحضور اليومي",
    checkinPoints: "+{{points}} نقطة اليوم",
    checkinStatus: "تم تسجيل الحضور",
    milestoneCommon: "عادي",
    milestoneEpic: "مميز",
    milestoneLegendary: "أسطوري",
    milestoneMythic: "خرافي",
    nextRewardIn: "المكافأة القادمة خلال {{days}} أيام",
    allRewardsUnlocked: "تم فتح جميع المكافآت",
    chestUnlocked: "تم فتح صندوق {{chest}}",
    keepStreakGoing: "حافظ على تتابع أيامك",

    leaderboardEyebrow: "أفضل 10",
    leaderboardTitle: "لوحة المتصدرين",
    noLeaderboardData: "لا توجد بيانات من السيرفر حالياً",
    coinsSuffix: "كوين",
    tierCommon: "عادي",
    tierRare: "نادر",
    tierEpic: "مميز",
    tierLegendary: "أسطوري",
    tierMythic: "خرافي",
  },

  tasks: {
    heroTitle: "اربح كوينز",
    heroSubtitle: "أكمل المهام لتربح الكوينز",
    tabAll: "الكل",
    tabAds: "إعلانات",
    tabJoinChannel: "الانضمام للقنوات",
    tabBots: "بوتات",
    loadingTasks: "جارِ تحميل المهام...",
    noTasks: "لا توجد مهام متاحة حالياً.",
    typeSmartAd: "إعلان ذكي",
    typeAdsGram: "AdsGram",
    typeGigaPub: "GigaPub",
    typeTask: "مهمة",
    completed: "مكتملة",
    watchAdToEarn: "شاهد الإعلان لتربح الكوينز",
    openLinkFirst: "افتح الرابط أولاً",
    sendingCoinsIn: "سيتم إرسال الكوينز خلال {{seconds}} ثانية",
    verifying: "جارِ التحقق...",
    readyProgress: "جاهزة {{completed}}/{{max}}",
    botJoinNote: "🤖 مهام الانضمام للبوتات لا تُحتسب ضمن تقدّم الإحالة.",
    openingAction: "جارِ الفتح...",
    loadingAdAction: "جارِ تحميل الإعلان...",
    watchAdAction: "مشاهدة إعلان",
    openAction: "فتح",
    taskLimitReached: "تم الوصول للحد الأقصى لهذه المهمة.",
    invalidTaskType: "نوع مهمة غير صالح.",
    adsgramNotReady: "إعلان AdsGram غير جاهز بعد. حاول مرة أخرى.",
    pleaseWaitSeconds: "الرجاء الانتظار {{seconds}} ثانية لمشاهدة إعلان آخر.",
    adFailedToLoad: "تعذّر تحميل الإعلان.",
    adWatchedClaiming: "تمت مشاهدة الإعلان. جارِ استلام الكوينز...",
    gigaPubNotReady: "إعلان GigaPub غير جاهز بعد. حاول مرة أخرى.",
    taskNoUrl: "لا يوجد رابط لهذه المهمة.",
    openedSendingIn: "تم الفتح. سيتم إرسال الكوينز خلال {{seconds}} ثانية.",
    failedToOpenTask: "تعذّر فتح المهمة.",
    failedToProcessTask: "تعذّرت معالجة المهمة",
    failedToVerifyTask: "تعذّر التحقق من المهمة",
    coinsRewardToast: "+{{amount}} كوين",
    taskProgressMeta: "المهمة {{completed}}/{{max}} +{{reward}} كوين",
  },

  referrals: {
    title: "الإحالات",
    description:
      "يتم قبول إحالتك بعد أن يكمل المستخدم المدعو {{tasks}} مهام. كل مهمة تُنجز بنجاح تُحتسب، حتى المهام القابلة للتكرار. ستحصل على {{reward}} USDT عند تأكيد الإحالة.",
    qualifiedReferrals: "الإحالات المؤهلة",
    requirementTitle: "شرط الإحالة",
    requirementBody:
      "يجب على المستخدم المدعو إكمال {{tasks}} مهام قبل احتساب الإحالة.",
    requirementExample:
      "مثال: 3 مهام عادية + مشاهدة إعلانين = {{tasks}} مهام. تكرار مهمة مسموح بتكرارها يُحتسب أيضاً في كل مرة تُنجز بنجاح.",
    linkLabel: "رابط الإحالة الخاص بك",
    linkUnavailable: "رابط الإحالة غير متاح",
    copy: "نسخ",
    copied: "تم النسخ!",
  },

  stars: {
    title: "ترتيب النجوم",
    intro:
      "كلما أبقيت البوت مفتوحاً لفترة أطول هذا الأسبوع، ارتفع ترتيبك. أفضل 3 لاعبين يفوزون بنجوم تيليجرام حقيقية كل أسبوع — من {{low}} إلى {{high}}",
    introSub:
      "المركزان #4 و#5 يفوزان أيضاً بجائزة — من {{low}} إلى {{high}}",
    yourRank: "ترتيبك: #{{rank}}",
    watchAdsCardTitle: "شاهد الإعلانات لتربح وقتاً",
    cycleRunning: "الدورة جارية — وقتك يرتفع تلقائياً.",
    unlocksIn: "يُفتح خلال {{time}}",
    watchAdsToUnlock: "شاهد {{count}} إعلان لتفتح {{time}} من وقت التصعيد.",
    adsWatched: "تمت مشاهدة {{count}}/{{required}}",
    balanceReady: "رصيد جاهز: {{count}} إعلان = {{time}}",
    watchAd: "مشاهدة إعلان",
    loadingEllipsis: "جارِ التحميل…",
    useBalance: "استخدام الرصيد",
    useBalanceCount: "استخدام الرصيد ({{count}})",
    takingAWhile: "استغرق وقتاً أطول؟ سيُعاد الضبط تلقائياً خلال ثوانٍ.",
    loadingLeaderboard: "جارِ تحميل لوحة المتصدرين…",
    failedToLoad: "تعذّر تحميل لوحة المتصدرين",
    noActivityThisWeek: "لا يوجد نشاط مسجّل هذا الأسبوع بعد.",
    footerNote: "يُعاد ضبط الترتيب أسبوعياً من الفريق بعد إرسال الجوائز.",
  },

  games: {
    eyebrow: "الألعاب",
    title: "العب واربح أكثر",
    subtitle: "محاولات محدودة يومياً — اكسب محاولات إضافية بمشاهدة إعلان",
    attemptsLeft: "محاولة متبقية اليوم",
    freeCount: "{{count}} مجانية",
    bonusCount: "{{count}} من الإعلانات",
    loadingAd: "جارِ تحميل الإعلان...",
    watchAdBonus: "شاهد إعلان (+1 محاولة)",
    laserEscapeTitle: "الهروب الليزري",
    laserEscapeDesc: "تفادَ النيازك وأطلق الليزر عبر 5 موجات فضائية",
    coinsPerWave: "+100 كوين / موجة",
    lives: "5 أرواح",
    noAttemptsLeft: "لا توجد محاولات متبقية",
    playNow: "العب الآن",
    comingSoon: "قريباً",
    comingSoonDesc: "ألعاب فضائية جديدة تنضم لهذا القسم قريباً",
  },

  gameCanvas: {
    backToLobby: "العودة للقائمة",
    wave: "الموجة",
    coins: "الكوينز",
    energy: "الطاقة",
    victory: "انتصار",
    runEnded: "انتهت الجولة",
    waveLabel: "الموجة {{n}}",
    braceForImpact: "استعد للاصطدام",
    finalStorm: "العاصفة الأخيرة",
    meteorPressureRising: "ضغط النيازك يتصاعد",
    incomingRocks: "صخور قادمة",
    waveStatus: "الموجة {{n}} / {{total}}",
    missionComplete: "اكتملت المهمة",
    missionCompleteStatus: "اكتملت المهمة",
    runFailed: "فشلت الجولة",
    runFailedStatus: "فشلت الجولة",
    meteorEscaped: "أفلت نيزك.",
    shipHit: "أُصيبت سفينتك.",
    waveClearedTitle: "تم تطهير الموجة {{n}}",
    waveClearedCoins: "+{{amount}} كوين",
    waveClearedStatus: "تم تطهير الموجة {{n}} +{{amount}} كوين",
    missionCompleteSubtitle: "طهّرت كل الموجات الـ{{total}} وربحت {{coins}} كوين.",
    runFailedText: "{{reason}} ربحت {{coins}} كوين في هذه الجولة.",
    minusOneLife: "-1 روح",
    livesLeft: "بقي {{count}} {{unit}}",
    life: "روح",
    lives: "أرواح",
  },

  profile: {
    walletCenter: "مركز المحفظة",
    walletConnected: "تم ربط المحفظة",
    connectWallet: "اربط محفظة GRAM (TON) الخاصة بك",
    walletLead:
      "اربط عنوان TON للسحب كـ GRAM. تفضّل Binance؟ يمكنك أيضاً سحب USDT مباشرة إلى معرّف Binance الخاص بك — بدون الحاجة لمحفظة في هذا الخيار.",
    connectedAddress: "العنوان المربوط",
    copy: "نسخ",
    copied: "تم النسخ",
    disconnect: "فصل المحفظة",
    disconnectConfirm: "هل تريد فصل هذه المحفظة؟",
    cancel: "إلغاء",
    walletPlaceholder: "عنوان محفظة TON",
    connect: "ربط",
    errorEmptyAddress: "أدخل عنوان محفظة TON الخاص بك.",
    errorInvalidAddress: "هذا لا يبدو عنوان TON صحيحاً.",
    earned: "المكتسب",
    exchanged: "المحوّل",
    usdt: "USDT",
    exchangeCoins: "تحويل الكوينز",
    withdrawUsdt: "سحب USDT",
    yourRequests: "طلباتك",
    withdrawalHistory: "سجل السحوبات",
    noWithdrawalsYet: "لا توجد طلبات سحب بعد",
    binanceId: "معرّف Binance",
    gramWallet: "محفظة GRAM (TON)",
    statusPending: "قيد الانتظار",
    statusApproved: "تمت الموافقة",
    statusRejected: "مرفوض",
    languageSection: "اللغة",
    languageHint: "اختر لغة التطبيق بالكامل.",
  },

  exchangeModal: {
    eyebrow: "تحويل",
    title: "كوينز ← USDT",
    rateLabel: "سعر الصرف",
    rateValue: "1000 كوين = 0.0025 USDT",
    amountLabel: "المبلغ",
    amountPlaceholder: "أدخل عدد الكوينز",
    max: "الحد الأقصى",
    youReceive: "ستستلم",
    available: "المتاح",
    coinsSuffix: "كوين",
    noteDefault:
      "ستشاهد إعلاناً قبل تأكيد التحويل. بعدها، تُخصم الكوينز وتُضاف USDT فوراً.",
    notEnoughCoins: "لا يوجد رصيد كوينز كافٍ للتحويل.",
    minimumExchange: "الحد الأدنى للتحويل هو {{amount}} كوين.",
    watchingAd: "جارِ مشاهدة الإعلان...",
    pleaseWaitSeconds: "الرجاء الانتظار {{seconds}} ثانية لمشاهدة إعلان آخر.",
    adsUnavailable: "الإعلانات غير متاحة حالياً. حاول مرة أخرى.",
    adFailed: "تعذّر إكمال الإعلان. حاول مرة أخرى.",
    cancel: "إلغاء",
    confirmWatching: "جارِ مشاهدة الإعلان...",
    confirmWatch: "شاهد إعلاناً وحوّل",
  },

  withdrawModal: {
    eyebrow: "سحب",
    title: "سحب USDT",
    watchAdsToUnlock: "شاهد إعلانات لفتح السحب",
    unlocked: "تم الفتح ✓",
    confirmingReward: "جارِ تأكيد المكافأة...",
    watchAd: "مشاهدة إعلان",
    binanceMethod: "معرّف Binance (USDT)",
    gramMethod: "محفظة GRAM (TON)",
    binanceIdLabel: "معرّف Binance",
    binanceIdPlaceholder: "معرّف المستخدم في Binance",
    gramAddressLabel: "عنوان GRAM (TON)",
    gramAddressPlaceholder: "عنوان محفظة GRAM (TON) الخاصة بك",
    amountLabel: "المبلغ (USDT)",
    amountPlaceholder: "الحد الأدنى {{min}} / الحد الأقصى {{max}} USDT",
    max: "الحد الأقصى",
    availableBalance: "الرصيد المتاح",
    noteBinance: "سيتم إرسال الأموال كـ USDT مباشرة إلى معرّف حسابك في Binance.",
    noteGram:
      "سيتم إرسال الأموال كـ GRAM (TON) إلى عنوان محفظتك. يُدخل المبلغ بالـ USDT، ويُرسل المشرف ما يعادله من GRAM يدوياً.",
    minMax: "الحد الأدنى للسحب: {{min}} USDT • الحد الأقصى لكل عملية سحب: {{max}} USDT",
    cancel: "إلغاء",
    confirmWithdraw: "تأكيد السحب",
    errorMaxPerWithdrawal: "الحد الأقصى للسحب هو {{max}} USDT لكل عملية.",
    errorWatchMoreAds: "شاهد {{count}} إعلان إضافي لفتح السحب.",
    errorEnterValidAmount: "الرجاء إدخال مبلغ صحيح.",
    errorMinWithdrawal: "الحد الأدنى للسحب هو {{min}} USDT.",
    errorInsufficientBalance: "رصيد USDT غير كافٍ.",
    errorEnterBinanceId: "أدخل معرّف Binance الخاص بك.",
    errorEnterGramAddress: "أدخل عنوان محفظة GRAM (TON) الخاصة بك.",
    adsUnavailable: "الإعلانات غير متاحة حالياً. حاول مرة أخرى.",
    adFailed: "تعذّر إكمال الإعلان. حاول مرة أخرى.",
    pleaseWaitSeconds: "الرجاء الانتظار {{seconds}} ثانية لمشاهدة إعلان آخر.",
  },

  giftCodeModal: {
    eyebrow: "كود الهدية",
    title: "استبدال الكود",
    codeLabel: "الكود",
    codePlaceholder: "أدخل كود الهدية",
    noteDefault: "أدخل كود هدية للحصول على كوينز إضافية.",
    cancel: "إلغاء",
    redeeming: "جارِ الاستبدال...",
    redeem: "استبدال",
  },

  mandatorySubscription: {
    title: "انضم للمتابعة",
    body: "يجب عليك الانضمام إلى القنوات أدناه لاستخدام البوت وفتح مكافأتك.",
    joined: "منضم",
    join: "انضمام",
    checking: "جارِ التحقق...",
    verified: "تم التحقق من العضوية",
    verify: "تحقق من العضوية",
    checkingMembership: "جارِ التحقق من العضوية...",
  },

  app: {
    duplicateNotice:
      "تنبيه: هذا الجهاز/الشبكة لديه حساب مسجّل مسبقاً. الحسابات الجديدة من هنا لن تربح مكافآت الإحالة — حسابك الخاص واللعب لا يتأثران.",
    dismiss: "إغلاق",
    bootErrorAuth: "افتح اللعبة داخل تطبيق تيليجرام حتى يتم التعرّف على حسابك.",
    bootErrorGeneric: "تعذّر الوصول إلى السيرفر. جرّب إغلاق التطبيق وإعادة فتحه.",
    adStillLoading: "الإعلانات لا تزال قيد التحميل، حاول مرة أخرى بعد لحظات.",
    adFailedToLoadOrComplete: "فشل تحميل الإعلان أو إكماله.",
    somethingWentWrong: "حدث خطأ ما. حاول مرة أخرى.",
    adNotReady: "الإعلان غير جاهز بعد. حاول مرة أخرى بعد لحظات.",
    adTimeoutRetry: "لم يُبلَّغ باكتمال الإعلان في الوقت المحدد. حاول مرة أخرى.",
    pleaseWaitSeconds: "الرجاء الانتظار {{seconds}} ثانية لمشاهدة إعلان آخر.",
    stillConfirmingAd:
      "لا نزال نؤكد إعلانك مع AdsGram — قد يستغرق ذلك دقيقة على شبكات الجوال. حاول مرة أخرى بعد قليل؛ لا داعي لإعادة المشاهدة.",
    adVerifiedBy: "تم تأكيد الإعلان عبر AdsGram — {{count}}/{{required}}",
    watchOneAdFirst: "شاهد إعلاناً واحداً على الأقل قبل استخدام الرصيد.",
    balanceActivated: "تم تفعيل الرصيد — وقتك يرتفع تلقائياً الآن.",
    couldNotUseBalance: "تعذّر استخدام الرصيد، حاول مرة أخرى.",
    gotBonusAttempt: "رائع! حصلت على محاولة إضافية 🎮",
    couldNotStartRun: "لم نتمكن من بدء الجولة، حاول مرة أخرى.",
    gameRewardTitle: "الهروب الليزري +{{amount}}",
    gameRewardMeta: "مكافأة اللعبة",
    couldntRecordReward: "تعذّر تسجيل المكافأة",
    tryReopeningApp: "جرّب إعادة فتح التطبيق",
    miningAdNotReady: "إعلان التعدين غير جاهز بعد. حاول مرة أخرى بعد لحظات.",
    miningCycleNotReady: "دورة التعدين غير جاهزة بعد.",
    tryStartAgainShortly:
      "لا نزال نؤكد إعلانك مع AdsGram — قد يستغرق ذلك دقيقة على شبكات الجوال. جرّب زر البدء مرة أخرى بعد قليل؛ لا داعي لإعادة المشاهدة إذا كان قد تم تأكيده.",
    tryClaimAgainShortly:
      "لا نزال نؤكد إعلانك مع AdsGram — قد يستغرق ذلك دقيقة على شبكات الجوال. جرّب زر الاستلام مرة أخرى بعد قليل؛ لا داعي لإعادة المشاهدة إذا كان قد تم تأكيده.",
    miningStarted: "بدأ التعدين. عد بعد ساعتين.",
    miningRewardTitle: "مكافأة التعدين +{{amount}}",
    miningRewardMeta: "كوينز مكتسبة من SLY Mining",
    miningRewardToast: "+{{amount}} كوين",
    miningActionFailed: "فشلت عملية التعدين.",
    dailyCheckinTitle: "تسجيل الحضور اليومي +{{amount}}",
    dailyCheckinMeta: "تم استلام المكافأة تلقائياً",
    exchangeCompletedTitle: "تم التحويل",
    exchangeCompletedMeta: "{{coins}} كوين ← {{usdt}} USDT",
    exchangeFailedTitle: "فشل التحويل",
    giftCodeRedeemedTitle: "تم استبدال كود الهدية",
    giftCodeRedeemedMeta: "+{{amount}} كوين",
    giftCodeReceived: "لقد حصلت على {{amount}} كوين!",
    giftCodeFailed: "تعذّر استبدال الكود",
    withdrawalRequestedTitle: "تم طلب السحب",
    withdrawalToBinance: "{{amount}} USDT إلى معرّف Binance {{target}}",
    withdrawalToGram: "{{amount}} USDT إلى عنوان GRAM (TON) {{target}}",
    withdrawalFailedTitle: "فشل السحب",
    channelLeftSingle:
      "لقد غادرت إحدى القنوات — تمت إعادة ضبط تلك المهمة وخُصمت 1000 كوين. انضم مرة أخرى وأكملها من جديد.",
    adsLockedDuringCycle: "الإعلانات مقفلة أثناء تشغيل دورة الساعتين.",
    channelLeftMultiple:
      "لقد غادرت {{count}} قنوات — تمت إعادة ضبط تلك المهام وخُصمت الكوينز. انضم مرة أخرى وأكملها من جديد.",
  },
};

export default ar;

SLYEOF

mkdir -p "$(dirname "src/i18n/LanguageContext.tsx")"
cat > "src/i18n/LanguageContext.tsx" << 'SLYEOF'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import en from "./en";
import ar from "./ar";

export type Lang = "en" | "ar";

const dictionaries: Record<Lang, any> = { en, ar };

const STORAGE_KEY = "sly.lang.v1";

function getPath(obj: any, path: string) {
  return path
    .split(".")
    .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function detectDefaultLang(): Lang {
  if (typeof window === "undefined") return "en";

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "ar" || saved === "en") return saved;
  } catch {}

  // Respect the language the person already uses in Telegram, so the
  // app opens in Arabic for Arabic-speaking users without any extra
  // step, while still letting them switch manually afterwards.
  try {
    const tgLang = (window as any).Telegram?.WebApp?.initDataUnsafe?.user
      ?.language_code;
    if (tgLang && String(tgLang).toLowerCase().startsWith("ar")) return "ar";
  } catch {}

  try {
    const navLang = window.navigator?.language || "";
    if (navLang.toLowerCase().startsWith("ar")) return "ar";
  } catch {}

  return "en";
}

type LanguageContextValue = {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => detectDefaultLang());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {}

    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", lang);
      document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    }
  }, [lang]);

  const t = useMemo(() => {
    return (key: string, vars?: Record<string, string | number>) => {
      const dict = dictionaries[lang] ?? dictionaries.en;
      let value = getPath(dict, key);

      if (value === undefined) value = getPath(dictionaries.en, key);
      if (value === undefined) return key;
      if (typeof value !== "string") return String(value);
      if (!vars) return value;

      return Object.keys(vars).reduce(
        (acc, k) => acc.split(`{{${k}}}`).join(String(vars[k])),
        value
      );
    };
  }, [lang]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      setLang: setLangState,
      t,
    }),
    [lang, t]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}

SLYEOF

mkdir -p "$(dirname "src/components/LanguageSwitch.tsx")"
cat > "src/components/LanguageSwitch.tsx" << 'SLYEOF'
import { useLanguage } from "../i18n/LanguageContext";
import "../styles/language.css";

export default function LanguageSwitch() {
  const { lang, setLang, t } = useLanguage();

  return (
    <section className="language-switch-card">
      <div className="language-switch-head">
        <p>{t("profile.languageSection")}</p>
        <span>{t("profile.languageHint")}</span>
      </div>

      <div className="language-switch-row" role="group" aria-label={t("language.label")}>
        <button
          type="button"
          className={`language-switch-btn ${lang === "en" ? "active" : ""}`}
          onClick={() => setLang("en")}
        >
          🇬🇧 {t("language.english")}
        </button>

        <button
          type="button"
          className={`language-switch-btn ${lang === "ar" ? "active" : ""}`}
          onClick={() => setLang("ar")}
        >
          🇸🇦 {t("language.arabic")}
        </button>
      </div>
    </section>
  );
}

SLYEOF

mkdir -p "$(dirname "src/styles/language.css")"
cat > "src/styles/language.css" << 'SLYEOF'
.language-switch-card {
  border-radius: var(--radius-xl);
  background: #12181a;
  border: 1px solid rgba(84, 230, 212, 0.10);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.language-switch-head p {
  color: #7fe0d2;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.language-switch-head span {
  color: #8fa19e;
  font-size: 13px;
  line-height: 1.5;
}

.language-switch-row {
  display: flex;
  gap: 10px;
}

.language-switch-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #1b2324;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #8fa19e;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}

.language-switch-btn.active {
  background: rgba(84, 230, 212, 0.12);
  border-color: rgba(84, 230, 212, 0.35);
  color: #eaf4f2;
}

SLYEOF

mkdir -p "$(dirname "src/main.tsx")"
cat > "src/main.tsx" << 'SLYEOF'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './i18n/LanguageContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
)

SLYEOF

mkdir -p "$(dirname "index.html")"
cat > "index.html" << 'SLYEOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>sly</title>

    <!-- خط عربي واضح ومقروء لواجهة اللغة العربية -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">

    <!-- تسريع الاتصال بسيرفرات AdsGram قبل ما نحتاجها فعلياً -->
    <link rel="preconnect" href="https://sad.adsgram.ai" crossorigin>
    <link rel="dns-prefetch" href="https://sad.adsgram.ai">

    <!-- تحميل SDK الخاص بـ AdsGram أول شي، بالتوازي مع كل شي ثاني،
         بدل ما ننتظر React يشتغل ويحقن السكربت بجافاسكربت -->
    <script src="https://sad.adsgram.ai/js/sad.min.js"></script>

    <!-- تسريع الاتصال بسيرفرات GigaPub قبل ما نحتاجها فعلياً -->
    <link rel="preconnect" href="https://ad.gigapub.tech" crossorigin>
    <link rel="dns-prefetch" href="https://ad.gigapub.tech">

    <!-- تحميل SDK الخاص بـ GigaPub -->
    <script src="https://ad.gigapub.tech/script?id=8101"></script>
  </head>
  <body>
    <div id="root"></div>

    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>

SLYEOF

mkdir -p "$(dirname "src/styles/variables.css")"
cat > "src/styles/variables.css" << 'SLYEOF'
:root {
  /* Colors */
  --bg-space: #101516;
  --surface-dark: #141b1c;
  --card-bg: rgba(20, 27, 28, 0.65);
  --card-border: rgba(255, 255, 255, 0.06);
  --card-border-glow: rgba(84, 230, 212, 0.22);

  --blue-primary: #54e6d4;
  --blue-secondary: #2fbfae;
  --blue-cyan: #54e6d4;
  --gold-luxury: #e3c071;
  --threat-red: #ff6b6b;

  --text-primary: #eaf4f2;
  --text-secondary: #93a3a1;
  --text-muted: #56645f;

  /* Layout */
  --topbar-height: 70px;
  --bottomnav-height: 80px;

  /* Visual Effects */
  --glass-blur: blur(16px);
  --radius-lg: 18px;
  --radius-md: 14px;
  --radius-sm: 10px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* اللغة العربية: خط عربي واضح + اتجاه الصفحة من اليمين لليسار.
   معظم التخطيطات هنا مبنية على flexbox بدون تحديد اتجاه صريح،
   فهي تنعكس تلقائياً مع dir="rtl". هذا القسم يغطي الحالات
   المتبقية (المحاذاة النصية والفواصل الثابتة). */
html[dir="rtl"] body {
  font-family: 'Tajawal', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

html[dir="rtl"] {
  text-align: right;
}

html[dir="rtl"] input,
html[dir="rtl"] textarea {
  text-align: right;
}

html[dir="rtl"] input[type="number"] {
  text-align: right;
}

body {
  background-color: var(--bg-space);
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow-x: hidden;
  background-image: 
    radial-gradient(circle at 50% 0%, rgba(84, 230, 212, 0.07) 0%, transparent 60%),
    radial-gradient(circle at 80% 100%, rgba(84, 230, 212, 0.04) 0%, transparent 50%);
  min-height: 100vh;
}

SLYEOF

mkdir -p "$(dirname "src/components/TopBar.tsx")"
cat > "src/components/TopBar.tsx" << 'SLYEOF'
import "../styles/topbar.css";
import UiIcons from "./UiIcons";
import type { Page } from "../App";
import { useLanguage } from "../i18n/LanguageContext";

type Props = {
  page: Page;
  coins: number;
  usdt: number;
};

export default function TopBar({
  page,
  coins,
  usdt,
}: Props) {
  const { t } = useLanguage();

  const titles: Record<Page, { label: string; sub: string }> = {
    home: { label: t("topbar.home.label"), sub: t("topbar.home.sub") },
    tasks: { label: t("topbar.tasks.label"), sub: t("topbar.tasks.sub") },
    games: { label: t("topbar.games.label"), sub: t("topbar.games.sub") },
    referrals: { label: t("topbar.referrals.label"), sub: t("topbar.referrals.sub") },
    stars: { label: t("topbar.stars.label"), sub: t("topbar.stars.sub") },
    profile: { label: t("topbar.profile.label"), sub: t("topbar.profile.sub") },
  };

  const current = titles[page];

  return (
    <header className="topbar">
      <div className="topbar-left">
        <p className="topbar-kicker">
          {t("topbar.kicker")}
        </p>

        <div className="topbar-row">
          <span className="page-chip">
            {current.label.toUpperCase()}
          </span>

          <span className="topbar-sub">
            {current.sub}
          </span>
        </div>
      </div>

      <div className="topbar-stats">
        <div className="stat-pill coins">
          <UiIcons
            name="coins"
            className="stat-icon coins-icon"
          />

          <div>
            <small>
              {t("topbar.coins")}
            </small>

            <strong>
              {coins.toLocaleString()}
            </strong>
          </div>
        </div>

        <div className="stat-pill usdt">
          <UiIcons
            name="withdraw"
            className="stat-icon usdt-icon"
          />

          <div>
            <small>
              {t("topbar.usdt")}
            </small>

            <strong>
              {usdt.toFixed(4)}
            </strong>
          </div>
        </div>
      </div>
    </header>
  );
}

SLYEOF

mkdir -p "$(dirname "src/components/BottomNav.tsx")"
cat > "src/components/BottomNav.tsx" << 'SLYEOF'
import "../styles/bottomnav.css";
import UiIcons from "./UiIcons";
import type { Page } from "../App";
import { useLanguage } from "../i18n/LanguageContext";

type Props = {
  page: Page;
  setPage: (page: Page) => void;
};

export default function BottomNav({ page, setPage }: Props) {
  const { t } = useLanguage();

  const items: {
    id: Page;
    label: string;
    icon: "home" | "tasks" | "referrals" | "star" | "games" | "profile";
  }[] = [
    { id: "home", label: t("bottomnav.home"), icon: "home" },
    { id: "tasks", label: t("bottomnav.tasks"), icon: "tasks" },
    { id: "stars", label: t("bottomnav.stars"), icon: "star" },
    { id: "games", label: t("bottomnav.games"), icon: "games" },
    { id: "referrals", label: t("bottomnav.referrals"), icon: "referrals" },
    { id: "profile", label: t("bottomnav.profile"), icon: "profile" },
  ];

  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <button
          key={item.id}
          className={page === item.id ? `nav-item active ${item.id}` : `nav-item ${item.id}`}
          onClick={() => setPage(item.id)}
        >
          <UiIcons name={item.icon} className="nav-icon" />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

SLYEOF

mkdir -p "$(dirname "src/pages/Home.tsx")"
cat > "src/pages/Home.tsx" << 'SLYEOF'
import { useEffect, useMemo, useState } from "react";
import UiIcons from "../components/UiIcons";
import { useLanguage } from "../i18n/LanguageContext";
import "../styles/home.css";

type MiningState = {
  active: boolean;
  reward: number;
  cycleHours: number;
  startedAt: string | null;
  claimAvailableAt: string | null;
  claimReady: boolean;
  startAdVerified: boolean;
  claimAdVerified: boolean;
};

type RedeemResult = { success: boolean; message: string };

type Props = {
  streak: number;
  mining: MiningState;
  miningReady: boolean;
  miningAdBusy: boolean;
  onMining: () => void;
  onRedeemGiftCode: (code: string) => Promise<RedeemResult>;
};

type LeaderUser = {
  rank: number;
  name: string;
  coins: string;
  tier: string;
};

const DAILY_POINTS = 250;

const milestones = [
  { days: 3, chestKey: "milestoneCommon" },
  { days: 7, chestKey: "milestoneEpic" },
  { days: 14, chestKey: "milestoneLegendary" },
  { days: 50, chestKey: "milestoneMythic" },
] as const;

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function formatMiningStartedAt(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Home({
  streak,
  mining,
  miningReady,
  miningAdBusy,
  onMining,
  onRedeemGiftCode,
}: Props) {
  const { t } = useLanguage();
  const [leaderboard, setLeaderboard] = useState<LeaderUser[]>([]);
  const [now, setNow] = useState(() => Date.now());

  const [giftCode, setGiftCode] = useState("");
  const [giftBusy, setGiftBusy] = useState(false);
  const [giftStatus, setGiftStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [giftMessage, setGiftMessage] = useState("");

  const handleRedeemGiftCode = async () => {
    const trimmed = giftCode.trim();
    if (!trimmed || giftBusy) return;

    setGiftBusy(true);
    setGiftMessage("");

    const result = await onRedeemGiftCode(trimmed);

    setGiftBusy(false);
    setGiftStatus(result.success ? "success" : "error");
    setGiftMessage(result.message);

    if (result.success) {
      setGiftCode("");
    }
  };

  // العداد المرئي بس - يحدّث كل ثانية طالما المستخدم على هاي الصفحة.
  // هذا لا علاقة له بحالة التعدين الفعلية (تلك محفوظة بمستوى App
  // فتستمر حتى لو بدّلت صفحة).
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLeaderboard(data);
        }
      })
      .catch(() => {});
  }, []);

  const remainingMs =
    mining.active && mining.claimAvailableAt
      ? Math.max(0, new Date(mining.claimAvailableAt).getTime() - now)
      : 0;

  const claimReady = mining.active && (mining.claimReady || remainingMs <= 0);

  const currentChest =
    milestones.filter((item) => streak >= item.days).at(-1) ?? null;

  const nextMilestone =
    milestones.find((item) => item.days > streak) ?? null;

  const progressToNext = useMemo(() => {
    if (!nextMilestone) return 1;

    const previous =
      milestones.filter((item) => item.days < nextMilestone.days).at(-1)
        ?.days ?? 0;

    const span = nextMilestone.days - previous;
    if (span <= 0) return 0;

    return Math.min(1, Math.max(0, (streak - previous) / span));
  }, [streak, nextMilestone]);

  return (
    <section className="home-page">
      <section className="mining-hero">
        <div className="mining-orbit orbit-one" />
        <div className="mining-orbit orbit-two" />

        <span className="hero-badge">{t("home.heroBadge")}</span>

        <h1 className="hero-title">{t("home.heroTitle")}</h1>

        <p className="hero-desc">
          {t("home.heroDesc")}
        </p>

        <div className="mining-reward">
          <strong>+{mining.reward.toLocaleString()}</strong>
          <span>{t("home.rewardEvery2h")}</span>
        </div>

        <div className="mining-status-card">
          {!mining.active ? (
            <>
              <span className="mining-status-label">{t("home.statusReadyLabel")}</span>
              <strong>{t("home.statusReadyTitle")}</strong>
              <small>{t("home.statusReadyNote")}</small>
            </>
          ) : claimReady ? (
            <>
              <span className="mining-status-label ready">{t("home.statusClaimLabel")}</span>
              <strong>{t("home.statusClaimTitle", { amount: mining.reward.toLocaleString() })}</strong>
              <small>{t("home.statusClaimNote")}</small>
            </>
          ) : (
            <>
              <span className="mining-status-label">{t("home.statusActiveLabel")}</span>
              <strong className="mining-timer">
                {formatTime(remainingMs)}
              </strong>
              <small>
                {t("home.statusStartedAt", { time: formatMiningStartedAt(mining.startedAt) })}
              </small>
            </>
          )}
        </div>

        <button
          className="hero-play mining-button"
          onClick={onMining}
          disabled={
            !miningReady || miningAdBusy || (mining.active && !claimReady)
          }
        >
          {miningAdBusy ? (
            <>
              <span className="hero-play-spinner" />
              <span className="hero-play-text">{t("home.buttonWatching")}</span>
            </>
          ) : !mining.active ? (
            <>
              <span className="hero-play-icon">
                <UiIcons name="play" className="hero-play-icon-svg" />
              </span>
              <span className="hero-play-text">{t("home.buttonStart")}</span>
            </>
          ) : claimReady ? (
            <>
              <span className="hero-play-icon">
                <UiIcons name="coins" className="hero-play-icon-svg" />
              </span>
              <span className="hero-play-text">
                {t("home.buttonClaim", { amount: mining.reward.toLocaleString() })}
              </span>
            </>
          ) : (
            <span className="hero-play-text">{t("home.buttonInProgress")}</span>
          )}
        </button>

        {!miningReady ? (
          <small className="mining-sdk-note">
            {t("home.preparingAds")}
          </small>
        ) : null}
      </section>

      <article className="mini-card gift-code-card">
        <div className="section-head compact">
          <div>
            <p>{t("home.giftEyebrow")}</p>
            <h2>{t("home.giftTitle")}</h2>
          </div>
          <svg
            viewBox="0 0 24 24"
            className="section-head-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <rect x="3" y="9" width="18" height="11" rx="1.5" />
            <path d="M3 13h18" />
            <path d="M12 9v11" />
            <path d="M12 9C9.5 9 8 7.6 8 6a2 2 0 0 1 4 0v3Z" />
            <path d="M12 9c2.5 0 4-1.4 4-3a2 2 0 0 0-4 0v3Z" />
          </svg>
        </div>

        <p className="gift-code-hint">
          {t("home.giftHint")}
        </p>

        <div className="gift-code-input-row">
          <input
            className="gift-code-input"
            value={giftCode}
            onChange={(e) => setGiftCode(e.target.value)}
            placeholder={t("home.giftPlaceholder")}
            autoCapitalize="characters"
            disabled={giftBusy}
          />

          <button
            className="gift-code-open-btn"
            onClick={handleRedeemGiftCode}
            type="button"
            disabled={!giftCode.trim() || giftBusy}
          >
            {giftBusy ? t("home.giftButtonBusy") : t("home.giftButton")}
          </button>
        </div>

        {giftMessage ? (
          <p
            className="gift-code-message"
            style={{ color: giftStatus === "success" ? "#81c784" : "#ff8a80" }}
          >
            {giftMessage}
          </p>
        ) : null}
      </article>

      <section className="checkin-card">
        <div className="checkin-top">
          <div className="checkin-streak-badge">
            <strong>{streak}</strong>
            <span>{t("common.days")}</span>
          </div>

          <div className="checkin-top-text">
            <p className="checkin-eyebrow">{t("home.checkinEyebrow")}</p>
            <h2>{t("home.checkinPoints", { points: DAILY_POINTS })}</h2>
            <span className="checkin-status">{t("home.checkinStatus")}</span>
          </div>
        </div>

        <div className="progress-bar">
          <span style={{ width: `${progressToNext * 100}%` }} />
        </div>

        <div className="milestones">
          {milestones.map((item) => {
            const achieved = streak >= item.days;
            const active = nextMilestone?.days === item.days;

            return (
              <div
                key={item.days}
                className={`milestone ${achieved ? "achieved" : ""} ${
                  active ? "active" : ""
                }`}
              >
                <strong>{item.days}</strong>
                <span>{t(`home.${item.chestKey}`)}</span>
              </div>
            );
          })}
        </div>

        <div className="checkin-footer">
          <span className="checkin-next">
            {nextMilestone
              ? t("home.nextRewardIn", { days: nextMilestone.days - streak })
              : t("home.allRewardsUnlocked")}
          </span>

          <span className="checkin-countdown">
            {currentChest
              ? t("home.chestUnlocked", { chest: t(`home.${currentChest.chestKey}`) })
              : t("home.keepStreakGoing")}
          </span>
        </div>
      </section>

      <section className="home-grid">
        <article className="mini-card">
          <div className="section-head compact">
            <div>
              <p>{t("home.leaderboardEyebrow")}</p>
              <h2>{t("home.leaderboardTitle")}</h2>
            </div>
            <UiIcons name="leaderboard" className="section-head-icon" />
          </div>

          <div className="leader-list">
            {leaderboard.length === 0 ? (
              <div
                style={{
                  color: "#8fa19e",
                  padding: "10px 0",
                  textAlign: "center",
                }}
              >
                {t("home.noLeaderboardData")}
              </div>
            ) : (
              leaderboard.map((player) => (
                <div
                  key={player.rank}
                  className={`leader-row ${
                    player.tier === "Legendary" ? "legendary" : ""
                  } ${player.tier === "Mythic" ? "mythic" : ""}`}
                >
                  <span className="rank">#{player.rank}</span>

                  <div className="leader-copy">
                    <strong>{player.name}</strong>
                    <small>{player.coins} {t("home.coinsSuffix")}</small>
                  </div>

                  <span className={`tier ${player.tier.toLowerCase()}`}>
                    {["Common", "Rare", "Epic", "Legendary", "Mythic"].includes(player.tier)
                      ? t(`home.tier${player.tier}`)
                      : player.tier}
                  </span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </section>
  );
}

SLYEOF

mkdir -p "$(dirname "src/pages/Tasks.tsx")"
cat > "src/pages/Tasks.tsx" << 'SLYEOF'
import { useEffect, useRef, useState } from "react";
import { tryAcquireGlobalAdLock, releaseGlobalAdLock, getAdLockWaitSeconds } from "../lib/adLock";
import { useLanguage } from "../i18n/LanguageContext";
import "../styles/tasks.css";

type Props = {
  onRewardCoins: (amount: number, title: string, meta: string) => void;
};

type ServerTask = {
  id: string | number;
  title: string;
  reward: number;
  url: string;
  is_active: boolean;
  task_type?: string;
  max_completions?: number;
  completed?: number;
};

type TaskProgress = {
  completed: number;
  max_completions: number;
};

type ProgressMap = Record<string, TaskProgress>;
type OpenedMap = Record<string, number>;

const CLAIM_DELAY_MS = 5000;
const SMART_AD_CLAIM_DELAY_MS = 5000;
const ADSGRAM_CLAIM_DELAY_MS = 0;   // صفر لـ AdsGram أيضاً (إعلان لا يمكن تخطيه)
const GIGA_PUB_CLAIM_DELAY_MS = 0; // صفر لـ GigaPub أيضاً (إعلان لا يمكن تخطيه)


// بلوك AdsGram الخاص بمهام المشاهدة (نفس نوع البلوك المستخدم في بوابة السحب)
const ADSGRAM_TASK_BLOCK_ID = "46262";
const ADSGRAM_SCRIPT_SRC = "https://sad.adsgram.ai/js/sad.min.js";

type AdsgramShowResult = {
  done: boolean;
  description: string;
  state: "load" | "render" | "playing" | "destroy";
  error: boolean;
};

type AdsgramController = {
  show: () => Promise<AdsgramShowResult>;
  addEventListener?: (event: string, callback: () => void) => void;
};

declare global {
  interface Window {
    Adsgram?: {
      init: (opts: { blockId: string }) => AdsgramController;
    };
    showGiga?: () => Promise<void>;
  }
}


function waitForAdsgramScript(timeoutMs = 15000): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Adsgram) return Promise.resolve(true);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: boolean) => {
      if (settled) return;
      settled = true;
      window.clearInterval(pollId);
      resolve(result);
    };

    // Poll as a safety net: the <script> tag now lives in index.html's <head>,
    // so its load/error event may fire before this code even runs. Relying
    // only on those events can cause us to wait the full timeout even though
    // window.Adsgram became available seconds ago.
    const pollId = window.setInterval(() => {
      if (window.Adsgram) finish(true);
    }, 200);

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${ADSGRAM_SCRIPT_SRC}"]`
    );

    const onLoad = () => finish(!!window.Adsgram);
    const onError = () => finish(false);

    if (existingScript) {
      existingScript.addEventListener("load", onLoad, { once: true });
      existingScript.addEventListener("error", onError, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = ADSGRAM_SCRIPT_SRC;
      script.async = true;
      script.addEventListener("load", onLoad, { once: true });
      script.addEventListener("error", onError, { once: true });
      document.head.appendChild(script);
    }

    window.setTimeout(() => finish(!!window.Adsgram), timeoutMs);
  });
}

function getInitData() {
  const tg = (window as any).Telegram?.WebApp;
  return tg?.initData || "";
}

function isSmartAdTask(task: ServerTask) {
  return String(task.task_type || "").toLowerCase() === "smart_ad";
}



function isAdsGramTask(task: ServerTask) {
  return String(task.task_type || "").toLowerCase() === "adsgram";
}

function isGigaPubTask(task: ServerTask) {
  return String(task.task_type || "").toLowerCase() === "giga_pub";
}

function isJoinBotTask(task: ServerTask) {
  return String(task.task_type || "").toLowerCase() === "join_bot";
}

type TaskCategory = "ads" | "join_channel" | "bots" | "other";

function getTaskCategory(task: ServerTask): TaskCategory {
  const type = String(task.task_type || "").toLowerCase();
  if (type === "join_channel") return "join_channel";
  if (type === "join_bot") return "bots";
  if (["adsgram", "smart_ad", "ads_galaxy", "giga_pub", "watch_ad"].includes(type)) return "ads";
  return "other";
}

function getClaimDelayMs(task: ServerTask) {
  if (isSmartAdTask(task)) return SMART_AD_CLAIM_DELAY_MS;
  if (isAdsGramTask(task)) return ADSGRAM_CLAIM_DELAY_MS;
  if (isGigaPubTask(task)) return GIGA_PUB_CLAIM_DELAY_MS;
  return CLAIM_DELAY_MS;
}

function TaskIcon() {
  return (
    <svg viewBox="0 0 24 24" className="task-svg" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 12h8M8 8h4M8 16h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CoinsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="hero-svg" aria-hidden="true">
      <circle cx="9" cy="9" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="15" cy="15" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 6.6v4.8M6.6 9h4.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export default function Tasks({ onRewardCoins }: Props) {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<"all" | "ads" | "join_channel" | "bots">("all");
  const [toast, setToast] = useState("");
  const [serverTasks, setServerTasks] = useState<ServerTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  // مصدر الحقيقة الوحيد لتقدّم المهام هو السيرفر - يتعبى من رد
  // /api/tasks/list (تحقّق تحت) وبعد كل claim ناجح، مو من أي كاش
  // محلي. لو الصفحة تفتح من جديد أو من جهاز ثاني، الرقم يطلع صح
  // من أول لحظة بدل ما يضل يعرض قيمة قديمة لين يصير خطأ.
  const [progressById, setProgressById] = useState<ProgressMap>({});
  const [openedAtById, setOpenedAtById] = useState<OpenedMap>({});
  const [openingIds, setOpeningIds] = useState<Record<string, boolean>>({});
  const [claimingIds, setClaimingIds] = useState<Record<string, boolean>>({});
  const claimTimersRef = useRef<Record<string, number>>({});
  const adsgramControllerRef = useRef<AdsgramController | null>(null);

  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); }, []);


  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const ids: (string | number)[] = Array.isArray(detail) ? detail : [];
      if (ids.length === 0) return;

      setProgressById((prev) => {
        const next = { ...prev };
        for (const id of ids) {
          delete next[String(id)];
        }
        return next;
      });
    };

    window.addEventListener("sly:channel-tasks-reset", handler);
    return () => window.removeEventListener("sly:channel-tasks-reset", handler);
  }, []);

  useEffect(() => {
    const initData = getInitData();
    fetch("/api/tasks/list", {
      headers: { Authorization: `tga ${initData}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.tasks)) {
          setServerTasks(data.tasks);

          // نبني تقدّم كل مهمة من رد السيرفر مباشرة - هذا يصير مصدر
          // الحقيقة الوحيد من أول تحميل للصفحة، مو بس بعد أول رفض.
          setProgressById((prev) => {
            const next: ProgressMap = { ...prev };
            for (const task of data.tasks as ServerTask[]) {
              const id = String(task.id);
              next[id] = {
                completed: Number(task.completed ?? 0),
                max_completions: Math.max(1, Number(task.max_completions || 1)),
              };
            }
            return next;
          });
        } else {
          setServerTasks([]);
        }
      })
      .catch(() => setServerTasks([]))
      .finally(() => setLoadingTasks(false));
  }, []);

  const postTaskAction = async (body: Record<string, unknown>) => {
    const initData = getInitData();
    const res = await fetch("/api/tasks/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `tga ${initData}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || t("tasks.failedToProcessTask"));
    return data;
  };

  const clearClaimTimer = (id: string) => {
    const handle = claimTimersRef.current[id];
    if (handle) { window.clearTimeout(handle); delete claimTimersRef.current[id]; }
  };

  const handleClaimServerTask = async (task: ServerTask) => {
    const id = String(task.id);
    if (claimingIds[id]) return;
    const openedAt = openedAtById[id];
    const claimDelayMs = getClaimDelayMs(task);
    if (!openedAt) return;
    if (Date.now() - openedAt < claimDelayMs) return;
    const current = progressById[id] || { completed: 0, max_completions: Math.max(1, Number(task.max_completions || 1)) };
    if (current.completed >= current.max_completions) return;

    setClaimingIds((prev) => ({ ...prev, [id]: true }));
    try {
      const data = await postTaskAction({ taskId: task.id });
      const nextCompleted = Number(data.progress?.completed ?? current.completed + 1);
      const nextMax = Number(data.progress?.max_completions ?? current.max_completions);
      const reward = Number(data.reward ?? task.reward ?? 0);
      setProgressById((prev) => ({ ...prev, [id]: { completed: nextCompleted, max_completions: nextMax } }));
      setOpenedAtById((prev) => { const copy = { ...prev }; delete copy[id]; return copy; });
      onRewardCoins(
        reward,
        task.title,
        t("tasks.taskProgressMeta", { completed: nextCompleted, max: nextMax, reward })
      );
      setToast(t("tasks.coinsRewardToast", { amount: reward }));
    } catch (err: any) {
      setToast(err?.message || t("tasks.failedToVerifyTask"));
    } finally {
      clearClaimTimer(id);
      setClaimingIds((prev) => { const copy = { ...prev }; delete copy[id]; return copy; });
    }
  };

  const scheduleAutoClaim = (task: ServerTask, openedAt: number) => {
    const id = String(task.id);
    clearClaimTimer(id);
    const delayMs = getClaimDelayMs(task);
    const remaining = Math.max(0, delayMs - (Date.now() - openedAt));
    claimTimersRef.current[id] = window.setTimeout(() => {
      delete claimTimersRef.current[id];
      handleClaimServerTask(task);
    }, remaining);
  };

  useEffect(() => {
    Object.entries(openedAtById).forEach(([id, openedAt]) => {
      if (claimTimersRef.current[id]) return;
      const task = serverTasks.find((t) => String(t.id) === id);
      if (!task) return;
      const progress = progressById[id] || { completed: 0, max_completions: Math.max(1, Number(task.max_completions || 1)) };
      if (progress.completed >= progress.max_completions) return;
      scheduleAutoClaim(task, openedAt);
    });
  }, [serverTasks, openedAtById, progressById]);

  useEffect(() => {
    return () => {
      Object.values(claimTimersRef.current).forEach((handle) => window.clearTimeout(handle));
      claimTimersRef.current = {};
    };
  }, []);

  const handleOpenTask = async (task: ServerTask) => {
    const id = String(task.id);
    if (openingIds[id]) return;
    const progress = progressById[id] || { completed: 0, max_completions: Math.max(1, Number(task.max_completions || 1)) };
    if (progress.completed >= progress.max_completions) { setToast(t("tasks.taskLimitReached")); return; }

    const taskType = String(task.task_type || "").toLowerCase();
    const allowedTypes = ["normal", "smart_ad", "ads_galaxy", "join_channel", "custom", "giga_pub", "adsgram"];
    if (!allowedTypes.includes(taskType)) {
      setToast(t("tasks.invalidTaskType"));
      return;
    }

    setOpeningIds((prev) => ({ ...prev, [id]: true }));

    try {
      // معالجة AdsGram
      if (isAdsGramTask(task)) {
        if (!adsgramControllerRef.current) {
          const loaded = window.Adsgram ? true : await waitForAdsgramScript();
          if (loaded && window.Adsgram && !adsgramControllerRef.current) {
            adsgramControllerRef.current = window.Adsgram.init({ blockId: ADSGRAM_TASK_BLOCK_ID });
          }
        }
        if (!adsgramControllerRef.current) {
          setToast(t("tasks.adsgramNotReady"));
          return;
        }
        if (!tryAcquireGlobalAdLock()) {
          setToast(t("tasks.pleaseWaitSeconds", { seconds: getAdLockWaitSeconds() }));
          return;
        }

        try {
          await adsgramControllerRef.current.show();
        } catch (err: any) {
          setToast(err?.message || t("tasks.adFailedToLoad"));
          return;
        } finally {
          releaseGlobalAdLock();
        }

        await postTaskAction({ taskId: task.id, action: "open" });
        const openedAt = Date.now();
        setOpenedAtById((prev) => ({ ...prev, [id]: openedAt }));
        scheduleAutoClaim(task, openedAt);
        setToast(t("tasks.adWatchedClaiming"));
        return;
      }

      // معالجة GigaPub
      if (isGigaPubTask(task)) {
        if (typeof window.showGiga !== "function") {
          setToast(t("tasks.gigaPubNotReady"));
          return;
        }
        if (!tryAcquireGlobalAdLock()) {
          setToast(t("tasks.pleaseWaitSeconds", { seconds: getAdLockWaitSeconds() }));
          return;
        }

        try {
          await window.showGiga();
        } catch (err: any) {
          setToast(err?.message || t("tasks.adFailedToLoad"));
          return;
        } finally {
          releaseGlobalAdLock();
        }

        await postTaskAction({ taskId: task.id, action: "open" });
        const openedAt = Date.now();
        setOpenedAtById((prev) => ({ ...prev, [id]: openedAt }));
        scheduleAutoClaim(task, openedAt);
        setToast(t("tasks.adWatchedClaiming"));
        return;
      }

      // المهام العادية (مع رابط)
      const url = String(task.url || "").trim();
      if (!url) { setToast(t("tasks.taskNoUrl")); return; }

      await postTaskAction({ taskId: task.id, action: "open" });
      window.open(url, "_blank", "noopener,noreferrer");
      const openedAt = Date.now();
      setOpenedAtById((prev) => ({ ...prev, [id]: openedAt }));
      scheduleAutoClaim(task, openedAt);
      const waitSeconds = getClaimDelayMs(task) / 1000;
      setToast(t("tasks.openedSendingIn", { seconds: waitSeconds }));
    } catch (err: any) {
      setToast(err?.message || t("tasks.failedToOpenTask"));
    } finally {
      setOpeningIds((prev) => { const copy = { ...prev }; delete copy[id]; return copy; });
    }
  };

  return (
    <section className="tasks-page">
      {toast ? <div className="tasks-toast">{toast}</div> : null}
      <section className="tasks-hero">
        <div className="tasks-hero-icon"><CoinsIcon /></div>
        <div className="tasks-hero-text"><h1>{t("tasks.heroTitle")}</h1><p>{t("tasks.heroSubtitle")}</p></div>
      </section>

      <div className="task-category-tabs">
        {([
          { key: "all", label: t("tasks.tabAll"), count: serverTasks.length },
          { key: "ads", label: t("tasks.tabAds"), count: serverTasks.filter((t) => getTaskCategory(t) === "ads").length },
          { key: "join_channel", label: t("tasks.tabJoinChannel"), count: serverTasks.filter((t) => getTaskCategory(t) === "join_channel").length },
          { key: "bots", label: t("tasks.tabBots"), count: serverTasks.filter((t) => getTaskCategory(t) === "bots").length },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`task-category-tab ${activeCategory === tab.key ? "active" : ""}`}
            onClick={() => setActiveCategory(tab.key)}
          >
            {tab.label}
            <span className="task-category-count">{tab.count}</span>
          </button>
        ))}
      </div>

      <section className="task-strip">
        {loadingTasks ? (
          <div className="task-empty">{t("tasks.loadingTasks")}</div>
        ) : serverTasks.length === 0 ? (
          <div className="task-empty">{t("tasks.noTasks")}</div>
        ) : (
          serverTasks
            .filter((task) => activeCategory === "all" || getTaskCategory(task) === activeCategory)
            .map((task) => {
            const id = String(task.id);
            const isSmartAd = isSmartAdTask(task);
            const isAdsGram = isAdsGramTask(task);
            const isGigaPub = isGigaPubTask(task);
            const claimDelayMs = getClaimDelayMs(task);
            const progress = progressById[id] || { completed: 0, max_completions: Math.max(1, Number(task.max_completions || 1)) };
            const openedAt = openedAtById[id];
            const opened = Boolean(openedAt);
            const waitedEnough = opened && Date.now() - openedAt >= claimDelayMs;
            const claimedAll = progress.completed >= progress.max_completions;
            const opening = Boolean(openingIds[id]);
            const claiming = Boolean(claimingIds[id]);


            const isJoinBot = isJoinBotTask(task);

            let taskTypeLabel = task.task_type || t("tasks.typeTask");
            if (isSmartAd) taskTypeLabel = t("tasks.typeSmartAd");
            else if (isAdsGram) taskTypeLabel = t("tasks.typeAdsGram");
            else if (isGigaPub) taskTypeLabel = t("tasks.typeGigaPub");

            return (
              <article key={id} className={`task-row ${claimedAll ? "done" : ""}`}>
                <div className="task-icon channel"><TaskIcon /></div>
                <div className="task-main">
                  <div className="task-topline">
                    <div>
                      <p className="task-type">{taskTypeLabel}</p>
                      <h2>{task.title}</h2>
                    </div>
                    <strong className="task-reward">+{Number(task.reward || 0)}</strong>
                  </div>
                  <div className="task-mini-status">
                    {claimedAll ? (
                      <span className="green">{t("tasks.completed")}</span>
                    ) : !opened ? (
                      <span className="gray">{isAdsGram || isGigaPub ? t("tasks.watchAdToEarn") : t("tasks.openLinkFirst")}</span>
                    ) : !waitedEnough ? (
                      <span className="blue">{t("tasks.sendingCoinsIn", { seconds: Math.ceil((claimDelayMs - (Date.now() - openedAt)) / 1000) })}</span>
                    ) : (
                      <span className="green">{claiming ? t("tasks.verifying") : t("tasks.readyProgress", { completed: progress.completed, max: progress.max_completions })}</span>
                    )}
                  </div>
                  {isJoinBot ? (
                    <div className="task-note">
                      {t("tasks.botJoinNote")}
                    </div>
                  ) : null}
                </div>
                <div className="task-actions">
                  <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 600, color: "#9ca3af", marginBottom: "6px", paddingRight: "6px", letterSpacing: "0.5px" }}>
                    <span style={{ color: "#fff" }}>{progress.completed}</span> <span style={{ opacity: 0.5 }}> / {progress.max_completions}</span>
                  </div>
                  <button type="button" className="task-btn join" onClick={() => handleOpenTask(task)} disabled={opening || claimedAll}>
                    {opening
                      ? (isAdsGram || isGigaPub ? t("tasks.loadingAdAction") : t("tasks.openingAction"))
                      : (isAdsGram || isGigaPub ? t("tasks.watchAdAction") : t("tasks.openAction"))}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>
    </section>
  );
}

SLYEOF

mkdir -p "$(dirname "src/pages/Referrals.tsx")"
cat > "src/pages/Referrals.tsx" << 'SLYEOF'
import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";

interface ReferralsProps {
  telegramId: string;
  referralsCount: number;
  referralRewardUsdt: number;
  referralRequiredTasks: number;
}

export default function Referrals({
  telegramId,
  referralsCount,
  referralRewardUsdt,
  referralRequiredTasks,
}: ReferralsProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const botUsername = "SLYMintX_bot";
  const appShortName = "start";
  const referralLink = telegramId
    ? `https://t.me/${botUsername}/${appShortName}?startapp=ref_${telegramId}`
    : "";

  const handleCopy = () => {
    if (!referralLink) return;

    navigator.clipboard.writeText(referralLink);
    setCopied(true);

    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      style={{
        padding: "6px 0",
        color: "#eaf4f2",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          padding: 18,
          borderRadius: 22,
          background: "#141b1c",
          border: "1px solid rgba(255,255,255,.06)",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 28 }}>{t("referrals.title")}</h2>

        <p
          style={{
            marginTop: 8,
            color: "#8fa19e",
            lineHeight: 1.6,
          }}
        >
          {t("referrals.description", {
            tasks: referralRequiredTasks,
            reward: referralRewardUsdt,
          })}
        </p>

        <div style={{ marginTop: 20 }}>
          <div
            style={{
              background: "#1b2324",
              padding: 14,
              borderRadius: 14,
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 14, color: "#8fa19e" }}>
              {t("referrals.qualifiedReferrals")}
            </span>

            <div
              style={{
                fontSize: 24,
                fontWeight: "bold",
                marginTop: 4,
                color: "#54e6d4",
              }}
            >
              {referralsCount}
            </div>
          </div>

          <div
            style={{
              background: "rgba(84,230,212,.06)",
              border: "1px solid rgba(84,230,212,.12)",
              padding: 14,
              borderRadius: 14,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: "#eaf4f2" }}>
              {t("referrals.requirementTitle")}
            </div>

            <div
              style={{
                marginTop: 6,
                fontSize: 13,
                color: "#8fa19e",
                lineHeight: 1.6,
              }}
            >
              {t("referrals.requirementBody", { tasks: referralRequiredTasks })}
            </div>

            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                color: "#72817e",
                lineHeight: 1.5,
              }}
            >
              {t("referrals.requirementExample", { tasks: referralRequiredTasks })}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 13,
                color: "#8fa19e",
                display: "block",
                marginBottom: 6,
              }}
            >
              {t("referrals.linkLabel")}
            </label>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                readOnly
                value={referralLink}
                placeholder={telegramId ? "" : t("referrals.linkUnavailable")}
                style={{
                  flex: 1,
                  background: "#101516",
                  border: "1px solid rgba(255,255,255,.08)",
                  borderRadius: 12,
                  padding: "10px 14px",
                  color: "#eaf4f2",
                  fontSize: 13,
                  outline: "none",
                }}
              />

              <button
                onClick={handleCopy}
                disabled={!referralLink}
                style={{
                  background: !referralLink
                    ? "rgba(84,230,212,0.30)"
                    : "#54e6d4",
                  color: "#06201c",
                  border: "none",
                  borderRadius: 12,
                  padding: "0 18px",
                  fontWeight: "bold",
                  cursor: !referralLink ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                }}
              >
                {copied ? t("referrals.copied") : t("referrals.copy")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

SLYEOF

mkdir -p "$(dirname "src/pages/Stars.tsx")"
cat > "src/pages/Stars.tsx" << 'SLYEOF'
import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import "../styles/stars.css";

type StarPlayer = {
  rank: number;
  telegramId: string;
  name: string;
  photoUrl: string | null;
  minutes: number;
  seconds: number;
};

function StarIcon({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id="starsGoldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff3c4" />
          <stop offset="45%" stopColor="#ffcf4d" />
          <stop offset="100%" stopColor="#b8860b" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.8 14.6 9l6.6.5-5 4.4 1.6 6.4L12 16.9 6.2 20.3l1.6-6.4-5-4.4L9.4 9 12 2.8Z"
        fill="url(#starsGoldGrad)"
        stroke="#7a5c00"
        strokeWidth="0.6"
      />
    </svg>
  );
}

function StarRain({ count = 22 }: { count?: number }) {
  return (
    <div className="stars-rain" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => {
        const size = 5 + (i % 4) * 2;
        const left = (i * 9.3 + (i % 6) * 7) % 100;
        const drift = ((i * 13) % 26) - 13;
        const duration = 16 + (i % 7) * 2.6;
        const delay = -((i * 3.1) % duration);
        const opacity = 0.12 + (i % 5) * 0.05;

        return (
          <StarIcon
            key={i}
            className="stars-rain-star"
            style={
              {
                left: `${left}%`,
                width: size,
                height: size,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
                "--rain-drift": `${drift}px`,
                "--rain-opacity": opacity,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

function formatCountdown(msRemaining: number) {
  if (msRemaining <= 0) return "0m";
  const totalMinutes = Math.ceil(msRemaining / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function initialOf(name: string) {
  const clean = name.replace("@", "").trim();
  return clean.length ? clean[0].toUpperCase() : "?";
}

function Avatar({ player, size }: { player: StarPlayer; size: number }) {
  return (
    <div
      className="stars-avatar"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {player.photoUrl ? (
        <img src={player.photoUrl} alt={player.name} />
      ) : (
        <span>{initialOf(player.name)}</span>
      )}
    </div>
  );
}

function PodiumSpot({ player, place }: { player: StarPlayer; place: 1 | 2 | 3 }) {
  const size = place === 1 ? 76 : 60;

  return (
    <div className={`podium-spot podium-spot-${place}`}>
      {place === 1 && <div className="podium-crown">👑</div>}

      <div className="podium-avatar-wrap">
        <Avatar player={player} size={size} />
        <div className="podium-rank-badge">
          <StarIcon className="podium-rank-star" />
          <span>{place}</span>
        </div>
      </div>

      <div className="podium-name">{player.name}</div>
      <div className="podium-time">{formatTime(player.seconds)}</div>

      <div className="podium-pillar">
        <span>{place}</span>
      </div>
    </div>
  );
}

export default function Stars({
  telegramId = "",
  adBusy = false,
  useBusy = false,
  adBatchCount = 0,
  adsRequired = 20,
  cycleUnlocksAt = null,
  adToast = "",
  onWatchAd,
  onUseBalance,
}: {
  telegramId?: string;
  adBusy?: boolean;
  useBusy?: boolean;
  adBatchCount?: number;
  adsRequired?: number;
  cycleUnlocksAt?: string | null;
  adToast?: string;
  onWatchAd?: () => void;
  onUseBalance?: () => void;
}) {
  const { t } = useLanguage();
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const unlocksAtMs = cycleUnlocksAt ? new Date(cycleUnlocksAt).getTime() : null;
  const isLocked = unlocksAtMs !== null && !Number.isNaN(unlocksAtMs) && unlocksAtMs > nowTick;
  const [players, setPlayers] = useState<StarPlayer[]>([]);
  const [myRank, setMyRank] = useState<StarPlayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const query = telegramId
          ? `/api/leaderboard?type=stars&telegramId=${encodeURIComponent(telegramId)}`
          : "/api/leaderboard?type=stars";

        const res = await fetch(query);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || t("stars.failedToLoad"));
        }

        if (!cancelled) {
          setPlayers(Array.isArray(data?.list) ? data.list : []);
          setMyRank(data?.me || null);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || t("stars.failedToLoad"));
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [telegramId]);

  const first = players.find((p) => p.rank === 1);
  const second = players.find((p) => p.rank === 2);
  const third = players.find((p) => p.rank === 3);
  const rest = players.filter((p) => p.rank > 3);

  return (
    <section className="stars-page">
      <StarRain count={22} />
      <div className="stars-page-content">
      <div className="stars-hero">
        <h2>{t("stars.title")}</h2>
        <p>
          {t("stars.intro", { low: "50", high: "500" })}{" "}
          <StarIcon className="stars-inline-icon" />
        </p>
        <p className="stars-hero-sub">
          {t("stars.introSub", { low: "15", high: "50" })}{" "}
          <StarIcon className="stars-inline-icon" />
        </p>

        {myRank && myRank.rank > 10 && (
          <div className="stars-hero-myrank">
            <StarIcon className="stars-hero-myrank-icon" />
            <span>{t("stars.yourRank", { rank: myRank.rank })}</span>
          </div>
        )}

        <div className="stars-ad-card">
          <h3 className="stars-ad-card-title">{t("stars.watchAdsCardTitle")}</h3>

          {isLocked ? (
            <div className="stars-ad-locked">
              <div className="stars-ad-locked-dot" />
              <p className="stars-ad-card-sub">
                {t("stars.cycleRunning")}
              </p>
              <div className="stars-ad-timer-badge">
                {t("stars.unlocksIn", { time: formatCountdown((unlocksAtMs as number) - nowTick) })}
              </div>
            </div>
          ) : (
            <>
              <p className="stars-ad-card-sub">
                {t("stars.watchAdsToUnlock", {
                  count: adsRequired,
                  time: formatCountdown(2 * 60 * 60 * 1000),
                })}
              </p>
              <div className="stars-ad-progress">
                <div
                  className="stars-ad-progress-fill"
                  style={{
                    width: `${Math.min(100, (adBatchCount / adsRequired) * 100)}%`,
                  }}
                />
              </div>
              <div className="stars-ad-progress-label">
                {t("stars.adsWatched", { count: adBatchCount, required: adsRequired })}
              </div>

              {onUseBalance && adBatchCount > 0 && (
                <div className="stars-balance-info">
                  {t("stars.balanceReady", {
                    count: adBatchCount,
                    time: formatCountdown(adBatchCount * 5 * 60 * 1000),
                  })}
                </div>
              )}

              <div className="stars-ad-actions">
                <button className="stars-ad-btn" onClick={onWatchAd} disabled={adBusy}>
                  {adBusy ? t("stars.loadingEllipsis") : t("stars.watchAd")}
                </button>
                {onUseBalance && (
                  <button
                    className="stars-ad-btn stars-ad-btn-outline"
                    onClick={onUseBalance}
                    disabled={useBusy || adBatchCount <= 0}
                  >
                    {useBusy
                      ? t("stars.loadingEllipsis")
                      : adBatchCount > 0
                        ? t("stars.useBalanceCount", { count: adBatchCount })
                        : t("stars.useBalance")}
                  </button>
                )}
              </div>
              {adBusy && (
                <div className="stars-ad-hint">
                  {t("stars.takingAWhile")}
                </div>
              )}
            </>
          )}

          {adToast && <div className="stars-ad-toast">{adToast}</div>}
        </div>
      </div>

      {loading && <div className="stars-status">{t("stars.loadingLeaderboard")}</div>}

      {!loading && error && <div className="stars-status stars-error">{error}</div>}

      {!loading && !error && players.length === 0 && (
        <div className="stars-status">{t("stars.noActivityThisWeek")}</div>
      )}

      {!loading && !error && players.length > 0 && (
        <>
          {(first || second || third) && (
            <div className="podium">
              {third ? (
                <PodiumSpot player={third} place={3} />
              ) : (
                <div className="podium-spot podium-spot-3 podium-empty" />
              )}

              {first ? (
                <PodiumSpot player={first} place={1} />
              ) : (
                <div className="podium-spot podium-spot-1 podium-empty" />
              )}

              {second ? (
                <PodiumSpot player={second} place={2} />
              ) : (
                <div className="podium-spot podium-spot-2 podium-empty" />
              )}
            </div>
          )}

          {rest.length > 0 && (
            <div className="stars-list">
              {rest.map((player) => {
                const isPrizeRank = player.rank === 4 || player.rank === 5;
                return (
                  <div
                    className={`stars-row${isPrizeRank ? " stars-row-prize" : ""}`}
                    key={player.telegramId}
                  >
                    <span className="stars-row-rank">
                      {player.rank}
                      {isPrizeRank && (
                        <StarIcon className="stars-row-prize-star" />
                      )}
                    </span>
                    <Avatar player={player} size={38} />
                    <span className="stars-row-name">{player.name}</span>
                    <span className="stars-row-time">{formatTime(player.seconds)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <div className="stars-footer">
        <StarIcon className="stars-footer-icon" />
        <span>{t("stars.footerNote")}</span>
      </div>
      </div>
    </section>
  );
}

SLYEOF

mkdir -p "$(dirname "src/pages/Games.tsx")"
cat > "src/pages/Games.tsx" << 'SLYEOF'
import { useLanguage } from "../i18n/LanguageContext";
import "../styles/games.css";

type Props = {
  attemptsRemaining: number;
  freeAttempts: number;
  bonusAttempts: number;
  adBusy: boolean;
  playBusy: boolean;
  adToast: string;
  onWatchAd: () => void;
  onPlay: () => void;
};

function AttemptDots({ remaining, total }: { remaining: number; total: number }) {
  const capped = Math.min(total, 10);
  return (
    <div className="games-attempt-dots" aria-hidden="true">
      {Array.from({ length: capped }).map((_, i) => (
        <span
          key={i}
          className={`games-attempt-dot${i < remaining ? " filled" : ""}`}
        />
      ))}
    </div>
  );
}

export default function Games({
  attemptsRemaining,
  freeAttempts,
  bonusAttempts,
  adBusy,
  playBusy,
  adToast,
  onWatchAd,
  onPlay,
}: Props) {
  const { t } = useLanguage();
  const totalToday = freeAttempts + bonusAttempts;
  const outOfAttempts = attemptsRemaining <= 0;

  return (
    <section className="games-page">
      <header className="games-header">
        <p className="games-eyebrow">{t("games.eyebrow")}</p>
        <h2>{t("games.title")}</h2>
        <span className="games-subtitle">
          {t("games.subtitle")}
        </span>
      </header>

      <div className="games-attempts-card">
        <div className="games-attempts-top">
          <div className="games-attempts-count">
            <strong>{attemptsRemaining}</strong>
            <span>{t("games.attemptsLeft")}</span>
          </div>
          <AttemptDots remaining={attemptsRemaining} total={Math.max(totalToday, freeAttempts)} />
        </div>

        <div className="games-attempts-breakdown">
          <span>{t("games.freeCount", { count: freeAttempts })}</span>
          <span className="dot-sep">•</span>
          <span>{t("games.bonusCount", { count: bonusAttempts })}</span>
        </div>

        <button
          className="games-watch-ad-btn"
          onClick={onWatchAd}
          disabled={adBusy}
        >
          {adBusy ? t("games.loadingAd") : t("games.watchAdBonus")}
        </button>

        {adToast ? <div className="games-ad-toast">{adToast}</div> : null}
      </div>

      <div className="games-list">
        <div className="game-card">
          <div className="game-card-art" aria-hidden="true">
            <div className="game-card-star s1" />
            <div className="game-card-star s2" />
            <div className="game-card-star s3" />
            <div className="game-card-planet" />
            <div className="game-card-ship">
              <div className="game-card-ship-body" />
              <div className="game-card-ship-flame" />
            </div>
            <div className="game-card-rock r1" />
            <div className="game-card-rock r2" />
          </div>

          <div className="game-card-info">
            <h3>{t("games.laserEscapeTitle")}</h3>
            <p>{t("games.laserEscapeDesc")}</p>

            <div className="game-card-meta">
              <span className="game-card-chip gold">{t("games.coinsPerWave")}</span>
              <span className="game-card-chip">{t("games.lives")}</span>
            </div>
          </div>

          <button
            className="game-card-play"
            onClick={onPlay}
            disabled={outOfAttempts || playBusy}
          >
            {playBusy ? "..." : outOfAttempts ? t("games.noAttemptsLeft") : t("games.playNow")}
          </button>
        </div>

        <div className="game-card game-card-soon">
          <div className="game-card-soon-badge">{t("games.comingSoon")}</div>
          <p>{t("games.comingSoonDesc")}</p>
        </div>
      </div>
    </section>
  );
}

SLYEOF

mkdir -p "$(dirname "src/pages/Profile.tsx")"
cat > "src/pages/Profile.tsx" << 'SLYEOF'
import { useEffect, useMemo, useState } from "react";
import UiIcons from "../components/UiIcons";
import LanguageSwitch from "../components/LanguageSwitch";
import { useLanguage } from "../i18n/LanguageContext";
import "../styles/profile.css";

type ActivityTone = "info" | "reward" | "exchange";

type Activity = {
  id: string;
  title: string;
  meta: string;
  tone: ActivityTone;
};

type WithdrawalHistoryEntry = {
  id: number;
  amount: number;
  method: "binance" | "bnb";
  target: string | null;
  bnbAmount: number | null;
  status: "pending" | "completed" | "rejected";
  createdAt: string;
};

type Props = {
  lifetimeCoins: number;
  lifetimeSpent: number;
  usdtBalance: number;
  activities: Activity[];
  serverWalletAddress?: string | null;
  withdrawalHistory?: WithdrawalHistoryEntry[];
  onOpenExchange: () => void;
  onOpenWithdraw: () => void;
  onWalletConnected?: (address: string) => void;
  onWalletDisconnected?: () => void;
};

const WALLET_STORAGE_KEY = "sly.wallet.bep20.v1";
const TON_ADDRESS_PATTERN = /^(-?[0-9]:[a-fA-F0-9]{64}|[A-Za-z0-9_-]{48})$/;

function loadStoredAddress(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(WALLET_STORAGE_KEY);
    return raw && TON_ADDRESS_PATTERN.test(raw) ? raw : null;
  } catch {
    return null;
  }
}

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatHistoryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatHistoryTarget(entry: {
  method: "binance" | "bnb";
  target: string | null;
}) {
  if (!entry.target) return "—";

  return entry.method === "bnb" && entry.target.length > 16
    ? truncateAddress(entry.target)
    : entry.target;
}

export default function Profile({
  lifetimeCoins,
  lifetimeSpent,
  usdtBalance,
  serverWalletAddress,
  withdrawalHistory,
  onOpenExchange,
  onOpenWithdraw,
  onWalletConnected,
  onWalletDisconnected,
}: Props) {
  const { t } = useLanguage();

  const STATUS_LABELS: Record<string, string> = {
    pending: t("profile.statusPending"),
    completed: t("profile.statusApproved"),
    rejected: t("profile.statusRejected"),
  };

  const [connectedAddress, setConnectedAddress] = useState<string | null>(() =>
    serverWalletAddress ?? loadStoredAddress()
  );
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const usdApprox = useMemo(() => `≈ $${usdtBalance.toFixed(2)}`, [usdtBalance]);

  const syncWalletToServer = async (address: string | null) => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData || "";

      await fetch("/api/profile/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `tga ${initData}`,
        },
        body: JSON.stringify({ walletAddress: address }),
      });
    } catch (err) {
      console.error("Failed to sync wallet with server", err);
    }
  };

  const handleConnect = () => {
    const trimmed = inputValue.trim();

    if (!trimmed) {
      setError(t("profile.errorEmptyAddress"));
      return;
    }

    if (!TON_ADDRESS_PATTERN.test(trimmed)) {
      setError(t("profile.errorInvalidAddress"));
      return;
    }

    try {
      window.localStorage.setItem(WALLET_STORAGE_KEY, trimmed);
    } catch {}

    setConnectedAddress(trimmed);
    setInputValue("");
    setError("");
    syncWalletToServer(trimmed);
    onWalletConnected?.(trimmed);
  };

  const handleDisconnect = () => {
    try {
      window.localStorage.removeItem(WALLET_STORAGE_KEY);
    } catch {}

    setConnectedAddress(null);
    setConfirmingDisconnect(false);
    syncWalletToServer(null);
    onWalletDisconnected?.();
  };

  const handleCopy = async () => {
    if (!connectedAddress) return;
    try {
      await navigator.clipboard.writeText(connectedAddress);
      setCopied(true);
    } catch {}
  };

  return (
    <section className="profile-page">
      <section className="wallet-hero">
        <div className="wallet-hero-top">
          <div>
            <p className="wallet-kicker">{t("profile.walletCenter")}</p>
            <h1>{connectedAddress ? t("profile.walletConnected") : t("profile.connectWallet")}</h1>
            <p className="wallet-lead">
              {t("profile.walletLead")}
            </p>
          </div>

          <span className="wallet-chip">
            <span className="wallet-chip-dot" />
            TON
          </span>
        </div>

        {connectedAddress ? (
          <div className="wallet-connected">
            <div className="wallet-address-row">
              <div className="wallet-address-info">
                <span className="wallet-address-label">{t("profile.connectedAddress")}</span>
                <strong className="wallet-address-value">
                  {truncateAddress(connectedAddress)}
                </strong>
              </div>

              <div className="wallet-address-actions">
                <button className="wallet-icon-btn" onClick={handleCopy} type="button">
                  {copied ? t("profile.copied") : t("profile.copy")}
                </button>
                <button
                  className="wallet-icon-btn danger"
                  onClick={() => setConfirmingDisconnect(true)}
                  type="button"
                >
                  {t("profile.disconnect")}
                </button>
              </div>
            </div>

            {confirmingDisconnect && (
              <div className="wallet-confirm">
                <span>{t("profile.disconnectConfirm")}</span>
                <div className="wallet-confirm-actions">
                  <button
                    className="wallet-confirm-btn ghost"
                    onClick={() => setConfirmingDisconnect(false)}
                    type="button"
                  >
                    {t("profile.cancel")}
                  </button>
                  <button
                    className="wallet-confirm-btn danger"
                    onClick={handleDisconnect}
                    type="button"
                  >
                    {t("profile.disconnect")}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="wallet-connect-form">
            <div className="wallet-input-row">
              <input
                className="wallet-input"
                placeholder={t("profile.walletPlaceholder")}
                value={inputValue}
                onChange={(event) => {
                  setInputValue(event.target.value);
                  if (error) setError("");
                }}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
              />
              <button className="wallet-connect-btn" onClick={handleConnect} type="button">
                {t("profile.connect")}
              </button>
            </div>

            {error ? <span className="wallet-error">{error}</span> : null}
          </div>
        )}
      </section>

      <section className="stats-bar">
        <div className="stats-bar-item">
          <span className="stats-bar-icon gold">
            <UiIcons name="coins" className="stats-bar-svg" />
          </span>
          <div className="stats-bar-text">
            <strong>{lifetimeCoins.toLocaleString()}</strong>
            <small>{t("profile.earned")}</small>
          </div>
        </div>

        <div className="stats-bar-divider" />

        <div className="stats-bar-item">
          <span className="stats-bar-icon teal">
            <UiIcons name="coins" className="stats-bar-svg" />
          </span>
          <div className="stats-bar-text">
            <strong>{lifetimeSpent.toLocaleString()}</strong>
            <small>{t("profile.exchanged")}</small>
          </div>
        </div>

        <div className="stats-bar-divider" />

        <div className="stats-bar-item">
          <span className="stats-bar-icon teal">
            <UiIcons name="exchange" className="stats-bar-svg" />
          </span>
          <div className="stats-bar-text">
            <strong>{usdtBalance.toFixed(4)}</strong>
            <small>{t("profile.usdt")}</small>
          </div>
        </div>
      </section>

      <p className="usdt-approx">{usdApprox}</p>

      <section className="profile-actions">
        <button className="profile-action primary" onClick={onOpenExchange}>
          <UiIcons name="exchange" className="profile-action-icon" />
          <span>{t("profile.exchangeCoins")}</span>
        </button>

        <button className="profile-action ghost" onClick={onOpenWithdraw}>
          <UiIcons name="withdraw" className="profile-action-icon" />
          <span>{t("profile.withdrawUsdt")}</span>
        </button>
      </section>

      <LanguageSwitch />

      <section className="withdraw-history-card">
        <div className="withdraw-history-head">
          <div>
            <p>{t("profile.yourRequests")}</p>
            <h2>{t("profile.withdrawalHistory")}</h2>
          </div>
          <UiIcons name="withdraw" className="withdraw-history-head-icon" />
        </div>

        <div className="withdraw-history-list">
          {!withdrawalHistory || withdrawalHistory.length === 0 ? (
            <div className="withdraw-history-empty">
              {t("profile.noWithdrawalsYet")}
            </div>
          ) : (
            withdrawalHistory.map((entry) => (
              <div key={entry.id} className="withdraw-history-item">
                <div className="withdraw-history-item-icon">
                  <UiIcons name="exchange" className="withdraw-history-item-svg" />
                </div>

                <div className="withdraw-history-item-body">
                  <strong>{Number(entry.amount).toFixed(4)} USDT</strong>
                  <small>
                    {entry.method === "binance" ? t("profile.binanceId") : t("profile.gramWallet")}
                    {" · "}
                    {formatHistoryTarget(entry)}
                  </small>
                  <small className="withdraw-history-date">
                    {formatHistoryDate(entry.createdAt)}
                  </small>
                </div>

                <span className={`withdraw-status-badge ${entry.status}`}>
                  {STATUS_LABELS[entry.status] || entry.status}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </section>
  );
}

SLYEOF

mkdir -p "$(dirname "src/modals/ExchangeModal.tsx")"
cat > "src/modals/ExchangeModal.tsx" << 'SLYEOF'
import { useEffect, useMemo, useRef, useState } from "react";
import UiIcons from "../components/UiIcons";
import "../styles/modals.css";
import { tryAcquireGlobalAdLock, releaseGlobalAdLock, getAdLockWaitSeconds } from "../lib/adLock";
import { useLanguage } from "../i18n/LanguageContext";

type Props = {
  open: boolean;
  coins: number;
  onClose: () => void;
  onConfirm: (amountCoins: number) => void;
};

type AdsgramShowResult = {
  done: boolean;
  description: string;
  state: "load" | "render" | "playing" | "destroy";
  error: boolean;
};

type AdsgramController = {
  show: () => Promise<AdsgramShowResult>;
  addEventListener?: (event: string, callback: () => void) => void;
};

declare global {
  interface Window {
    Adsgram?: {
      init: (opts: { blockId: string }) => AdsgramController;
    };
  }
}

// نفس بلوك المكافأة (reward) المستخدم في بوابة السحب — يتحقق من اكتمال مشاهدة الإعلان فعلياً
const ADSGRAM_BLOCK_ID = "46086";

const MIN_COINS = 1000;
const RATE = 0.0000025;

export default function ExchangeModal({
  open,
  coins,
  onClose,
  onConfirm,
}: Props) {
  const { t } = useLanguage();
  const adsgramControllerRef = useRef<AdsgramController | null>(null);
  const [amountText, setAmountText] = useState("5000");
  const [stage, setStage] = useState<"edit" | "watching">("edit");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) {
      setStage("edit");
      setMessage("");
      return;
    }

    setAmountText(String(Math.max(MIN_COINS, Math.min(coins, 5000))));
    setStage("edit");
    setMessage("");
  }, [open, coins]);

  const amount = useMemo(() => {
    const parsed = Math.floor(Number(amountText));
    if (Number.isNaN(parsed)) return 0;
    return Math.max(0, Math.min(parsed, coins));
  }, [amountText, coins]);

  const usdt = amount * RATE;
  const canExchange = amount >= MIN_COINS && amount <= coins && stage === "edit";

  if (!open) return null;

  const handleMax = () => {
    setAmountText(String(coins));
    setMessage("");
  };

  const handleWatchAd = async () => {
    if (!canExchange) {
      setMessage(
        coins < MIN_COINS
          ? t("exchangeModal.notEnoughCoins")
          : t("exchangeModal.minimumExchange", { amount: MIN_COINS.toLocaleString() })
      );
      return;
    }

    setStage("watching");
    setMessage(t("exchangeModal.watchingAd"));

    // نمنع أي إعلان ثاني يطلع فوق هاي حتى يخلص هذا (نفس القفل المستخدم
    // بالمايننق والمهام بـ App.tsx / Tasks.tsx)
    if (!tryAcquireGlobalAdLock()) {
      setMessage(t("exchangeModal.pleaseWaitSeconds", { seconds: getAdLockWaitSeconds() }));
      setStage("edit");
      return;
    }

    try {
      if (!adsgramControllerRef.current && window.Adsgram) {
        adsgramControllerRef.current = window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID });
      }

      if (!adsgramControllerRef.current) {
        setMessage(t("exchangeModal.adsUnavailable"));
        setStage("edit");
        return;
      }

      await adsgramControllerRef.current.show();
    } catch {
      setMessage(t("exchangeModal.adFailed"));
      setStage("edit");
      return;
    } finally {
      releaseGlobalAdLock();
    }

    onConfirm(amount);
    onClose();
  };

  const handleBackdrop = () => {
    if (stage === "watching") return;
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal-card exchange-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p>{t("exchangeModal.eyebrow")}</p>
            <h2>{t("exchangeModal.title")}</h2>
          </div>

          <button className="modal-close" onClick={handleBackdrop} aria-label={t("common.close")}>
            <UiIcons name="back" className="modal-close-icon" />
          </button>
        </div>

        <div className="exchange-hero">
          <div className="exchange-orb" />
          <div>
            <span>{t("exchangeModal.rateLabel")}</span>
            <strong>{t("exchangeModal.rateValue")}</strong>
          </div>
        </div>

        <label className="exchange-field">
          <span>{t("exchangeModal.amountLabel")}</span>
          <div className="exchange-input-row">
            <input
              value={amountText}
              onChange={(e) => setAmountText(e.target.value.replace(/[^\d]/g, ""))}
              inputMode="numeric"
              placeholder={t("exchangeModal.amountPlaceholder")}
            />
            <button className="exchange-max" onClick={handleMax} type="button">
              {t("exchangeModal.max")}
            </button>
          </div>
        </label>

        <div className="exchange-preview">
          <div>
            <span>{t("exchangeModal.youReceive")}</span>
            <strong>{usdt.toFixed(4)} USDT</strong>
          </div>

          <div>
            <span>{t("exchangeModal.available")}</span>
            <strong>{coins.toLocaleString()} {t("exchangeModal.coinsSuffix")}</strong>
          </div>
        </div>

        <div className="exchange-note">
          {message ? (
            <p>{message}</p>
          ) : (
            <p>
              {t("exchangeModal.noteDefault")}
            </p>
          )}
        </div>

        <div className="modal-actions">
          <button className="modal-button ghost" onClick={handleBackdrop} type="button">
            {t("exchangeModal.cancel")}
          </button>

          <button className="modal-button primary" onClick={handleWatchAd} type="button" disabled={!canExchange}>
            {stage === "watching" ? t("exchangeModal.confirmWatching") : t("exchangeModal.confirmWatch")}
          </button>
        </div>
      </div>
    </div>
  );
}

SLYEOF

mkdir -p "$(dirname "src/modals/WithdrawalModal.tsx")"
cat > "src/modals/WithdrawalModal.tsx" << 'SLYEOF'
import { useEffect, useRef, useState } from "react";
import UiIcons from "../components/UiIcons";
import "../styles/modals.css";
import { tryAcquireGlobalAdLock, releaseGlobalAdLock, getAdLockWaitSeconds } from "../lib/adLock";
import { useLanguage } from "../i18n/LanguageContext";

type WithdrawMethod = "binance" | "bnb";
// ملاحظة: القيمة الداخلية "bnb" بقيت كما هي (تخزين قاعدة البيانات
// وباقي الباك اند يعتمدون عليها)، بس كل النصوص الظاهرة للمستخدم
// صارت تتكلم عن شبكة GRAM (TON) بدل BNB (BEP20).

type Props = {
  open: boolean;
  usdtBalance: number;
  walletAddress: string | null;
  withdrawalAdsWatched: number;
  withdrawalAdsRequired: number;
  nextWithdrawalAvailableAt: string | null;
  onPrepareAd: () => Promise<void>;
  onWatchAd: () => Promise<void>;
  onClose: () => void;
  onConfirm: (
    amount: number,
    method: WithdrawMethod,
    target: string
  ) => void;
};

type AdsgramShowResult = {
  done: boolean;
  description: string;
  state:
    | "load"
    | "render"
    | "playing"
    | "destroy";
  error: boolean;
};

type AdsgramController = {
  show: () => Promise<AdsgramShowResult>;
  addEventListener?: (event: string, callback: () => void) => void;
};

declare global {
  interface Window {
    Adsgram?: {
      init: (opts: {
        blockId: string;
      }) => AdsgramController;
    };
  }
}

// AdsGram Reward Block ID
const ADSGRAM_REWARD_BLOCK_ID = "46086";

// مهلة بسيطة بس قبل أول قراءة - الانتظار الحقيقي (لين ما يوصل
// الـwebhook) صار داخل onWatchAd نفسها (App.tsx) اللي تنطر لين
// العداد يزيد فعلاً بدل قراءة وحدة فورية.
const WEBHOOK_GRACE_MS = 0;

const MIN_WITHDRAW = 0.1;
const MAX_WITHDRAW = 0.2;

export default function WithdrawalModal({
  open,
  usdtBalance,
  walletAddress,
  withdrawalAdsWatched,
  withdrawalAdsRequired,
  onPrepareAd,
  onWatchAd,
  onClose,
  onConfirm,
}: Props) {
  const { t } = useLanguage();
  const [method, setMethod] =
    useState<WithdrawMethod>("binance");

  const [amountText, setAmountText] =
    useState("");

  const [binanceId, setBinanceId] =
    useState("");

  const [bnbAddress, setBnbAddress] =
    useState("");

  const [error, setError] =
    useState("");

  const [watchingAd, setWatchingAd] =
    useState(false);

  const adsgramControllerRef =
    useRef<AdsgramController | null>(null);

  useEffect(() => {
    if (!open) {
      setAmountText("");
      setBinanceId("");
      setBnbAddress("");
      setError("");
      setMethod("binance");
    } else {
      // نعبّي حقل عنوان GRAM (TON) تلقائياً من عنوان المحفظة المتصلة
      // بالبروفايل (إذا موجود) بس يظل المستخدم يقدر يعدله بحرية.
      setBnbAddress(walletAddress || "");
    }
  }, [open, walletAddress]);

  if (!open) return null;

  const requiredAds =
    Math.max(
      1,
      Number(
        withdrawalAdsRequired || 10
      )
    );

  const watchedAds =
    Math.max(
      0,
      Number(
        withdrawalAdsWatched || 0
      )
    );

  const adsComplete =
    watchedAds >= requiredAds;

  const handleMax = () => {
    const maxAllowed =
      Math.min(
        MAX_WITHDRAW,
        Math.max(
          0,
          Number(usdtBalance || 0)
        )
      );

    setAmountText(
      maxAllowed.toFixed(4)
    );

    setError("");
  };

  const handleAmountChange = (
    value: string
  ) => {
    setAmountText(value);
    setError("");

    const amount =
      Number(value);

    if (
      Number.isFinite(amount) &&
      amount > MAX_WITHDRAW
    ) {
      setError(
        t("withdrawModal.errorMaxPerWithdrawal", { max: MAX_WITHDRAW })
      );
    }
  };

  const handleWatchAd = async () => {
    if (
      watchingAd ||
      adsComplete
    ) {
      return;
    }

    setWatchingAd(true);
    setError("");

    // نمنع أي إعلان ثاني يطلع فوق هاي حتى يخلص هذا (نفس القفل المستخدم
    // بالمايننق والمهام بـ App.tsx / Tasks.tsx). لازم يكون بدون انتظار
    // (بدون await) قبل .show()، وإلا AdsGram ما يربط الظهور بضغطة
    // المستخدم مباشرة وممكن ما يحسبه Impression صحيح.
    if (!tryAcquireGlobalAdLock()) {
      setError(t("withdrawModal.pleaseWaitSeconds", { seconds: getAdLockWaitSeconds() }));
      setWatchingAd(false);
      return;
    }

    try {
      if (
        !adsgramControllerRef.current &&
        window.Adsgram
      ) {
        adsgramControllerRef.current =
          window.Adsgram.init({
            blockId:
              ADSGRAM_REWARD_BLOCK_ID,
          });
      }

      if (
        !adsgramControllerRef.current
      ) {
        setError(
          t("withdrawModal.adsUnavailable")
        );

        setWatchingAd(false);
        return;
      }

      // .show() لازم ينطلق بنفس لحظة الكلك بلا await قبله. onPrepareAd
      // نتيجته غير مستخدمة أصلاً، فنشغلها بالخلفية بدون ننتظرها.
      onPrepareAd().catch(() => {});

      await adsgramControllerRef.current.show();

      // ننتظر قليلاً حتى يصل webhook من AdsGram
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          WEBHOOK_GRACE_MS
        )
      );

      await onWatchAd();
    } catch {
      setError(
        t("withdrawModal.adFailed")
      );
    } finally {
      setWatchingAd(false);
      releaseGlobalAdLock();
    }
  };

  const handleWithdraw = () => {
    if (!adsComplete) {
      setError(
        t("withdrawModal.errorWatchMoreAds", { count: requiredAds - watchedAds })
      );

      return;
    }

    const amount =
      Number(amountText);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError(
        t("withdrawModal.errorEnterValidAmount")
      );

      return;
    }

    if (
      amount < MIN_WITHDRAW
    ) {
      setError(
        t("withdrawModal.errorMinWithdrawal", { min: MIN_WITHDRAW })
      );

      return;
    }

    if (
      amount > MAX_WITHDRAW
    ) {
      setError(
        t("withdrawModal.errorMaxPerWithdrawal", { max: MAX_WITHDRAW })
      );

      return;
    }

    if (
      amount > usdtBalance
    ) {
      setError(
        t("withdrawModal.errorInsufficientBalance")
      );

      return;
    }

    if (
      method === "binance"
    ) {
      const trimmed =
        binanceId.trim();

      if (!trimmed) {
        setError(
          t("withdrawModal.errorEnterBinanceId")
        );

        return;
      }

      onConfirm(
        Number(
          amount.toFixed(4)
        ),
        "binance",
        trimmed
      );

      onClose();
      return;
    }

    const trimmedBnbAddress =
      bnbAddress.trim();

    if (!trimmedBnbAddress) {
      setError(
        t("withdrawModal.errorEnterGramAddress")
      );

      return;
    }

    onConfirm(
      Number(
        amount.toFixed(4)
      ),
      "bnb",
      trimmedBnbAddress
    );

    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-card exchange-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div className="modal-head">
          <div>
            <p>{t("withdrawModal.eyebrow")}</p>

            <h2>
              {t("withdrawModal.title")}
            </h2>
          </div>

          <button
            className="modal-close"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <UiIcons
              name="back"
              className="modal-close-icon"
            />
          </button>
        </div>

        <div className="withdraw-ads-gate">
          <div className="withdraw-ads-gate-top">
            <span>
              {t("withdrawModal.watchAdsToUnlock")}
            </span>

            <strong>
              {watchedAds}/{requiredAds}
            </strong>
          </div>

          <div className="withdraw-ads-progress">
            <span
              style={{
                width: `${Math.min(
                  100,
                  (watchedAds /
                    requiredAds) *
                    100
                )}%`,
              }}
            />
          </div>

          <button
            type="button"
            className="withdraw-watch-ad-btn"
            onClick={
              handleWatchAd
            }
            disabled={
              watchingAd ||
              adsComplete
            }
          >
            {adsComplete
              ? t("withdrawModal.unlocked")
              : watchingAd
              ? t("withdrawModal.confirmingReward")
              : t("withdrawModal.watchAd")}
          </button>
        </div>

        <div className="withdraw-method-row">
          <button
            type="button"
            className={`withdraw-method-btn ${
              method === "binance"
                ? "active"
                : ""
            }`}
            onClick={() => {
              setMethod("binance");
              setError("");
            }}
          >
            {t("withdrawModal.binanceMethod")}
          </button>

          <button
            type="button"
            className={`withdraw-method-btn ${
              method === "bnb"
                ? "active"
                : ""
            }`}
            onClick={() => {
              setMethod("bnb");
              setError("");
            }}
          >
            {t("withdrawModal.gramMethod")}
          </button>
        </div>

        {method ===
        "binance" ? (
          <label className="exchange-field">
            <span>
              {t("withdrawModal.binanceIdLabel")}
            </span>

            <div className="exchange-input-row">
              <input
                type="text"
                value={binanceId}
                onChange={(e) => {
                  setBinanceId(
                    e.target.value
                  );
                  setError("");
                }}
                placeholder={t("withdrawModal.binanceIdPlaceholder")}
              />
            </div>
          </label>
        ) : (
          <label className="exchange-field">
            <span>
              {t("withdrawModal.gramAddressLabel")}
            </span>

            <div className="exchange-input-row">
              <input
                type="text"
                value={bnbAddress}
                onChange={(e) => {
                  setBnbAddress(
                    e.target.value
                  );
                  setError("");
                }}
                placeholder={t("withdrawModal.gramAddressPlaceholder")}
              />
            </div>
          </label>
        )}

        <label className="exchange-field">
          <span>
            {t("withdrawModal.amountLabel")}
          </span>

          <div className="exchange-input-row">
            <input
              type="number"
              min={MIN_WITHDRAW}
              max={MAX_WITHDRAW}
              step="0.01"
              value={amountText}
              onChange={(e) =>
                handleAmountChange(
                  e.target.value
                )
              }
              placeholder={t("withdrawModal.amountPlaceholder", { min: MIN_WITHDRAW, max: MAX_WITHDRAW })}
            />

            <button
              className="exchange-max"
              onClick={handleMax}
              type="button"
            >
              {t("withdrawModal.max")}
            </button>
          </div>
        </label>

        <div className="exchange-preview">
          <div>
            <span>
              {t("withdrawModal.availableBalance")}
            </span>

            <strong>
              {usdtBalance.toFixed(4)}
              {" "}USDT
            </strong>
          </div>
        </div>

        <div className="exchange-note">
          {error ? (
            <p
              style={{
                color: "#ff6b6b",
              }}
            >
              {error}
            </p>
          ) : (
            <p>
              {method === "binance"
                ? t("withdrawModal.noteBinance")
                : t("withdrawModal.noteGram")}
            </p>
          )}

          {!error && (
            <p
              style={{
                marginTop: 6,
              }}
            >
              {t("withdrawModal.minMax", { min: MIN_WITHDRAW, max: MAX_WITHDRAW })}
            </p>
          )}
        </div>

        <div className="modal-actions">
          <button
            className="modal-button ghost"
            onClick={onClose}
            type="button"
          >
            {t("withdrawModal.cancel")}
          </button>

          <button
            className="modal-button primary"
            onClick={handleWithdraw}
            type="button"
            disabled={!adsComplete}
          >
            {t("withdrawModal.confirmWithdraw")}
          </button>
        </div>
      </div>
    </div>
  );
}

SLYEOF

mkdir -p "$(dirname "src/modals/GiftCodeModal.tsx")"
cat > "src/modals/GiftCodeModal.tsx" << 'SLYEOF'
import { useEffect, useState } from "react";
import UiIcons from "../components/UiIcons";
import "../styles/modals.css";
import { useLanguage } from "../i18n/LanguageContext";

type RedeemResult = { success: boolean; message: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onRedeem: (code: string) => Promise<RedeemResult>;
};

export default function GiftCodeModal({ open, onClose, onRedeem }: Props) {
  const { t } = useLanguage();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) {
      setCode("");
      setBusy(false);
      setStatus("idle");
      setMessage("");
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    const trimmed = code.trim();
    if (!trimmed || busy) return;

    setBusy(true);
    setMessage("");

    const result = await onRedeem(trimmed);

    setBusy(false);
    setStatus(result.success ? "success" : "error");
    setMessage(result.message);

    if (result.success) {
      setCode("");
    }
  };

  const handleBackdrop = () => {
    if (busy) return;
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal-card exchange-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p>{t("giftCodeModal.eyebrow")}</p>
            <h2>{t("giftCodeModal.title")}</h2>
          </div>

          <button className="modal-close" onClick={handleBackdrop} aria-label={t("common.close")}>
            <UiIcons name="back" className="modal-close-icon" />
          </button>
        </div>

        <label className="exchange-field">
          <span>{t("giftCodeModal.codeLabel")}</span>
          <div className="exchange-input-row">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t("giftCodeModal.codePlaceholder")}
              autoCapitalize="characters"
              disabled={busy}
            />
          </div>
        </label>

        <div className="exchange-note">
          {message ? (
            <p style={{ color: status === "success" ? "#81c784" : "#ff8a80" }}>
              {message}
            </p>
          ) : (
            <p>{t("giftCodeModal.noteDefault")}</p>
          )}
        </div>

        <div className="modal-actions">
          <button className="modal-button ghost" onClick={handleBackdrop} type="button" disabled={busy}>
            {t("giftCodeModal.cancel")}
          </button>

          <button
            className="modal-button primary"
            onClick={handleSubmit}
            type="button"
            disabled={!code.trim() || busy}
          >
            {busy ? t("giftCodeModal.redeeming") : t("giftCodeModal.redeem")}
          </button>
        </div>
      </div>
    </div>
  );
}

SLYEOF

mkdir -p "$(dirname "src/components/MandatorySubscription.tsx")"
cat > "src/components/MandatorySubscription.tsx" << 'SLYEOF'
import { useState } from "react";
import "../styles/mandatory-subscription.css";
import { useLanguage } from "../i18n/LanguageContext";

function openMandatoryChannelLink(url: string) {
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.openTelegramLink && /t\.me\//i.test(url)) {
      tg.openTelegramLink(url);
      return;
    }
    if (tg?.openLink) {
      tg.openLink(url);
      return;
    }
  } catch {}
  window.open(url, "_blank", "noopener,noreferrer");
}

type RequiredChannel = {
  id: string;
  title: string;
  url: string;
  joined: boolean;
};

type Props = {
  channels: RequiredChannel[];
  loading?: boolean;
  onVerify: () => Promise<void>;
};

function ChannelIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mandatory-channel-icon"
      aria-hidden="true"
    >
      <path
        d="M3 11.5 19.5 4l-3 16-6-4.2L7.5 18l-.6-5.3L3 11.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="m9.9 12.7 9.6-8.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mandatory-lock-icon"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M8 10V7.5a4 4 0 0 1 8 0V10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="15"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mandatory-check-icon"
      aria-hidden="true"
    >
      <path
        d="M4 12.5 9.5 18 20 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function MandatorySubscription({
  channels,
  loading = false,
  onVerify,
}: Props) {
  const { t } = useLanguage();
  const [checking, setChecking] =
    useState(false);

  const allJoined =
    channels.length > 0 &&
    channels.every(
      (channel) => channel.joined
    );

  const handleVerify = async () => {
    if (checking) return;

    setChecking(true);

    try {
      await onVerify();
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="mandatory-page">
      <div className="mandatory-content">
        <div className="mandatory-lock">
          <LockIcon />
        </div>

        <div className="mandatory-head">
          <h1>
            {t("mandatorySubscription.title")}
          </h1>

          <p>
            {t("mandatorySubscription.body")}
          </p>
        </div>

        <div className="mandatory-list">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className={`mandatory-channel ${
                channel.joined
                  ? "joined"
                  : ""
              }`}
            >
              <div className="mandatory-channel-left">
                <div className="mandatory-channel-icon-wrap">
                  <ChannelIcon />
                </div>

                <strong>
                  {channel.title}
                </strong>
              </div>

              <button
                type="button"
                className="mandatory-join"
                disabled={channel.joined}
                onClick={() => openMandatoryChannelLink(channel.url)}
              >
                {channel.joined
                  ? t("mandatorySubscription.joined")
                  : t("mandatorySubscription.join")}
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="mandatory-verify"
          onClick={handleVerify}
          disabled={
            checking ||
            allJoined
          }
        >
          {checking ? (
            <>
              <span className="mandatory-spinner" />
              {t("mandatorySubscription.checking")}
            </>
          ) : allJoined ? (
            <>
              <CheckIcon />
              {t("mandatorySubscription.verified")}
            </>
          ) : (
            <>
              <CheckIcon />
              {t("mandatorySubscription.verify")}
            </>
          )}
        </button>

        {loading ? (
          <div className="mandatory-loading">
            {t("mandatorySubscription.checkingMembership")}
          </div>
        ) : null}
      </div>
    </div>
  );
}

SLYEOF

mkdir -p "$(dirname "src/components/GameCanvas.tsx")"
cat > "src/components/GameCanvas.tsx" << 'SLYEOF'
import { useEffect, useRef, useState } from "react";
import "../styles/game.css";
import UiIcons from "./UiIcons";
import { useLanguage } from "../i18n/LanguageContext";

type Props = {
  onExit: (coinsEarned?: number) => void;
};

type Phase = "active" | "between" | "win" | "lose";

type Hud = {
  wave: number;
  energy: number;
  coins: number;
  status: string;
};

type Star = {
  x: number;
  y: number;
  r: number;
  vy: number;
  alpha: number;
};

type TrailPoint = {
  x: number;
  y: number;
};

type Crater = {
  x: number;
  y: number;
  r: number;
};

type Meteor = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  spin: number;
  active: boolean;
  hue: number;
  elite: boolean;
  trail: TrailPoint[];
  // شكل الصخرة: نسب نصف قطر غير منتظمة لكل زاوية (تولد مرة وحدة
  // عند الإنشاء) عشان كل نيزك يطلع بشكل مختلف وواقعي، مو نجمة متماثلة.
  shape: number[];
  craters: Crater[];
};

type Laser = {
  x: number;
  y: number;
  vy: number;
  active: boolean;
};

type Burst = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
};

type Banner = {
  title: string;
  subtitle: string;
  timer: number;
  tone: "wave" | "win" | "lose";
};

const TOTAL_WAVES = 5;
const WAVE_REWARD = 100;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function rectHit(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function makeStars(width: number, height: number): Star[] {
  return Array.from({ length: 120 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.7 + 0.4,
    vy: 12 + Math.random() * 40,
    alpha: 0.18 + Math.random() * 0.7,
  }));
}

function makeWave(wave: number, width: number): Meteor[] {
  const count = 11 + wave * 5;
  const cols = wave >= 4 ? 6 : 5;
  const lane = width / (cols + 1);
  const baseSpeed = 110 + wave * 18;
  const baseSize = 16 + wave * 2;

  return Array.from({ length: count }, (_, index) => {
    const elite = wave >= 3 && index % 8 === 0;
    const col = index % cols;
    const x = lane * (col + 1) + (Math.random() * 26 - 13);

    // شكل صخري غير منتظم (10 نقاط بنصف قطر عشوائي) بدل النجمة
    // المتماثلة القديمة - كل نيزك يطلع بسلوت شكل فريد.
    const shapePoints = elite ? 7 : 10;
    const shape = Array.from(
      { length: shapePoints },
      () => (elite ? 0.72 : 0.6) + Math.random() * (elite ? 0.42 : 0.55)
    );

    const craters: Crater[] = elite
      ? []
      : Array.from({ length: 2 + Math.floor(Math.random() * 3) }, () => ({
          x: (Math.random() - 0.5) * 0.9,
          y: (Math.random() - 0.5) * 0.9,
          r: 0.09 + Math.random() * 0.13,
        }));

    return {
      x: clamp(x, 22, width - 22),
      y: -80 - index * (24 + wave * 6) - Math.random() * 100,
      vx: (Math.random() - 0.5) * (24 + wave * 4),
      vy: baseSpeed + Math.random() * (26 + wave * 10) + (elite ? 22 : 0),
      size: baseSize + Math.random() * (elite ? 12 : 8),
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * (elite ? 4 : 6 + wave * 1.1),
      active: true,
      hue: elite ? 44 : 206 + Math.random() * 10,
      elite,
      trail: [],
      shape,
      craters,
    };
  });
}

export default function GameCanvas({ onExit }: Props) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);

  const stateRef = useRef({
    width: 0,
    height: 0,
    dpr: 1,
    phase: "active" as Phase,
    wave: 1,
    energy: 5,
    coins: 0,
    shipX: 0,
    shipY: 0,
    targetX: 0,
    targetY: 0,
    shipW: 48,
    shipH: 60,
    dragging: false,
    shootCd: 0,
    betweenTimer: 0,
    waveFlash: 0,
    shake: 0,
    spawnTimer: 0,
    stars: [] as Star[],
    meteors: [] as Meteor[],
    spawnQueue: [] as Meteor[],
    lasers: [] as Laser[],
    bursts: [] as Burst[],
    banner: {
      title: t("gameCanvas.waveLabel", { n: 1 }),
      subtitle: t("gameCanvas.braceForImpact"),
      timer: 1.1,
      tone: "wave" as Banner["tone"],
    },
  });

  const [hud, setHud] = useState<Hud>({
    wave: 1,
    energy: 5,
    coins: 0,
    status: t("gameCanvas.waveStatus", { n: 1, total: TOTAL_WAVES }),
  });

  const [result, setResult] = useState<null | {
    title: string;
    text: string;
    tone: "win" | "lose";
  }>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;

    const s = stateRef.current;

    const ensureAudio = async () => {
      if (!audioRef.current) {
        const AudioCtor =
          window.AudioContext ||
          (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;

        if (!AudioCtor) return;
        audioRef.current = new AudioCtor();
      }

      if (audioRef.current.state === "suspended") {
        await audioRef.current.resume();
      }
    };

    const tone = (
      freq: number,
      duration: number,
      type: OscillatorType = "sine",
      gainValue = 0.05,
      detune = 0
    ) => {
      const ac = audioRef.current;
      if (!ac) return;

      const osc = ac.createOscillator();
      const gain = ac.createGain();

      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune;

      gain.gain.value = 0.0001;
      gain.gain.exponentialRampToValueAtTime(gainValue, ac.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);

      osc.connect(gain);
      gain.connect(ac.destination);

      osc.start();
      osc.stop(ac.currentTime + duration + 0.03);
    };

    const sfx = (kind: "wave" | "shoot" | "clear" | "hit" | "win" | "lose") => {
      if (!audioRef.current) return;

      if (kind === "wave") {
        tone(220, 0.08, "triangle", 0.03);
        tone(440, 0.11, "sine", 0.025);
      } else if (kind === "shoot") {
        tone(860, 0.04, "square", 0.02);
      } else if (kind === "clear") {
        tone(330, 0.08, "triangle", 0.04);
        tone(660, 0.1, "sine", 0.04);
        tone(990, 0.13, "sine", 0.03);
      } else if (kind === "hit") {
        tone(120, 0.12, "sawtooth", 0.05);
        tone(80, 0.18, "triangle", 0.03);
      } else if (kind === "win") {
        tone(392, 0.12, "triangle", 0.04);
        tone(523.25, 0.14, "triangle", 0.04);
        tone(659.25, 0.18, "sine", 0.04);
      } else if (kind === "lose") {
        tone(196, 0.16, "sawtooth", 0.05);
        tone(98, 0.24, "triangle", 0.04);
      }
    };

    const vibrate = (pattern: number | number[]) => {
      if (navigator.vibrate) navigator.vibrate(pattern);
    };

    const burst = (x: number, y: number, color: string) => {
      for (let i = 0; i < 16; i += 1) {
        s.bursts.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 360,
          vy: (Math.random() - 0.5) * 360,
          life: 0.38 + Math.random() * 0.35,
          size: 1.3 + Math.random() * 3.4,
          color,
        });
      }
    };

    const spawnWave = (wave: number) => {
      s.phase = "active";
      s.wave = wave;
      s.shootCd = 0;
      s.spawnTimer = 0;
      s.spawnQueue = makeWave(wave, s.width);
      s.meteors = [];
      s.lasers = [];
      s.banner = {
        title: t("gameCanvas.waveLabel", { n: wave }),
        subtitle: wave === 5 ? t("gameCanvas.finalStorm") : wave >= 4 ? t("gameCanvas.meteorPressureRising") : t("gameCanvas.incomingRocks"),
        timer: 1.05,
        tone: "wave",
      };
      s.waveFlash = 1;
      sfx("wave");

      setHud({
        wave,
        energy: s.energy,
        coins: s.coins,
        status: t("gameCanvas.waveStatus", { n: wave, total: TOTAL_WAVES }),
      });
      setResult(null);
    };

    const finishWin = () => {
      if (s.phase === "win" || s.phase === "lose") return;
      s.phase = "win";
      const winSubtitle = t("gameCanvas.missionCompleteSubtitle", { total: TOTAL_WAVES, coins: s.coins });
      s.banner = {
        title: t("gameCanvas.missionComplete"),
        subtitle: winSubtitle,
        timer: 2.2,
        tone: "win",
      };
      s.waveFlash = 1;
      sfx("win");
      vibrate([50, 60, 80]);

      setHud({
        wave: TOTAL_WAVES,
        energy: s.energy,
        coins: s.coins,
        status: t("gameCanvas.missionCompleteStatus"),
      });

      setResult({
        title: t("gameCanvas.missionCompleteStatus"),
        text: winSubtitle,
        tone: "win",
      });
    };

    const finishLose = (reason = t("gameCanvas.meteorEscaped")) => {
      if (s.phase === "win" || s.phase === "lose") return;
      s.phase = "lose";
      s.banner = {
        title: t("gameCanvas.runFailed"),
        subtitle: reason,
        timer: 2.2,
        tone: "lose",
      };
      s.waveFlash = 1;
      sfx("lose");
      vibrate([120, 40, 120]);

      setHud({
        wave: s.wave,
        energy: s.energy,
        coins: s.coins,
        status: t("gameCanvas.runFailedStatus"),
      });

      setResult({
        title: t("gameCanvas.runFailedStatus"),
        text: t("gameCanvas.runFailedText", { reason, coins: s.coins }),
        tone: "lose",
      });
    };

    // نظام أرواح حقيقي: كل ضربة أو نيزك فايت تنقص وحدة طاقة بس ما
    // تخلص المحاولة إلا لما توصل الطاقة للصفر (بدل الموت من أول خطأ
    // اللي كان بالنسخة القديمة - هذا هو الخلل اللي كان يخلي اللعبة
    // قاسية بدون داعي).
    const damageShip = (reason: string) => {
      s.energy = Math.max(0, s.energy - 1);
      s.shake = Math.max(s.shake, 0.32);
      sfx("hit");
      vibrate(60);

      if (s.energy <= 0) {
        finishLose(reason);
        return;
      }

      s.banner = {
        title: t("gameCanvas.minusOneLife"),
        subtitle: reason,
        timer: 0.7,
        tone: "lose",
      };
      s.waveFlash = 0.55;

      setHud({
        wave: s.wave,
        energy: s.energy,
        coins: s.coins,
        status: t("gameCanvas.livesLeft", {
          count: s.energy,
          unit: s.energy === 1 ? t("gameCanvas.life") : t("gameCanvas.lives"),
        }),
      });
    };

    const addLaser = () => {
      s.lasers.push({
        x: s.shipX + s.shipW / 2 - 2,
        y: s.shipY - 10,
        vy: -980,
        active: true,
      });
      sfx("shoot");
    };

    const spawnFromQueue = (dt: number) => {
      if (s.phase !== "active") return;

      s.spawnTimer -= dt;
      const interval = Math.max(0.055, 0.16 - (s.wave - 1) * 0.017);

      if (s.spawnTimer <= 0 && s.spawnQueue.length > 0) {
        const burstCount = s.wave >= 4 ? 2 : 1;
        for (let i = 0; i < burstCount && s.spawnQueue.length > 0; i += 1) {
          const next = s.spawnQueue.shift();
          if (next) s.meteors.push(next);
        }
        s.spawnTimer = interval;
      }
    };

    const updateStars = (dt: number) => {
      for (const star of s.stars) {
        star.y += star.vy * dt;
        if (star.y > s.height + 4) {
          star.y = -4;
          star.x = Math.random() * s.width;
        }
      }
    };

    const updateBursts = (dt: number) => {
      s.bursts = s.bursts.filter((b) => {
        b.life -= dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.vx *= 0.965;
        b.vy *= 0.965;
        return b.life > 0;
      });
    };

    const updateLasers = (dt: number) => {
      for (const laser of s.lasers) {
        laser.y += laser.vy * dt;
        if (laser.y < -30) laser.active = false;
      }
      s.lasers = s.lasers.filter((l) => l.active);
    };

    const updateMeteors = (dt: number) => {
      for (const meteor of s.meteors) {
        meteor.rot += meteor.spin * dt;
        meteor.x += meteor.vx * dt;
        meteor.y += meteor.vy * dt;
        meteor.trail.unshift({ x: meteor.x, y: meteor.y });

        if (meteor.trail.length > 10) {
          meteor.trail.pop();
        }

        if (meteor.x < 14 || meteor.x > s.width - 14) {
          meteor.vx *= -1;
        }
      }

      for (const laser of s.lasers) {
        for (const meteor of s.meteors) {
          if (
            meteor.active &&
            laser.active &&
            rectHit(
              laser.x,
              laser.y,
              4,
              18,
              meteor.x - meteor.size,
              meteor.y - meteor.size,
              meteor.size * 2,
              meteor.size * 2
            )
          ) {
            meteor.active = false;
            laser.active = false;
            burst(
              meteor.x,
              meteor.y,
              meteor.elite ? "rgba(255,210,90,.98)" : "rgba(78,167,255,.92)"
            );
          }
        }
      }

      s.meteors = s.meteors.filter((meteor) => {
        if (!meteor.active) return false;

        if (meteor.y - meteor.size > s.height) {
          damageShip(t("gameCanvas.meteorEscaped"));
          return false;
        }

        if (
          rectHit(
            s.shipX,
            s.shipY,
            s.shipW,
            s.shipH,
            meteor.x - meteor.size,
            meteor.y - meteor.size,
            meteor.size * 2,
            meteor.size * 2
          )
        ) {
          burst(meteor.x, meteor.y, "rgba(255,120,120,.95)");
          damageShip(t("gameCanvas.shipHit"));
          return false;
        }

        return true;
      });

      return s.phase !== "active";
    };

    const drawBackground = () => {
      const gradient = ctx.createLinearGradient(0, 0, 0, s.height);
      gradient.addColorStop(0, "#0a1730");
      gradient.addColorStop(0.55, "#050b18");
      gradient.addColorStop(1, "#02050c");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, s.width, s.height);

      for (const star of s.stars) {
        ctx.save();
        ctx.globalAlpha = star.alpha;
        ctx.fillStyle = "#dff3ff";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    const drawShip = () => {
      const x = s.shipX;
      const y = s.shipY;
      const w = s.shipW;
      const h = s.shipH;
ctx.save();
      ctx.translate(x + w / 2, y + h / 2);

      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "rgba(78,167,255,.55)";
      ctx.beginPath();
      ctx.ellipse(0, h * 0.42, w * 0.36, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      grad.addColorStop(0, "#eaf6ff");
      grad.addColorStop(0.5, "#8fc7ff");
      grad.addColorStop(1, "#2f6fd6");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -h / 2);
      ctx.lineTo(w / 2, h * 0.28);
      ctx.lineTo(w * 0.22, h / 2);
      ctx.lineTo(-w * 0.22, h / 2);
      ctx.lineTo(-w / 2, h * 0.28);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(10,20,40,.55)";
      ctx.beginPath();
      ctx.ellipse(0, -h * 0.08, w * 0.16, h * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawMeteor = (meteor: Meteor) => {
      if (!meteor.active) return;

      // ذيل مذنّب متناقص الحجم والشفافية بدل دوائر ثابتة الحجم -
      // يعطي إحساس حركة وسرعة أوضح.
      const trailLen = meteor.trail.length;
      for (let i = 0; i < trailLen; i += 1) {
        const point = meteor.trail[i];
        const t = i / Math.max(1, trailLen - 1);
        const trailSize = meteor.size * (0.5 - t * 0.38);
        if (trailSize <= 0.4) continue;

        const alpha = (1 - t) * (meteor.elite ? 0.32 : 0.2);
        ctx.save();
        ctx.globalAlpha = alpha;

        const trailGrad = ctx.createRadialGradient(
          point.x,
          point.y,
          0,
          point.x,
          point.y,
          trailSize
        );

        if (meteor.elite) {
          trailGrad.addColorStop(0, "#fff3cf");
          trailGrad.addColorStop(1, "rgba(255,178,46,0)");
        } else {
          trailGrad.addColorStop(0, "#9fd4ff");
          trailGrad.addColorStop(1, "rgba(58,90,140,0)");
        }

        ctx.fillStyle = trailGrad;
        ctx.beginPath();
        ctx.arc(point.x, point.y, trailSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(meteor.x, meteor.y);
      ctx.rotate(meteor.rot);

      // إضاءة من زاوية ثابتة (مو من المنتصف) عشان تحس بعمق/نتوءات
      // حقيقية على سطح الصخرة بدل تدرج كروي مسطح.
      const grad = ctx.createRadialGradient(
        -meteor.size * 0.28,
        -meteor.size * 0.28,
        meteor.size * 0.08,
        0,
        0,
        meteor.size * 1.05
      );

      if (meteor.elite) {
        grad.addColorStop(0, "#fff6da");
        grad.addColorStop(0.5, "#ffcf5c");
        grad.addColorStop(1, "#8a5a12");
      } else {
        grad.addColorStop(0, "#cddcef");
        grad.addColorStop(0.55, "#7c8ea8");
        grad.addColorStop(1, "#262e40");
      }

      ctx.fillStyle = grad;
      ctx.beginPath();

      // شكل صخري غير منتظم (مولّد مرة وحدة عند الإنشاء، مخزن
      // بـmeteor.shape) بدل النجمة المتماثلة القديمة.
      const points = meteor.shape.length;
      for (let i = 0; i < points; i += 1) {
        const angle = (i / points) * Math.PI * 2;
        const radius = meteor.size * meteor.shape[i];
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }

      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = meteor.elite
        ? "rgba(255,255,255,.55)"
        : "rgba(255,255,255,.14)";
      ctx.lineWidth = meteor.elite ? 1.5 : 1;
      ctx.stroke();

      if (meteor.elite) {
        // عروق ذهبية متوهجة على الصخور النادرة (مكافأة أعلى)
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,.85)";
        ctx.lineWidth = 1.4;
        ctx.shadowColor = "rgba(255,214,110,.9)";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(-meteor.size * 0.32, -meteor.size * 0.12);
        ctx.lineTo(meteor.size * 0.12, meteor.size * 0.04);
        ctx.lineTo(-meteor.size * 0.02, meteor.size * 0.42);
        ctx.stroke();
        ctx.restore();
      } else {
        // فوهات/حفر سطحية للصخور العادية
        ctx.fillStyle = "rgba(10,14,24,.4)";
        for (const crater of meteor.craters) {
          ctx.beginPath();
          ctx.arc(
            crater.x * meteor.size,
            crater.y * meteor.size,
            crater.r * meteor.size,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }

      ctx.restore();
    };

    const drawLaser = (laser: Laser) => {
      ctx.save();
      ctx.fillStyle = "#7cf0ff";
      ctx.shadowColor = "rgba(124,240,255,.8)";
      ctx.shadowBlur = 8;
      ctx.fillRect(laser.x, laser.y, 4, 18);
      ctx.restore();
    };

    const drawBurst = (burstItem: Burst) => {
      ctx.save();
      ctx.globalAlpha = clamp(burstItem.life * 2, 0, 1);
      ctx.fillStyle = burstItem.color;
      ctx.beginPath();
      ctx.arc(burstItem.x, burstItem.y, burstItem.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawBanner = () => {
      if (s.banner.timer <= 0) return;

      const alpha = clamp(s.banner.timer / 1.05, 0, 1);

      const fillColor =
        s.banner.tone === "win"
          ? "rgba(255,210,90,.08)"
          : s.banner.tone === "lose"
            ? "rgba(255,90,90,.08)"
            : "rgba(78,167,255,.06)";

      const strokeColor =
        s.banner.tone === "win"
          ? "rgba(255,210,90,.30)"
          : s.banner.tone === "lose"
            ? "rgba(255,100,100,.30)"
            : "rgba(78,167,255,.30)";

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = fillColor;
      ctx.fillRect(0, 0, s.width, s.height);

      const boxW = Math.min(s.width - 32, 360);
      const boxH = 114;
      const boxX = (s.width - boxW) / 2;
      const boxY = s.height * 0.23;

      ctx.fillStyle = "rgba(10,16,28,.78)";
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      roundRect(ctx, boxX, boxY, boxW, boxH, 22);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#dff3ff";
      ctx.font = "700 22px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(s.banner.title, s.width / 2, boxY + 42);

      ctx.fillStyle = "#92a1b7";
      ctx.font = "600 13px Inter, system-ui, sans-serif";
      ctx.fillText(s.banner.subtitle, s.width / 2, boxY + 78);

      ctx.restore();
    };

    const roundRect = (
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number
    ) => {
      const corner = Math.min(radius, width / 2, height / 2);
      context.beginPath();
      context.moveTo(x + corner, y);
      context.arcTo(x + width, y, x + width, y + height, corner);
      context.arcTo(x + width, y + height, x, y + height, corner);
      context.arcTo(x, y + height, x, y, corner);
      context.arcTo(x, y, x + width, y, corner);
      context.closePath();
    };

    const update = (dt: number) => {
      if (s.banner.timer > 0) s.banner.timer -= dt;
      if (s.waveFlash > 0) s.waveFlash = Math.max(0, s.waveFlash - dt * 1.8);

      if (s.phase === "active") {
        if (s.dragging) {
          s.shipX = s.targetX;
          s.shipY = s.targetY;
        } else {
          s.shipX = lerp(s.shipX, s.targetX, 1 - Math.pow(0.001, dt));
          s.shipY = lerp(s.shipY, s.targetY, 1 - Math.pow(0.001, dt));
        }

        s.shipX = clamp(s.shipX, 16, s.width - s.shipW - 16);
        s.shipY = clamp(s.shipY, s.height * 0.34, s.height - s.shipH - 18);

        s.shootCd += dt;
        if (s.shootCd >= 0.15) {
          s.shootCd = 0;
          addLaser();
        }

        spawnFromQueue(dt);
        updateLasers(dt);

        const ended = updateMeteors(dt);
        if (ended) return true;

        updateBursts(dt);
        updateStars(dt);

        if (s.spawnQueue.length === 0 && s.meteors.length === 0) {
          s.coins += WAVE_REWARD;
          sfx("clear");
          s.banner = {
            title: t("gameCanvas.waveClearedTitle", { n: s.wave }),
            subtitle: t("gameCanvas.waveClearedCoins", { amount: WAVE_REWARD }),
            timer: 1.0,
            tone: "wave",
          };
          s.waveFlash = 1;
          setHud({
            wave: s.wave,
            energy: s.energy,
            coins: s.coins,
            status: t("gameCanvas.waveClearedStatus", { n: s.wave, amount: WAVE_REWARD }),
          });

          if (s.wave >= TOTAL_WAVES) {
            finishWin();
            return true;
          }

          s.phase = "between";
          s.betweenTimer = 0.85;
        }
      } else if (s.phase === "between") {
        updateBursts(dt);
        updateStars(dt);

        s.betweenTimer -= dt;
        if (s.betweenTimer <= 0) {
          spawnWave(s.wave + 1);
        }
      } else {
        updateBursts(dt);
        updateStars(dt);
      }

      if (s.shake > 0) s.shake = Math.max(0, s.shake - dt);

      return false;
    };

    const draw = () => {
      drawBackground();

      if (s.waveFlash > 0) {
        ctx.save();
        ctx.globalAlpha = s.waveFlash * 0.18;
        ctx.fillStyle = "#4ea7ff";
        ctx.fillRect(0, 0, s.width, s.height);
        ctx.restore();
      }

      if (s.shake > 0) {
        const sx = (Math.random() - 0.5) * 8 * s.shake;
        const sy = (Math.random() - 0.5) * 8 * s.shake;
        ctx.save();
        ctx.translate(sx, sy);
      }

      for (const laser of s.lasers) drawLaser(laser);
      for (const meteor of s.meteors) drawMeteor(meteor);
      for (const burstItem of s.bursts) drawBurst(burstItem);
      drawShip();

      if (s.shake > 0) ctx.restore();

      drawBanner();

      ctx.save();
      ctx.globalAlpha = 0.16;
      const bottomGlow = ctx.createLinearGradient(0, s.height - 160, 0, s.height);
      bottomGlow.addColorStop(0, "rgba(78,167,255,0)");
      bottomGlow.addColorStop(1, "rgba(78,167,255,.20)");
      ctx.fillStyle = bottomGlow;
      ctx.fillRect(0, s.height - 160, s.width, 160);
      ctx.restore();
    };

    const setTargetFromEvent = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      s.targetX = clamp(clientX - rect.left - s.shipW / 2, 16, s.width - s.shipW - 16);
      s.targetY = clamp(clientY - rect.top - s.shipH / 2, s.height * 0.34, s.height - s.shipH - 18);

      if (s.dragging) {
        s.shipX = s.targetX;
        s.shipY = s.targetY;
      }
    };

    const onPointerDown = async (event: PointerEvent) => {
      s.dragging = true;
      setTargetFromEvent(event.clientX, event.clientY);
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // ignore
      }
      await ensureAudio();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!s.dragging) return;
      setTargetFromEvent(event.clientX, event.clientY);
    };

    const onPointerUp = () => {
      s.dragging = false;
    };

    const resize = () => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth || window.innerWidth;
      const height = parent?.clientHeight || window.innerHeight;
      const dpr = window.devicePixelRatio || 1;

      s.width = width;
      s.height = height;
      s.dpr = dpr;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (s.stars.length === 0) {
        s.stars = makeStars(width, height);
      }

      s.shipX = width / 2 - s.shipW / 2;
      s.shipY = height - 120;
      s.targetX = s.shipX;
      s.targetY = s.shipY;
    };

    resize();
    spawnWave(1);

    window.addEventListener("resize", resize);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);

    rafRef.current = requestAnimationFrame(function loop(time: number) {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min(0.033, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      update(dt);
      draw();

      rafRef.current = requestAnimationFrame(loop);
    });

    return () => {
      window.removeEventListener("resize", resize);

      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerUp);

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = 0;
    };
  }, []);

  return (
    <section className="game-shell">
      <canvas ref={canvasRef} className="game-canvas" />

      <div className="game-hud">
        <button
          className="hud-back"
          onClick={() => onExit(hud.coins)}
          aria-label={t("gameCanvas.backToLobby")}
        >
          <UiIcons name="back" className="hud-back-icon" />
        </button>

        <div className="hud-row">
          <div className="hud-chip">
            <small>{t("gameCanvas.wave")}</small>
            <strong>
              {hud.wave}/{TOTAL_WAVES}
            </strong>
          </div>

          <div className="hud-chip gold">
            <small>{t("gameCanvas.coins")}</small>
            <strong>{hud.coins}</strong>
          </div>

          <div className="hud-chip cyan">
            <small>{t("gameCanvas.energy")}</small>
            <strong>{hud.energy}/5</strong>
          </div>
        </div>

        <div className="hud-status">{hud.status}</div>
      </div>

      {result && (
        <div className="game-overlay">
          <div className={`result-card ${result.tone}`}>
            <p className="result-kicker">
              {result.tone === "win" ? t("gameCanvas.victory") : t("gameCanvas.runEnded")}
            </p>
            <h2>{result.title}</h2>
            <span>{result.text}</span>
            <button onClick={() => onExit(hud.coins)}>{t("gameCanvas.backToLobby")}</button>
          </div>
        </div>
      )}
    </section>
  );
}

SLYEOF

mkdir -p "$(dirname "src/App.tsx")"
cat > "src/App.tsx" << 'SLYEOF'
import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

import Background from "./components/Background";
import BottomNav from "./components/BottomNav";
import TopBar from "./components/TopBar";

import Home from "./pages/Home";
import Tasks from "./pages/Tasks";
import Referrals from "./pages/Referrals";
import Profile from "./pages/Profile";
import Stars from "./pages/Stars";
import Games from "./pages/Games";
import GameCanvas from "./components/GameCanvas";
import MandatorySubscription from "./components/MandatorySubscription";
import SplashScreen from "./components/SplashScreen";
import { tryAcquireGlobalAdLock, releaseGlobalAdLock, getAdLockWaitSeconds } from "./lib/adLock";

import ExchangeModal from "./modals/ExchangeModal";
import WithdrawalModal from "./modals/WithdrawalModal";
import { useLanguage } from "./i18n/LanguageContext";

export type Page = "home" | "tasks" | "referrals" | "stars" | "games" | "profile";
type ActivityTone = "info" | "reward" | "exchange";

type Activity = {
  id: string;
  title: string;
  meta: string;
  tone: ActivityTone;
};

type WalletState = {
  coins: number;
  usdt: number;
  spent: number;
  walletAddress: string | null;
};

type AdsgramShowResult = {
  done: boolean;
  description: string;
  state: "load" | "render" | "playing" | "destroy";
  error: boolean;
};

type AdsgramController = {
  show: () => Promise<AdsgramShowResult>;
  addEventListener?: (event: string, callback: () => void) => void;
};

declare global {
  interface Window {
    showAdsGalaxy?: () => Promise<any>;
    Adsgram?: {
      init: (opts: { blockId: string }) => AdsgramController;
    };
  }
}


type MiningState = {
  active: boolean;
  reward: number;
  cycleHours: number;
  startedAt: string | null;
  claimAvailableAt: string | null;
  claimReady: boolean;
  startAdVerified: boolean;
  claimAdVerified: boolean;
};

type WithdrawalHistoryEntry = {
  id: number;
  amount: number;
  method: "binance" | "bnb";
  target: string | null;
  bnbAmount: number | null;
  status: "pending" | "completed" | "rejected";
  createdAt: string;
};

const ADSGRAM_BLOCK_ID = "int-46084";
const ADSGRAM_MINING_BLOCK_ID = "46086";
const ADSGRAM_STARS_BLOCK_ID = "46086";
// عدّل هذا لاحقاً برقم Block ID حقيقي من لوحة Adsgram (سوّي وحدة
// إعلانية جديدة بالاسم اللي تحب، مثلاً "SLY Games"). مؤقتاً يستخدم
// نفس وحدة Stars لحد ما تسوي وحدة مخصصة.
const ADSGRAM_GAMES_BLOCK_ID = "46086";
// Stars uses server-side AdsGram reward verification like Mining/Games.
const ADSGRAM_SCRIPT_SRC = "https://sad.adsgram.ai/js/sad.min.js";
// كانت 45 ثانية بس هذا قصير: لو المتصفح/تيليگرام WebView حط تبويبنا
// بالخلفية وقت عرض الإعلان (شي عادي على موبايل)، المؤقتات تتجمّد
// وترجع تشتغل دفعة وحدة بعدين، فـ.show() يتأخر يرجع والمهلة تكون
// خلصت أصلاً - فنعتبرها "فشلت" رغم إن المستخدم اتفرّج على الإعلان
// فعلاً. رفعناها لـ90 ثانية لهامش أكبر.
const MINING_AD_SHOW_TIMEOUT_MS = 90000;
// نص ثابت نستخدمه بمهلة .show() نفسها، نقارن عليه بالـcatch عشان
// نميّز "فشل المهلة" (ممكن الإعلان يكون انعرض فعلاً) عن فشل حقيقي
// آخر (مثلاً الإعلان مو جاهز أو القفل مشغول). بالحالة الأولى ما
// نلغي الـintent، لأن webhook AdsGram الحقيقي ممكن يوصل متأخر
// ويأكد إنو فعلاً اتفرّج عليه.
const AD_SHOW_TIMEOUT_MESSAGE =
  "Ad did not report completion in time. Please try again.";
// AdsGram's server-side reward postback can arrive well after the ad
// finishes playing, especially on slower mobile networks. We poll for
// up to 3 minutes before giving up, and even then we do NOT
// clear the pending intent — a late postback should still be credited.
const AD_VERIFY_MAX_ATTEMPTS = 900;
const AD_VERIFY_POLL_MS = 200;
const MINING_CACHE_KEY = "sly.mining.cache.v1";


function loadCachedMining(): MiningState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MINING_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCachedMining(mining: MiningState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MINING_CACHE_KEY, JSON.stringify(mining));
  } catch {}
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getInitData() {
  const tg = (window as any).Telegram?.WebApp;
  return tg?.initData || "";
}

const DEVICE_ID_KEY = "sly.device_id.v1";

// معرّف جهاز ثابت يتولّد مرة وحدة ويبقى محفوظ بـ localStorage تبع
// الـ WebView. يبقى نفسه حتى لو المستخدم بدّل شبكة الإنترنت أو بدّل
// حساب تيليجرام بنفس تثبيت التطبيق - يستخدم مع IP لمنع تعدد الحسابات.
function getOrCreateDeviceId() {
  if (typeof window === "undefined") return "";

  try {
    let id = window.localStorage.getItem(DEVICE_ID_KEY);

    if (!id) {
      id =
        (window.crypto?.randomUUID?.() as string | undefined) ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random()
          .toString(16)
          .slice(2)}`;

      window.localStorage.setItem(DEVICE_ID_KEY, id);
    }

    return id;
  } catch {
    return "";
  }
}


function getClientSignals() {
  if (typeof window === "undefined") return ""

  try {
    const nav = window.navigator
    const screenInfo = window.screen

    const timezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || ""

    return JSON.stringify({
      userAgent: nav.userAgent || "",
      platform: (nav as any).platform || "",
      language: nav.language || "",
      timezone,
      screen:
        `${screenInfo?.width || 0}x${screenInfo?.height || 0}x${window.devicePixelRatio || 1}`,
      colorDepth:
        Number(screenInfo?.colorDepth || 0),
      hardwareConcurrency:
        Number(nav.hardwareConcurrency || 0),
      deviceMemory:
        Number((nav as any).deviceMemory || 0),
    })
  } catch {
    return ""
  }

}

async function callApi(path: string, options: RequestInit = {}) {
  const initData = getInitData();
  const res = await fetch(path, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `tga ${initData}`,
      "X-Device-Id": getOrCreateDeviceId(),
      "X-Client-Signals": getClientSignals(),
      "Cache-Control": "no-cache",
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}


type RequiredChannel = {
  id: string;
  title: string;
  url: string;
  joined: boolean;
};

export default function App() {
  const { t } = useLanguage();
  const [page, setPage] = useState<Page>("home");
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const [wallet, setWallet] = useState<WalletState>({
    coins: 0,
    usdt: 0,
    spent: 0,
    walletAddress: null,
  });

  const [streak, setStreak] = useState(0);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState("");

  const [splashVisible, setSplashVisible] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [splashProgress, setSplashProgress] = useState(6);

  useEffect(() => {
    if (!splashVisible || !booting || bootError) return;
    const id = setInterval(() => {
      setSplashProgress((prev) => (prev >= 90 ? prev : prev + (90 - prev) * 0.08 + 0.4));
    }, 120);
    return () => clearInterval(id);
  }, [splashVisible, booting, bootError]);

  useEffect(() => {
    if (bootError) {
      setSplashVisible(false);
      return;
    }
    if (!booting && splashVisible) {
      setSplashProgress(100);
      const fadeTimer = setTimeout(() => setSplashFading(true), 250);
      const hideTimer = setTimeout(() => setSplashVisible(false), 700);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [booting, bootError, splashVisible]);

  const [membershipVerified, setMembershipVerified] =
    useState(true);

  const [requiredChannels, setRequiredChannels] =
    useState<RequiredChannel[]>([]);

  const [membershipChecking, setMembershipChecking] =
    useState(false);
  const [adsgramReady, setAdsgramReady] = useState(false);
  const adsgramControllerRef = useRef<AdsgramController | null>(null);
  const adsgramMiningControllerRef = useRef<AdsgramController | null>(null);
  const adsgramStarsControllerRef = useRef<AdsgramController | null>(null);
  const adsgramGamesControllerRef = useRef<AdsgramController | null>(null);
  // true طول ما جولة Laser Escape شغالة. يمنع الإعلان التلقائي
  // (showAdsgramAd، يشتغل بمؤقت دوري طول عمر التطبيق) من الظهور
  // فجأة وسط اللعب - نستخدم ref مو state حتى القيمة توصل فورية
  // لأي setTimeout شغال وقتها بدون ما تنتظر إعادة رندر.
  const playingLaserEscapeRef = useRef(false);

  // حالة MINING تعيش هنا (بمستوى App) مو داخل صفحة Home، حتى ما تنقطع
  // عملية start/claim إذا المستخدم بدّل صفحة قبل ما توصل تأكيدة الإعلان
  const [mining, setMining] = useState<MiningState>(
    loadCachedMining() ?? {
      active: false,
      reward: 0,
      cycleHours: 2,
      startedAt: null,
      claimAvailableAt: null,
      claimReady: false,
      startAdVerified: false,
      claimAdVerified: false,
    }
  );
  const [miningAdBusy, setMiningAdBusy] = useState(false);
  const miningAdBusyRef = useRef(false);
  // يتذكر إذا انعرض إعلان المايننق فعلاً لنية start/claim الحالية،
  // حتى لو المستخدم ضضط تاني (retry) بعد ما التأكيد تأخر، ما نعرض
  // إعلان ثاني بلا داعي.
  const miningAdShownForStageRef = useRef<{ start: boolean; claim: boolean }>({
    start: false,
    claim: false,
  });

  useEffect(() => {
    miningAdBusyRef.current = miningAdBusy;
  }, [miningAdBusy]);
  const [miningReady, setMiningReady] = useState(false);
  const [miningToast, setMiningToast] = useState("");

  const [starsAdBusy, setStarsAdBusy] = useState(false);
  const [starsUseBusy, setStarsUseBusy] = useState(false);
  const [starsAdBatchCount, setStarsAdBatchCount] = useState(0);
  // آخر تحديث مؤكد لعداد Stars من السيرفر.
  // يمنع رد GET قديم من الكتابة فوق قيمة أحدث أثناء انتظار webhook.
  const starsAdBatchCountUpdatedAtRef = useRef(0);

  // إذا تم تشغيل الإعلان فعلاً ثم تأخر AdsGram webhook،
  // لا نعرض إعلاناً ثانياً عند إعادة المحاولة.
const [starsAdsRequired, setStarsAdsRequired] = useState(50);
  const [starsCycleUnlocksAt, setStarsCycleUnlocksAt] = useState<string | null>(null);
  const [starsAdToast, setStarsAdToast] = useState("");

  // ---- حالة قسم Games (Laser Escape) ----
  const [gamesAdBusy, setGamesAdBusy] = useState(false);
  const [gamesAdToast, setGamesAdToast] = useState("");
  const [gamesAttemptsRemaining, setGamesAttemptsRemaining] = useState(0);
  const [gamesFreeAttempts, setGamesFreeAttempts] = useState(0);
  const [gamesBonusAttempts, setGamesBonusAttempts] = useState(0);
  const [gamesPlayBusy, setGamesPlayBusy] = useState(false);
  const [playingLaserEscape, setPlayingLaserEscape] = useState(false);
  const [duplicateNotice, setDuplicateNotice] = useState(false);
  const duplicateNoticeDismissedRef = useRef(false);
  const [channelLeftNotice, setChannelLeftNotice] = useState("");

  // بيانات الإحالة: تتحمل مرة وحدة مع بيانات اللاعب الرئيسية
  // (أثناء شاشة الـ loading الرئيسية) بدل ما تعمل fetch خاص بها كل مرة تفتح صفحة Referrals
  const [telegramId, setTelegramId] = useState("");
  const [referralsCount, setReferralsCount] = useState(0);
  const [referralRewardUsdt, setReferralRewardUsdt] = useState(0.01);
  const [referralRequiredTasks, setReferralRequiredTasks] = useState(5);

  // حالة بوابة السحب: عدد الإعلانات المشاهدة + وقت رجوع إمكانية السحب
  const [withdrawalAdsWatched, setWithdrawalAdsWatched] = useState(0);
  const [withdrawalAdsRequired, setWithdrawalAdsRequired] = useState(10);
  const [nextWithdrawalAvailableAt, setNextWithdrawalAvailableAt] = useState<string | null>(null);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalHistoryEntry[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  // إذا AdsGram رفع onNonStopShow (يعني لاحظ أكتر من إعلان ورا بعض)
  // نوقف الإعلان التلقائي شوي أطول - هاي أهم خطوة لتحسين "جودة"
  // الإعلانات بدون ما نقلل عددها بشكل كبير: نوقف بس وقت الشبكة نفسها
  // تحذرنا إنه في سبام.
  const adAutoBackoffUntilRef = useRef(0);

  // الإعلان التلقائي: لو نجح (طلع فعلاً وخلص)، الإعلان الجاي بعد 40 ثانية.
  // لو انلغى/فشل (ما طلع - مثلاً القفل مشغول، أو التطبيق مو ظاهر، أو
  // AdsGram رفض/ماكو fill)، نحاول أسرع - بعد 20 ثانية بس - لين ينجح
  // إعلان، وبعدها يرجع الفاصل لـ40 ثانية.
  const AD_REPEAT_SUCCESS_MS = 40000;
  const AD_REPEAT_RETRY_MS = 20000;
  const adShowInFlightRef = useRef(false);




  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [page]);

  // تحميل SDK الخاص بـ AdsGram
  useEffect(() => {
    if (typeof window === "undefined") return;

    // نسجل onBannerNotFound / onError فعلياً بدل ما نتركهم فاضيين -
    // هذا اللي يفرّق لنا لاحقاً (بفتح الـconsole) بين "ما اكو طلب يوصل
    // للسيرفر أصلاً" و"الطلب يوصل بس AdsGram ما عنده إعلان يعرضه (no
    // fill)" و"في مشكلة رندر/تشغيل فعلية". onNonStopShow تحديداً معناه
    // AdsGram لاحظ إعلانات ورا بعض بسرعة (سبام) - أول ما يصير هذا نوقف
    // الإعلان التلقائي بالخلفية دقيقة كاملة، عشان الجلسة "تهدى" وما
    // يستمر AdsGram يعتبرها سبام وما يحسب الظهورات (Impressions) بشكل
    // صحيح.
    const attachDiagnostics = (
      controller: AdsgramController,
      label: string
    ) => {
      controller.addEventListener?.("onTooLongSession", () => {
        window.location.reload();
      });
      controller.addEventListener?.("onBannerNotFound", () => {
        console.warn(`[AdsGram:${label}] onBannerNotFound (no fill)`);
      });
      controller.addEventListener?.("onError", () => {
        console.warn(`[AdsGram:${label}] onError (render/playback failure)`);
      });
      controller.addEventListener?.("onNonStopShow", () => {
        console.warn(`[AdsGram:${label}] onNonStopShow - backing off auto ads`);
        adAutoBackoffUntilRef.current = Date.now() + 60000;
      });
    };

    const initAdsgram = () => {
      if (!window.Adsgram) return;
      if (!adsgramControllerRef.current) {
        adsgramControllerRef.current = window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID });
        attachDiagnostics(adsgramControllerRef.current, "auto");
      }
      if (!adsgramMiningControllerRef.current) {
        adsgramMiningControllerRef.current = window.Adsgram.init({
          blockId: ADSGRAM_MINING_BLOCK_ID,
        });
        attachDiagnostics(adsgramMiningControllerRef.current, "mining");
      }
      if (!adsgramStarsControllerRef.current) {
        adsgramStarsControllerRef.current = window.Adsgram.init({
          blockId: ADSGRAM_STARS_BLOCK_ID,
        });
        attachDiagnostics(adsgramStarsControllerRef.current, "stars");
      }
      if (!adsgramGamesControllerRef.current) {
        adsgramGamesControllerRef.current = window.Adsgram.init({
          blockId: ADSGRAM_GAMES_BLOCK_ID,
        });
        attachDiagnostics(adsgramGamesControllerRef.current, "games");
      }
      setAdsgramReady(true);
      setMiningReady(true);
    };

    if (window.Adsgram) {
      initAdsgram();
      return;
    }

    const existingScript = document.querySelector(
      `script[src="${ADSGRAM_SCRIPT_SRC}"]`
    );

    if (existingScript) {
      existingScript.addEventListener("load", initAdsgram, { once: true });
      // Safety net: the script tag lives in index.html's <head> now, so it may
      // have already finished loading (or failed) before this effect ran and
      // before the "load" listener above was attached. Poll briefly so we
      // don't get stuck waiting for an event that already fired.
      const pollId = window.setInterval(() => {
        if (window.Adsgram) {
          window.clearInterval(pollId);
          initAdsgram();
        }
      }, 200);
      window.setTimeout(() => window.clearInterval(pollId), 15000);
      return () => window.clearInterval(pollId);
    }

    const script = document.createElement("script");
    script.src = ADSGRAM_SCRIPT_SRC;
    script.async = true;

    script.onload = initAdsgram;
    script.onerror = () => {
      setAdsgramReady(false);
      console.log("Failed to load AdsGram SDK");
    };

    document.head.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, []);



  const showAdsgramAd = async (): Promise<boolean> => {
    if (!adsgramControllerRef.current) return false;
    // ما نعرض إعلان تلقائي وسط جولة لعب شغالة - نستناها تخلص.
    if (playingLaserEscapeRef.current) return false;

    if (adShowInFlightRef.current) return false;

    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return false;
    }

    if (Date.now() < adAutoBackoffUntilRef.current) return false;

    // بدون انتظار: إذا في إعلان ثاني (تلقائي أو ضغطة مستخدم) شغال هلق،
    // نتخطى هذي الدورة بالكامل بدل ما ننتظر الدور. الانتظار هو اللي كان
    // يخلي إعلانين يطلعون ورا بعض بلحظات - وهذا بالضبط اللي يخلي AdsGram
    // يشوفها سبام (onNonStopShow) وما يحسبها Impressions صحيحة.
    if (!tryAcquireGlobalAdLock()) return false;

    adShowInFlightRef.current = true;
    try {
      await adsgramControllerRef.current.show();
      return true;
    } catch (err) {
      console.log("AdsGram ad skipped or unavailable", err);
      return false;
    } finally {
      adShowInFlightRef.current = false;
      releaseGlobalAdLock();
    }
  };

  useEffect(() => {
    if (booting || bootError) return;
    if (!adsgramReady) return;
    if (!membershipVerified) return;

    let cancelled = false;
    let repeatTimer: number | null = null;

    const scheduleNext = (succeeded: boolean) => {
      if (cancelled) return;
      const delay = succeeded ? AD_REPEAT_SUCCESS_MS : AD_REPEAT_RETRY_MS;
      repeatTimer = window.setTimeout(async () => {
        if (cancelled) return;
        const ok = await showAdsgramAd();
        scheduleNext(ok);
      }, delay);
    };

    const FIRST_AD_DELAY_MS = 1000;

    repeatTimer = window.setTimeout(async () => {
      if (cancelled) return;
      const ok = await showAdsgramAd();
      scheduleNext(ok);
    }, FIRST_AD_DELAY_MS);

    return () => {
      cancelled = true;
      if (repeatTimer) window.clearTimeout(repeatTimer);
    };
  }, [booting, bootError, adsgramReady, membershipVerified]);

  useEffect(() => {
    if (!starsAdToast) return;
    const timer = window.setTimeout(() => setStarsAdToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [starsAdToast]);
// نفس Mining/Games:
  // الكلاينت لا يقرر أن الإعلان اكتمل.
  // ننتظر زيادة starsAdBatchCount بعد وصول AdsGram reward webhook.
  const waitForStarsAdVerification = async (
    batchBefore: number
  ) => {
    for (
      let attempt = 0;
      attempt < AD_VERIFY_MAX_ATTEMPTS;
      attempt += 1
    ) {
      try {
        const data = await loadPlayerData();

        if (
          typeof data?.starsAdBatchCount === "number" &&
          data.starsAdBatchCount > batchBefore
        ) {
          return true;
        }
      } catch {}

      await new Promise((resolve) =>
        window.setTimeout(
          resolve,
          AD_VERIFY_POLL_MS
        )
      );
    }

    return false;
  };

  const handleWatchStarsAd = async () => {
    if (starsAdBusy) return

    if (!adsgramStarsControllerRef.current) {
      setStarsAdToast(
        t("app.adStillLoading")
      )
      return
    }

    const batchBefore =
      starsAdBatchCount

    setStarsAdBusy(true)
    setStarsAdToast("")

    if (!tryAcquireGlobalAdLock()) {
      setStarsAdBusy(false)
      setStarsAdToast(
        t("app.pleaseWaitSeconds", { seconds: getAdLockWaitSeconds() })
      )
      return
    }

    try {
      /*
       * Same pattern as Mining/Games:
       *
       * show() starts immediately from the user click.
       * prepare runs in parallel.
       */
      const preparePromise =
        callApi("/api/auth/me", {
          method: "POST",
          body: JSON.stringify({
            action: "stars_ad_prepare",
          }),
        })

      let showResult

      try {
        showResult =
          await adsgramStarsControllerRef
            .current!
            .show()
      } finally {
        releaseGlobalAdLock()
      }

      const prepare =
        await preparePromise

      if (prepare.locked) {
        setStarsCycleUnlocksAt(
          prepare.cycleUnlocksAt ??
            null
        )

        throw new Error(
          t("app.adsLockedDuringCycle")
        )
      }

      if (
        showResult?.error
      ) {
        throw new Error(
          t("app.adFailedToLoadOrComplete")
        )
      }

      /*
       * مهم جداً:
       * لا نسوي ACK من الكلاينت.
       *
       * ننتظر AdsGram Reward webhook
       * حتى يزيد stars_ad_batch_count.
       */
      const verified =
        await waitForStarsAdVerification(
          batchBefore
        )

      if (!verified) {
        /*
         * لا نلغي stars_ad_intent هنا.
         *
         * إذا AdsGram تأخر بالـwebhook،
         * سيبقى الإعلان معلق حتى يصل التأكيد.
         */
        throw new Error(
          "Still confirming your ad with AdsGram — this can take a minute on mobile networks. Try again shortly; no need to rewatch."
        )
      }

      /*
       * جلب آخر قيمة بعد التأكيد.
       */
      const latest =
        await callApi(
          "/api/auth/me",
          {
            method: "GET",
          }
        )

      setStarsAdBatchCount(
        latest?.starsAdBatchCount ??
          batchBefore + 1
      )

      setStarsCycleUnlocksAt(
        latest?.starsCycleUnlocksAt ??
          null
      )

      setStarsAdToast(
        t("app.adVerifiedBy", {
          count: latest?.starsAdBatchCount ?? batchBefore + 1,
          required: starsAdsRequired,
        })
      )

    } catch (err: any) {
      setStarsAdToast(
        err?.message ||
        t("app.somethingWentWrong")
      )
    } finally {
      setStarsAdBusy(false)
    }
  }

  // يفعّل رصيد الإعلانات المتجمّع (كل إعلان = 5 دقائق) ويشغّل دورة
  // احتساب الوقت لمدتها، بنفس نظام الاحتساب الموجود أصلاً (فرق وقت
  // مستمر يُحتسب مع كل ping، مو تايمر بالواجهة).
  const handleUseStarsBalance = async () => {
    if (starsUseBusy || starsAdBusy) return;

    if (starsAdBatchCount <= 0) {
      setStarsAdToast(t("app.watchOneAdFirst"));
      return;
    }

    setStarsUseBusy(true);
    setStarsAdToast("");

    try {
      const result = await callApi("/api/auth/me", {
        method: "POST",
        body: JSON.stringify({ action: "stars_ad_use_balance" }),
      });

      starsAdBatchCountUpdatedAtRef.current = Date.now();
      setStarsAdBatchCount(result.starsAdBatchCount ?? 0);
      setStarsCycleUnlocksAt(result.starsCycleUnlocksAt ?? null);
      setStarsAdToast(t("app.balanceActivated"));
    } catch (err: any) {
      setStarsAdToast(err?.message || t("app.couldNotUseBalance"));
    } finally {
      setStarsUseBusy(false);
    }
  };

  const cancelGamesAd = async () => {
    await callApi("/api/auth/me", {
      method: "POST",
      body: JSON.stringify({ action: "games_ad_cancel" }),
    }).catch(() => {});
  };

  const showGamesAd = async () => {
    const controller = adsgramGamesControllerRef.current;
    if (!controller) {
      throw new Error(t("app.adNotReady"));
    }

    const acquired = tryAcquireGlobalAdLock();
    if (!acquired) {
      throw new Error(t("app.pleaseWaitSeconds", { seconds: getAdLockWaitSeconds() }));
    }

    let timeoutId: number | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error(AD_SHOW_TIMEOUT_MESSAGE));
      }, MINING_AD_SHOW_TIMEOUT_MS);
    });

    try {
      await Promise.race([controller.show(), timeout]);
    } finally {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      releaseGlobalAdLock();
    }
  };

  // نفس أسلوب waitForMiningAdVerification بالضبط: الكلاينت ما يقرر
  // شي بنفسه، بس ينطر لين الـwebhook الحقيقي من AdsGram يرفع العداد
  // فعلاً بقاعدة البيانات (أو تنتهي المهلة).
  const waitForGamesAdVerification = async (bonusBefore: number) => {
    for (let attempt = 0; attempt < AD_VERIFY_MAX_ATTEMPTS; attempt += 1) {
      try {
        const data = await loadPlayerData();
        if (
          typeof data?.gamesBonusAttempts === "number" &&
          data.gamesBonusAttempts > bonusBefore
        ) {
          return true;
        }
      } catch {}

      await new Promise((resolve) =>
        window.setTimeout(resolve, AD_VERIFY_POLL_MS)
      );
    }

    return false;
  };

  const handleWatchGamesAd = async () => {
    if (gamesAdBusy) return;
    if (!adsgramGamesControllerRef.current) {
      setGamesAdToast(t("app.adStillLoading"));
      return;
    }

    setGamesAdBusy(true);
    setGamesAdToast("");

    try {
      const bonusBefore = gamesBonusAttempts;

      // .show() لازم ينطلق بنفس لحظة الكلك بلا await قبله (نفس مشكلة
      // Stars) — طلب الـprepare (نتيجته غير مستخدمة أصلاً هون) يصير
      // بالتوازي معه مو قبله.
      const preparePromise = callApi("/api/auth/me", {
        method: "POST",
        body: JSON.stringify({ action: "games_ad_prepare" }),
      });

      try {
        await Promise.all([showGamesAd(), preparePromise]);
      } catch (adErr: any) {
        // مهلة .show() بس - نسيب الـintent حي عشان webhook AdsGram
        // المتأخر يقدر يأكدها بدون إعادة مشاهدة.
        if (adErr?.message !== AD_SHOW_TIMEOUT_MESSAGE) {
          await cancelGamesAd();
        }
        throw adErr;
      }

      const verified = await waitForGamesAdVerification(bonusBefore);
      if (!verified) {
        // ما نلغي الـintent هنا - الإعلان انعرض فعلاً، وAdsGram ممكن
        // بس يتأخر بإرسال الـwebhook على شبكات الموبايل. محاولة تانية
        // لاحقاً تلتقط التأكيد المتأخر بدون إعادة مشاهدة الإعلان.
        throw new Error(
          t("app.stillConfirmingAd")
        );
      }

      setGamesAdToast(t("app.gotBonusAttempt"));
    } catch (err: any) {
      setGamesAdToast(err?.message === AD_SHOW_TIMEOUT_MESSAGE ? t("app.adTimeoutRetry") : (err?.message || t("app.somethingWentWrong")));
    } finally {
      setGamesAdBusy(false);
    }
  };

  const handlePlayLaserEscape = async () => {
    if (gamesPlayBusy || gamesAttemptsRemaining <= 0) return;

    setGamesPlayBusy(true);
    setGamesAdToast("");

    try {
      const data = await callApi("/api/auth/me", {
        method: "POST",
        body: JSON.stringify({ action: "games_start_attempt" }),
      });

      setGamesAttemptsRemaining(
        data.gamesAttemptsRemaining ?? Math.max(0, gamesAttemptsRemaining - 1)
      );
      setPlayingLaserEscape(true);
      playingLaserEscapeRef.current = true;
    } catch (err: any) {
      setGamesAdToast(err?.message || t("app.couldNotStartRun"));
    } finally {
      setGamesPlayBusy(false);
    }
  };

  const handleLaserEscapeExit = (coinsEarned = 0) => {
    setPlayingLaserEscape(false);
    playingLaserEscapeRef.current = false;

    // فور ما الجولة تخلص، نجرب نعرض إعلان تلقائي على طول بدل ما
    // ننتظر دورة المؤقت العشوائية الجاية.
    showAdsgramAd().catch(() => {});

    if (coinsEarned > 0) {
      callApi("/api/tasks/complete", {
        method: "POST",
        body: JSON.stringify({ taskType: "game_run", reward: coinsEarned }),
      })
        .then(() => {
          handleTaskReward(coinsEarned, t("app.gameRewardTitle", { amount: coinsEarned }), t("app.gameRewardMeta"));
        })
        .catch(() => {
          pushActivity(t("app.couldntRecordReward"), t("app.tryReopeningApp"), "info");
        });
    }
  };

  const loadPlayerData = async () => {
    const requestStartedAt = Date.now();
    const data = await callApi("/api/auth/me", { method: "GET" });

    setWallet((prev) => ({
      ...prev,
      coins: data.coins ?? 0,
      usdt: data.usdtBalance ?? 0,
      walletAddress: data.walletAddress ?? null,
    }));
    setStreak(data.streak ?? 0);
    setWithdrawalAdsWatched(data.withdrawalAdsWatched ?? 0);
    setWithdrawalAdsRequired(data.withdrawalAdsRequired ?? 10);
    setNextWithdrawalAvailableAt(data.nextWithdrawalAvailableAt ?? null);
    setWithdrawalHistory(Array.isArray(data.withdrawalHistory) ? data.withdrawalHistory : []);
    setTelegramId(String(data.telegramId ?? ""));
    setReferralsCount(Number(data.referralsCount ?? 0));
    setReferralRewardUsdt(Number(data.referralRewardUsdt ?? 0.01));
    setReferralRequiredTasks(Number(data.referralRequiredTasks ?? 5));

    const channels =
      Array.isArray(data.requiredChannels)
        ? data.requiredChannels
        : [];

    setRequiredChannels(channels);

    if (data.membershipVerified === false) {
      setMembershipVerified(false);
    } else {
      setMembershipVerified(true);
    }

    if (data.isDuplicateDevice && !duplicateNoticeDismissedRef.current) {
      setDuplicateNotice(true);
    }

    if (data.mining) {
      setMining(data.mining);
      saveCachedMining(data.mining);
    }

    if (
      typeof data.starsAdBatchCount === "number" &&
      requestStartedAt >= starsAdBatchCountUpdatedAtRef.current
    ) {
      setStarsAdBatchCount(data.starsAdBatchCount);
    }
    if (typeof data.starsAdsRequired === "number") {
      setStarsAdsRequired(data.starsAdsRequired);
    }
    if ("starsCycleUnlocksAt" in data) {
      setStarsCycleUnlocksAt(data.starsCycleUnlocksAt ?? null);
    }

    if (typeof data.gamesAttemptsRemaining === "number") {
      setGamesAttemptsRemaining(data.gamesAttemptsRemaining);
    }
    if (typeof data.gamesFreeAttempts === "number") {
      setGamesFreeAttempts(data.gamesFreeAttempts);
    }
    if (typeof data.gamesBonusAttempts === "number") {
      setGamesBonusAttempts(data.gamesBonusAttempts);
    }

    if (Array.isArray(data.channelTasksReset) && data.channelTasksReset.length > 0) {
      try {
        const raw = window.localStorage.getItem("sly.tasks.progress.v3");
        const parsed = raw ? JSON.parse(raw) : {};
        for (const taskId of data.channelTasksReset) {
          delete parsed[String(taskId)];
        }
        window.localStorage.setItem("sly.tasks.progress.v3", JSON.stringify(parsed));
      } catch {}

      window.dispatchEvent(
        new CustomEvent("sly:channel-tasks-reset", { detail: data.channelTasksReset })
      );

      setChannelLeftNotice(
        data.channelTasksReset.length === 1
          ? t("app.channelLeftSingle")
          : t("app.channelLeftMultiple", { count: data.channelTasksReset.length })
      );
    }

    return data;
  };

  useEffect(() => {
    if (!miningToast) return;
    const timer = window.setTimeout(() => setMiningToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [miningToast]);

  const refreshMining = async () => {
    const data = await callApi("/api/auth/me", { method: "GET" });
    if (data.mining) {
      setMining(data.mining);
      saveCachedMining(data.mining);
    }
    return data.mining as MiningState | undefined;
  };

  // يفحص فوراً (بدون انتظار ثانية أولاً) وبعدها كل ثانية - أسرع بالاستجابة
  // من فحص كل ثانية بعد انتظار أول ثانية
  const waitForMiningAdVerification = async (stage: "start" | "claim") => {
    for (let attempt = 0; attempt < AD_VERIFY_MAX_ATTEMPTS; attempt += 1) {
      try {
        const state = await refreshMining();

        // Only backend confirmation unlocks the next action.
        if (stage === "start" && state?.startAdVerified) {
          return true;
        }

        if (stage === "claim" && state?.claimAdVerified) {
          return true;
        }
      } catch {}

      await new Promise((resolve) =>
        window.setTimeout(resolve, AD_VERIFY_POLL_MS)
      );
    }

    return false;
  };

  const showMiningAd = async () => {
    const controller = adsgramMiningControllerRef.current;
    if (!controller) {
      throw new Error(t("app.miningAdNotReady"));
    }

    const acquired = tryAcquireGlobalAdLock();
    if (!acquired) {
      throw new Error(t("app.pleaseWaitSeconds", { seconds: getAdLockWaitSeconds() }));
    }

    let timeoutId: number | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error(AD_SHOW_TIMEOUT_MESSAGE));
      }, MINING_AD_SHOW_TIMEOUT_MS);
    });

    try {
      await Promise.race([controller.show(), timeout]);
    } finally {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      releaseGlobalAdLock();
    }
  };

  const cancelMiningAd = async () => {
    await callApi("/api/auth/me", {
      method: "POST",
      body: JSON.stringify({ action: "mining_cancel_ad" }),
    }).catch(() => {});
  };

  // كامل عملية start/claim موجودة هنا بمستوى App، فما تنقطع لو المستخدم
  // بدّل الصفحة أثناء انتظار تأكيد الإعلان
  const handleMining = async () => {
    if (miningAdBusy) return;

    setMiningAdBusy(true);
    setMiningToast("");

    try {
      if (!mining.active) {
        // .show() لازم ينطلق بنفس لحظة الكلك بلا await قبله. أول مرة
        // (مو retry) نشغله بالتوازي مع mining_prepare_ad مو بعده. لو
        // هذي محاولة إعادة بعد تأكيد متأخر، الإعلان انعرض أصلاً فما
        // نكرره.
        const alreadyShownStart = miningAdShownForStageRef.current.start;
        const preparePromise = callApi("/api/auth/me", {
          method: "POST",
          body: JSON.stringify({ action: "mining_prepare_ad", stage: "start" }),
        });
        const showPromise = alreadyShownStart
          ? Promise.resolve(null)
          : (async () => {
              miningAdShownForStageRef.current.start = true;
              try {
                return await showMiningAd();
              } catch (adErr: any) {
                // مهلة .show() بس لا تعني فشل حقيقي - ممكن الإعلان يكون
                // انعرض فعلاً والمتصفح تجمّد بالخلفية. نخلي العلم true
                // عشان ما نعرضه مرة ثانية بلا داعي.
                if (adErr?.message !== AD_SHOW_TIMEOUT_MESSAGE) {
                  miningAdShownForStageRef.current.start = false;
                }
                throw adErr;
              }
            })();

        let prepare;
        try {
          [prepare] = await Promise.all([preparePromise, showPromise]);
        } catch (adErr: any) {
          // نفس المبدأ: لو السبب مهلة .show()، ما نلغي الـintent لأن
          // webhook AdsGram الحقيقي ممكن يوصل متأخر ويأكدها.
          if (adErr?.message !== AD_SHOW_TIMEOUT_MESSAGE) {
            await cancelMiningAd();
          }
          throw adErr;
        }

        if (!prepare.alreadyVerified) {
          const verified = await waitForMiningAdVerification("start");
          if (!verified) {
            // Don't cancel — the ad played, AdsGram's postback may just be
            // slow. Leave the intent so a late postback still verifies it.
            throw new Error(
              t("app.tryStartAgainShortly")
            );
          }
        }

        miningAdShownForStageRef.current.start = false;

        const started = await callApi("/api/auth/me", {
          method: "POST",
          body: JSON.stringify({ action: "mining_start" }),
        });

        if (started.mining) {
          setMining(started.mining);
          saveCachedMining(started.mining);
        }

        setMiningToast(t("app.miningStarted"));
        loadPlayerData().catch(() => {});
        return;
      }

      if (!mining.claimReady) {
        throw new Error(t("app.miningCycleNotReady"));
      }

      const alreadyShownClaim = miningAdShownForStageRef.current.claim;
      const preparePromiseClaim = callApi("/api/auth/me", {
        method: "POST",
        body: JSON.stringify({ action: "mining_prepare_ad", stage: "claim" }),
      });
      const showPromiseClaim = alreadyShownClaim
        ? Promise.resolve(null)
        : (async () => {
            miningAdShownForStageRef.current.claim = true;
            try {
              return await showMiningAd();
            } catch (adErr: any) {
              if (adErr?.message !== AD_SHOW_TIMEOUT_MESSAGE) {
                miningAdShownForStageRef.current.claim = false;
              }
              throw adErr;
            }
          })();

      let prepare;
      try {
        [prepare] = await Promise.all([preparePromiseClaim, showPromiseClaim]);
      } catch (adErr: any) {
        if (adErr?.message !== AD_SHOW_TIMEOUT_MESSAGE) {
          await cancelMiningAd();
        }
        throw adErr;
      }

      if (!prepare.alreadyVerified) {
        const verified = await waitForMiningAdVerification("claim");
        if (!verified) {
          // Don't cancel — the ad played, AdsGram's postback may just be
          // slow. Leave the intent so a late postback still verifies it,
          // and a later Claim tap (mining_prepare_ad returns
          // alreadyVerified) picks it up without rewatching an ad.
          throw new Error(
            t("app.tryClaimAgainShortly")
          );
        }
      }

      miningAdShownForStageRef.current.claim = false;

      const claimed = await callApi("/api/auth/me", {
        method: "POST",
        body: JSON.stringify({ action: "mining_claim" }),
      });

      if (claimed.success) {
        const reward = Number(claimed.reward || mining.reward);

        setWallet((prev) => ({ ...prev, coins: prev.coins + reward }));
        pushActivity(
          t("app.miningRewardTitle", { amount: reward.toLocaleString() }),
          t("app.miningRewardMeta"),
          "reward"
        );

        setMining(claimed.mining);
        saveCachedMining(claimed.mining);
        setMiningToast(t("app.miningRewardToast", { amount: reward.toLocaleString() }));
        loadPlayerData().catch(() => {});
      }
    } catch (err: any) {
      setMiningToast(err?.message === AD_SHOW_TIMEOUT_MESSAGE ? t("app.adTimeoutRetry") : (err?.message || t("app.miningActionFailed")));

      // الفرونت كان يفترض حالة غلط (مثلاً "Ready to Start" بينما
      // الباك اند يقول التعدين شغال أصلاً) — نعيد مزامنة الحالة
      // الحقيقية حتى الواجهة تنعكس صح فوراً بدل ما تضل عالقة.
      try {
        await refreshMining();
      } catch {}
    } finally {
      setMiningAdBusy(false);
    }
  };

  const verifyMandatoryMembership =
    async () => {
      if (membershipChecking) {
        return;
      }

      setMembershipChecking(true);

      try {
        const data =
          await loadPlayerData();

        if (
          data.membershipVerified === true
        ) {
          setMembershipVerified(true);
          setRequiredChannels(
            Array.isArray(
              data.requiredChannels
            )
              ? data.requiredChannels
              : []
          );

          return;
        }

        setMembershipVerified(false);

        setRequiredChannels(
          Array.isArray(
            data.requiredChannels
          )
            ? data.requiredChannels
            : []
        );
      } catch (err) {
        console.error(
          "Membership verification failed:",
          err
        );
      } finally {
        setMembershipChecking(false);
      }
    };

  const dismissDuplicateNotice = () => {
    duplicateNoticeDismissedRef.current = true;
    setDuplicateNotice(false);
  };

  const dismissChannelLeftNotice = () => {
    setChannelLeftNotice("");
  };

  const pushActivity = (title: string, meta: string, tone: ActivityTone) => {
    setActivities((prev) => [{ id: makeId(), title, meta, tone }, ...prev].slice(0, 8));
  };

  useEffect(() => {
    let cancelled = false;

    loadPlayerData()
      .then(async (data) => {
        if (cancelled) return;

        if (
          data.membershipVerified === false
        ) {
          return;
        }

        if (!data.claimedToday) {
          try {
            const checkin = await callApi("/api/daily-checkin", { method: "POST" });
            if (cancelled) return;

            if (checkin.success) {
              setWallet((prev) => ({ ...prev, coins: checkin.coins }));
              setStreak(checkin.streak ?? data.streak ?? 0);
              pushActivity(
                t("app.dailyCheckinTitle", { amount: checkin.reward }),
                t("app.dailyCheckinMeta"),
                "reward"
              );
            }
          } catch {
            // فشل صامت هنا؛ يعاد تلقائياً بالمرة الجاية
          }
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = String(err.message || "");
        setBootError(
          msg.includes("authentication")
            ? t("app.bootErrorAuth")
            : t("app.bootErrorGeneric")
        );
      })
      .finally(() => {
        if (!cancelled) setBooting(false);
      });

    const refreshPlayerData = async () => {
      try {
        await loadPlayerData();
      } catch {
        // تجاهل فشل التحديث الخلفي
      }
    };

    const intervalId = window.setInterval(refreshPlayerData, 15 * 1000);
window.addEventListener("focus", refreshPlayerData);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
window.removeEventListener("focus", refreshPlayerData);
    };
  }, []);

  const handleTaskReward = (amount: number, title: string, meta: string) => {
    setWallet((prev) => ({ ...prev, coins: prev.coins + amount }));
    pushActivity(title, meta, "reward");
    loadPlayerData().catch(() => {});
  };

  const handleExchange = async (amountCoins: number) => {
    if (amountCoins <= 0 || amountCoins > wallet.coins) return;

    try {
      const data = await callApi("/api/exchange", {
        method: "POST",
        body: JSON.stringify({ amountCoins }),
      });

      setWallet((prev) => ({
        ...prev,
        coins: data.coins,
        usdt: data.usdtBalance,
        spent: prev.spent + amountCoins,
      }));

      pushActivity(
        t("app.exchangeCompletedTitle"),
        t("app.exchangeCompletedMeta", { coins: amountCoins.toLocaleString(), usdt: data.usdtGained }),
        "exchange"
      );

      loadPlayerData().catch(() => {});
    } catch (err: any) {
      pushActivity(t("app.exchangeFailedTitle"), err.message, "info");
    }
  };

  const handleRedeemGiftCode = async (code: string) => {
    try {
      const data = await callApi("/api/gift-codes/redeem", {
        method: "POST",
        body: JSON.stringify({ code }),
      });

      setWallet((prev) => ({ ...prev, coins: data.coins }));

      pushActivity(
        t("app.giftCodeRedeemedTitle"),
        t("app.giftCodeRedeemedMeta", { amount: Number(data.rewardCoins || 0).toLocaleString() }),
        "reward"
      );

      loadPlayerData().catch(() => {});

      return {
        success: true,
        message: t("app.giftCodeReceived", { amount: Number(data.rewardCoins || 0).toLocaleString() }),
      };
    } catch (err: any) {
      return { success: false, message: err.message || t("app.giftCodeFailed") };
    }
  };

  const handleWithdraw = async (
    amount: number,
    method: "binance" | "bnb",
    target: string
  ) => {
    if (amount <= 0 || amount > wallet.usdt) return;

    try {
      const data = await callApi("/api/withdraw", {
        method: "POST",
        body: JSON.stringify({ amount, method, target }),
      });

      setWallet((prev) => ({ ...prev, usdt: data.usdtBalance }));
      setWithdrawalAdsWatched(0);
      setWithdrawalAdsRequired(
        data.withdrawalAdsRequired ?? 10
      );
      setNextWithdrawalAvailableAt(null);

      pushActivity(
        t("app.withdrawalRequestedTitle"),
        method === "binance"
          ? t("app.withdrawalToBinance", { amount: amount.toFixed(4), target })
          : t("app.withdrawalToGram", { amount: amount.toFixed(4), target: `${target.slice(0, 6)}...${target.slice(-4)}` }),
        "exchange"
      );

      loadPlayerData().catch(() => {});
    } catch (err: any) {
      pushActivity(t("app.withdrawalFailedTitle"), err.message, "info");
    }
  };

  const handleWithdrawAdPrepare = async () => {
    await callApi("/api/auth/me", {
      method: "POST",
      body: JSON.stringify({ action: "withdrawal_prepare_ad" }),
    }).catch(() => {});
  };

  const handleWatchWithdrawAd = async () => {
    // العداد ما عاد يزيد من هنا مباشرة - AdsGram يستدعي webhook آمن
    // (adsgram_reward) بعد ما يتأكد المستخدم شاهد الإعلان فعلاً،
    // وهذا يحدث القيمة الحقيقية بقاعدة البيانات. هنا بس نحدث الحالة
    // المحلية من السيرفر (مصدر الحقيقة الوحيد).
    //
    // نفس مشكلة mining/stars: الـwebhook ممكن يتأخر عن الشبكات
    // الخلوية، فبدل قراءة وحدة فورية، ننطر (poll) لين العداد يزيد
    // فعلاً أو تنتهي المهلة - بدون ما نلغي أي شي بالسيرفر.
    // Keep Watch Ad locked until the backend counter changes.
    // A frontend click/open alone is NOT considered a completed reward.
    const baseline = withdrawalAdsWatched;

    // يبقى الزر Loading/Confirming إلى أن يؤكد الـBackend المكافأة.
    // العداد الحقيقي يأتي من السيرفر فقط.
    while (true) {
      try {
        const data = await loadPlayerData();
        const watched = data.withdrawalAdsWatched ?? 0;
        const required = data.withdrawalAdsRequired ?? 10;

        setWithdrawalAdsWatched(watched);
        setWithdrawalAdsRequired(required);

        if (watched > baseline || watched >= required) {
          return;
        }
      } catch (err) {
        console.log("refresh after watch ad failed", err);
      }

      await new Promise((resolve) =>
        window.setTimeout(resolve, AD_VERIFY_POLL_MS)
      );
    }
  };

  const handleWalletConnected = (address: string) => {
    setWallet((prev) => ({ ...prev, walletAddress: address }));
  };

  const handleWalletDisconnected = () => {
    setWallet((prev) => ({ ...prev, walletAddress: null }));
  };

  const lifetimeCoins = useMemo(() => wallet.coins + wallet.spent, [wallet.coins, wallet.spent]);

  if (splashVisible) {
    return <SplashScreen progress={splashProgress} fading={splashFading} />;
  }

  if (bootError) {
    return (
      <div className="app">
        <Background />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "#eaf4f2",
            padding: 24,
            textAlign: "center",
          }}
        >
          {bootError}
        </div>
      </div>
    );
  }

  if (!membershipVerified) {
    return (
      <div className="app">
        <Background />

        <MandatorySubscription
          channels={requiredChannels}
          loading={membershipChecking}
          onVerify={verifyMandatoryMembership}
        />
      </div>
    );
  }

  if (playingLaserEscape) {
    return <GameCanvas onExit={handleLaserEscapeExit} />;
  }

  return (
    <div className="app">
      <Background />
      <TopBar page={page} coins={wallet.coins} usdt={wallet.usdt} />

      {duplicateNotice ? (
        <div
          style={{
            position: "fixed",
            top: 76,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(120,20,20,0.94)",
            color: "#fff0f0",
            padding: "10px 16px",
            borderRadius: 12,
            fontSize: 12.5,
            fontWeight: 500,
            zIndex: 1000,
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,120,120,0.35)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            maxWidth: "88%",
            textAlign: "center",
          }}
        >
          <span>{t("app.duplicateNotice")}</span>
          <button
            onClick={dismissDuplicateNotice}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff0f0",
              fontSize: 16,
              lineHeight: 1,
              cursor: "pointer",
              padding: 0,
            }}
            aria-label={t("app.dismiss")}
          >
            ×
          </button>
        </div>
      ) : null}

      {channelLeftNotice ? (
        <div
          style={{
            position: "fixed",
            top: 76,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(120,20,20,0.94)",
            color: "#fff0f0",
            padding: "10px 16px",
            borderRadius: 12,
            fontSize: 12.5,
            fontWeight: 500,
            zIndex: 1000,
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,120,120,0.35)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            maxWidth: "88%",
            textAlign: "center",
          }}
        >
          <span>{channelLeftNotice}</span>
          <button
            onClick={dismissChannelLeftNotice}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff0f0",
              fontSize: 16,
              lineHeight: 1,
              cursor: "pointer",
              padding: 0,
            }}
            aria-label={t("app.dismiss")}
          >
            ×
          </button>
        </div>
      ) : null}

      {miningToast ? (
        <div
          style={{
            position: "fixed",
            top: 76,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(18,28,26,0.94)",
            color: "#eaf4f2",
            padding: "10px 18px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 500,
            zIndex: 999,
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            border: "1px solid rgba(64,224,208,0.25)",
            whiteSpace: "nowrap",
          }}
        >
          {miningToast}
        </div>
      ) : null}

      <main className="page-container">
        <div className="page-scroll" ref={scrollRef}>
          {page === "home" && (
            <Home
              streak={streak}
              mining={mining}
              miningReady={miningReady}
              miningAdBusy={miningAdBusy}
              onMining={handleMining}
              onRedeemGiftCode={handleRedeemGiftCode}
            />
          )}

          {page === "tasks" && <Tasks onRewardCoins={handleTaskReward} />}
          {page === "referrals" && (
            <Referrals
              telegramId={telegramId}
              referralsCount={referralsCount}
              referralRewardUsdt={referralRewardUsdt}
              referralRequiredTasks={referralRequiredTasks}
            />
          )}

          {page === "stars" && (
            <Stars
              telegramId={telegramId}
              adBusy={starsAdBusy}
              useBusy={starsUseBusy}
              adBatchCount={starsAdBatchCount}
              adsRequired={starsAdsRequired}
              cycleUnlocksAt={starsCycleUnlocksAt}
              adToast={starsAdToast}
              onWatchAd={handleWatchStarsAd}
              onUseBalance={handleUseStarsBalance}
            />
          )}

          {page === "games" && (
            <Games
              attemptsRemaining={gamesAttemptsRemaining}
              freeAttempts={gamesFreeAttempts}
              bonusAttempts={gamesBonusAttempts}
              adBusy={gamesAdBusy}
              playBusy={gamesPlayBusy}
              adToast={gamesAdToast}
              onWatchAd={handleWatchGamesAd}
              onPlay={handlePlayLaserEscape}
            />
          )}

          {page === "profile" && (
            <Profile
              lifetimeCoins={lifetimeCoins}
              lifetimeSpent={wallet.spent}
              usdtBalance={wallet.usdt}
              activities={activities}
              serverWalletAddress={wallet.walletAddress}
              withdrawalHistory={withdrawalHistory}
              onOpenExchange={() => setExchangeOpen(true)}
              onOpenWithdraw={() => setWithdrawOpen(true)}
              onWalletConnected={handleWalletConnected}
              onWalletDisconnected={handleWalletDisconnected}
            />
          )}
        </div>
      </main>

      <BottomNav page={page} setPage={setPage} />

      <ExchangeModal
        open={exchangeOpen}
        coins={wallet.coins}
        onClose={() => setExchangeOpen(false)}
        onConfirm={handleExchange}
      />

      <WithdrawalModal
        open={withdrawOpen}
        usdtBalance={wallet.usdt}
        walletAddress={wallet.walletAddress}
        withdrawalAdsWatched={withdrawalAdsWatched}
        withdrawalAdsRequired={withdrawalAdsRequired}
        nextWithdrawalAvailableAt={nextWithdrawalAvailableAt}
        onPrepareAd={handleWithdrawAdPrepare}
        onWatchAd={handleWatchWithdrawAd}
        onClose={() => setWithdrawOpen(false)}
        onConfirm={handleWithdraw}
      />
    </div>
  );
}

SLYEOF

echo "تم تطبيق كل تعديلات دعم اللغة العربية بنجاح."
