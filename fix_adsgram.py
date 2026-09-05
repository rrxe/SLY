#!/usr/bin/env python3
"""
يحذف App.tsx الموجود بالجذر (نسخة زايدة)
ثم يعدل ADSGRAM_STARS_BLOCK_ID داخل src/App.tsx ليصير 46261
(Withdrawal و Exchange يضلون على نفس Mining block: 46086)
"""
import re
import sys
from pathlib import Path

NEW_STARS_ID = "46261"
PATTERN = r'(const ADSGRAM_STARS_BLOCK_ID\s*=\s*")([^"]+)(")'

ROOT_APP = Path("App.tsx")
SRC_APP = Path("src/App.tsx")

def main():
    # 1) حذف نسخة الجذر إذا موجودة
    if ROOT_APP.exists():
        ROOT_APP.unlink()
        print(f"🗑️  تم حذف: {ROOT_APP}")
    else:
        print(f"ℹ️  ما في {ROOT_APP} أصلاً، تجاوزنا الحذف")

    # 2) تعديل النسخة الصحيحة داخل src/
    if not SRC_APP.exists():
        print(f"❌ ما لقيت {SRC_APP}")
        sys.exit(1)

    content = SRC_APP.read_text(encoding="utf-8")
    match = re.search(PATTERN, content)

    if not match:
        print(f"❌ ما لقيت ADSGRAM_STARS_BLOCK_ID داخل {SRC_APP}")
        sys.exit(1)

    old_id = match.group(2)
    if old_id == NEW_STARS_ID:
        print(f"✅ {SRC_APP}: القيمة أصلاً {NEW_STARS_ID}")
    else:
        new_content = re.sub(PATTERN, rf'\g<1>{NEW_STARS_ID}\g<3>', content)
        SRC_APP.write_text(new_content, encoding="utf-8")
        print(f"✅ {SRC_APP}: ADSGRAM_STARS_BLOCK_ID  {old_id} → {NEW_STARS_ID}")

    print("ℹ️  Mining / Exchange / Withdrawal ضلوا بدون تغيير (46086)")

if __name__ == "__main__":
    main()
