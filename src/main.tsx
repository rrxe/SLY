import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './i18n/LanguageContext'
import { initTheme, syncThemeFromServer } from './theme/theme'
import { initMusic } from './lib/music'

// يثبّت ارتفاع الواجهة باستخدام SDK تيليجرام نفسه
// (Telegram.WebApp.viewportStableHeight + حدث viewportChanged)، ويتجاهل
// أي *تصغير* بالارتفاع (زي فتح لوحة المفاتيح) - بس يواكب أي تكبير
// حقيقي (تدوير الشاشة). هذا يمنع القفزة البصرية بنوافذ السحب/التحويل
// أول ما تدوس تكتب بأي حقل، لأن تيليجرام هو اللي يدير الـviewport
// جوا تطبيقه المصغّر، مو المتصفح العادي.




// الألوان هي الافتراضي: تبدأ فوراً. ولو المستخدم مختار أبيض وأسود
// ننتظر ملف الستايل الصغير ينحمّل أول، عشان ما يظهر وميض ألوان.
initTheme().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </StrictMode>,
  )

  // بعد ما التطبيق يفتح: المظهر يتطابق مع حساب اللاعب، وتبدأ الموسيقى مع أول لمسة
  void syncThemeFromServer()
  initMusic()
})


