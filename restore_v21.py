#!/usr/bin/env python3
import sys, os, shutil, zipfile, tempfile, argparse, filecmp
from datetime import datetime

def find_project_root(extract_dir):
    for root, dirs, files in os.walk(extract_dir):
        if "package.json" in files and "server" in dirs:
            return root
    entries = [e for e in os.listdir(extract_dir) if os.path.isdir(os.path.join(extract_dir, e))]
    if entries:
        return os.path.join(extract_dir, entries[0])
    return extract_dir

def collect_files(base_dir):
    result = []
    for root, _, files in os.walk(base_dir):
        for f in files:
            full = os.path.join(root, f)
            result.append(os.path.relpath(full, base_dir))
    return result

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("zip_path")
    parser.add_argument("project_dir", nargs="?", default=".")
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    zip_path = os.path.abspath(args.zip_path)
    project_dir = os.path.abspath(args.project_dir)

    if not os.path.isfile(zip_path):
        print(f"❌ ملف الزيب مو موجود: {zip_path}"); sys.exit(1)
    if not os.path.isdir(project_dir):
        print(f"❌ مجلد المشروع مو موجود: {project_dir}"); sys.exit(1)

    print(f"📦 فك ضغط: {zip_path}")
    with tempfile.TemporaryDirectory() as tmp:
        with zipfile.ZipFile(zip_path, "r") as z:
            z.extractall(tmp)

        v21_root = find_project_root(tmp)
        print(f"📁 مصدر نسخة 21: {v21_root}")
        print(f"📁 المشروع الهدف: {project_dir}")

        v21_files = collect_files(v21_root)
        to_restore = []
        for rel in v21_files:
            src = os.path.join(v21_root, rel)
            dst = os.path.join(project_dir, rel)
            if args.all:
                to_restore.append(rel); continue
            if not os.path.exists(dst):
                to_restore.append(rel)
            elif not filecmp.cmp(src, dst, shallow=False):
                to_restore.append(rel)

        if not to_restore:
            print("✅ ما في أي فرق، مشروعك مطابق أصلاً لنسخة 21.")
            return

        print(f"\n🔍 عدد الملفات اللي رح تترجع: {len(to_restore)}")
        for rel in to_restore:
            print(f"   - {rel}")

        if args.dry_run:
            print("\n(--dry-run) ما تم تعديل أي شي فعلياً.")
            return

        stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_dir = os.path.join(project_dir, f"backup_before_restore_{stamp}")
        os.makedirs(backup_dir, exist_ok=True)
        print(f"\n🛟 عمل نسخة احتياطية بمجلد: {backup_dir}")
        for rel in to_restore:
            dst = os.path.join(project_dir, rel)
            if os.path.exists(dst):
                backup_path = os.path.join(backup_dir, rel)
                os.makedirs(os.path.dirname(backup_path), exist_ok=True)
                shutil.copy2(dst, backup_path)

        print("♻️  جاري استرجاع ملفات نسخة 21 ...")
        for rel in to_restore:
            src = os.path.join(v21_root, rel)
            dst = os.path.join(project_dir, rel)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(src, dst)
            print(f"   ✔ {rel}")

        print(f"\n✅ تم! المشروع رجع لنسخة 21.")
        print(f"   النسخة الاحتياطية محفوظة في: {backup_dir}")

if __name__ == "__main__":
    main()
