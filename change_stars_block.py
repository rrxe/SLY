from pathlib import Path
import re
import sys

p = Path("src/App.tsx")

if not p.exists():
    print("❌ src/App.tsx غير موجود")
    sys.exit(1)

s = p.read_text(encoding="utf-8")

pattern = r'(ADSGRAM_STARS_BLOCK_ID\s*=\s*["\'])46643(["\'])'

s2, count = re.subn(
    pattern,
    r'\g<1>46086\g<2>',
    s,
    count=1
)

if count == 0:
    print("❌ لم أجد Stars Block ID = 46643")
    sys.exit(1)

p.write_text(s2, encoding="utf-8")

print("✅ تم تغيير Stars Ads Block ID")
print("46643 → 46086")
