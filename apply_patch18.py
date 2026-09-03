import io

edits = [
    {
        "path": "src/App.tsx",
        "old": '''  // تأخير الإعلان الجاي حسب ترتيبه بالجلسة:
  // أول إعلان: 40 ثانية - ثاني إعلان: 60 ثانية - ثالث إعلان: 90 ثانية
  // رابع إعلان وطالع: عشوائي بين 60 و90 ثانية، يتكرر.
  const getNextAdDelayMs = () => {
    const index = adSequenceIndexRef.current;
    adSequenceIndexRef.current += 1;

    if (index === 0) return 40000;
    if (index === 1) return 60000;
    if (index === 2) return 90000;

    const minMs = 100000;
    const maxMs = 180000;
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  };''',
        "new": '''  const AD_DELAY_CYCLE_MS = [40000, 50000, 60000];

  const getNextAdDelayMs = () => {
    const index = adSequenceIndexRef.current;
    adSequenceIndexRef.current += 1;

    return AD_DELAY_CYCLE_MS[index % AD_DELAY_CYCLE_MS.length];
  };''',
    },
]

for change in edits:
    path = change["path"]
    with io.open(path, "r", encoding="utf-8") as f:
        content = f.read()

    count = content.count(change["old"])

    if count == 0:
        if change["new"] in content:
            print(f"[skip] {path}: التعديل موجود مسبقاً")
        else:
            print(f"[FAIL] {path}: ما لقيت النص المطلوب تبديله")
        continue

    if count > 1:
        print(f"[FAIL] {path}: النص تكرر {count} مرة - وقفت بلا تعديل")
        continue

    content = content.replace(change["old"], change["new"], 1)

    with io.open(path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"[ok] {path}: انعدّل")

print("\nخلص. راجع git diff قبل ما تعمل push.")
