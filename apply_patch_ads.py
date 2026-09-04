import io

edits = [
    # 1) index.html: إزالة تحميل AdsGram من الـ head وإرجاعه للوضع السابق
    {
        "path": "index.html",
        "old": '''    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>sly</title>

    <!-- تسريع الاتصال بسيرفرات AdsGram قبل ما نحتاجها فعلياً -->
    <link rel="preconnect" href="https://sad.adsgram.ai" crossorigin />
    <link rel="dns-prefetch" href="https://sad.adsgram.ai" />

    <!-- تحميل SDK الخاص بـ AdsGram أول شي، بالتوازي مع كل شي ثاني،
         بدل ما ننتظر React يشتغل ويحقن السكربت بجافاسكريبت -->
    <script src="https://sad.adsgram.ai/js/sad.min.js" async></script>
  </head>
  <body>
    <div id="root"></div>

    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <script type="module" src="/src/main.tsx"></script>
  </body>''',
        "new": '''    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>sly</title>
  </head>
  <body>
    <div id="root"></div>

    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <script type="module" src="/src/main.tsx"></script>
  </body>''',
    },

    # 2) server.js: إزالة handlers التي تمت إضافتها للكراش
    {
        "path": "server.js",
        "old": """const __dirname = path.dirname(fileURLToPath(import.meta.url))

// حماية من الكراش المفاجئ: بدون هذا، أي خطأ غير متوقع (تايم آوت من
// Supabase، خطأ شبكة، إلخ) يقدر يوقف عملية Node كلها فيعيد Dokploy
// تشغيل الحاوية من جديد => هذا يفسر "أحياناً يشتغل وينطفي"
process.on('unhandledRejection', (err) => {
  console.error('[unhandledRejection]', err)
})
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err)
})

const app = express()""",
        "new": """const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()""",
    },

    # 3) lib/telegram-membership.js: إزالة timeout وإرجاع fetch الأصلي
    {
        "path": "lib/telegram-membership.js",
        "old": '''export async function getChannelMembershipStatus(botToken, chatId, userId) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 4000)

  try {
    const url =
      `https://api.telegram.org/bot${botToken}/getChatMember` +
      `?chat_id=${encodeURIComponent(chatId)}` +
      `&user_id=${encodeURIComponent(userId)}`

    const res = await fetch(url, { signal: controller.signal })
    const data = await res.json()

    if (!data.ok) {
      return {
        ok: false,
        description: data.description || 'unknown_error',
      }
    }

    return {
      ok: true,
      status: data.result?.status || null,
    }
  } catch (err) {
    return {
      ok: false,
      description:
        err.name === 'AbortError' ? 'timeout' : err.message || 'network_error',
    }
  } finally {
    clearTimeout(timeoutId)
  }
}''',
        "new": '''export async function getChannelMembershipStatus(botToken, chatId, userId) {
  try {
    const url =
      `https://api.telegram.org/bot${botToken}/getChatMember` +
      `?chat_id=${encodeURIComponent(chatId)}` +
      `&user_id=${encodeURIComponent(userId)}`

    const res = await fetch(url)
    const data = await res.json()

    if (!data.ok) {
      return {
        ok: false,
        description: data.description || 'unknown_error',
      }
    }

    return {
      ok: true,
      status: data.result?.status || null,
    }
  } catch (err) {
    return {
      ok: false,
      description: err.message || 'network_error',
    }
  }
}''',
    },

    # 4) api/auth/me.js: إرجاع فحص القنوات للتتابع كما كان
    {
        "path": "api/auth/me.js",
        "old": '''  const checks = await Promise.all(
    completions.map(async (completion) => {
      const task = taskById[completion.task_id]
      if (!task) return null

      const channelChatId = extractChannelChatId(task.url)
      if (!channelChatId) return null

      const membership = await getChannelMembershipStatus(
        botToken,
        channelChatId,
        telegramId
      )

      if (!membership.ok) return null
      if (!isConfirmedNotJoined(membership.status)) return null

      return task.id
    })
  )

  const leftChannelTaskIds = checks.filter((id) => id !== null)''',
        "new": '''  const leftChannelTaskIds = []

  for (const completion of completions) {
    const task = taskById[completion.task_id]
    if (!task) continue

    const channelChatId = extractChannelChatId(task.url)
    if (!channelChatId) continue

    const membership = await getChannelMembershipStatus(
      botToken,
      channelChatId,
      telegramId
    )

    if (!membership.ok) continue
    if (!isConfirmedNotJoined(membership.status)) continue

    leftChannelTaskIds.push(task.id)
  }''',
    },
]


for change in edits:
    path = change["path"]

    try:
        with io.open(path, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        print(f"[FAIL] {path}: الملف غير موجود - شغل السكربت من جذر المشروع")
        continue

    count = content.count(change["old"])

    if count == 0:
        if change["new"] in content:
            print(f"[skip] {path}: يبدو أنه رجع للوضع القديم مسبقاً")
        else:
            print(f"[FAIL] {path}: ما لقيت التعديل المطلوب عكسه")
        continue

    if count > 1:
        print(f"[FAIL] {path}: التعديل موجود {count} مرات - وقفت")
        continue

    content = content.replace(change["old"], change["new"], 1)

    with io.open(path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"[ok] {path}: تم إرجاعه للوضع السابق")


print("\nتم عكس السكربت.")
print("شغّل الآن: git diff")
print("وتأكد أن التغييرات هي فقط عكس التعديلات السابقة.")
