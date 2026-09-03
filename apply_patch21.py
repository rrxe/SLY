import io

edits = [
    {
        "path": "src/App.tsx",
        "old": '    const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 25 دقيقة - هامش أمان قبل الـ 30',
        "new": '    const REFRESH_INTERVAL_MS = 5 * 60 * 1000;',
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
