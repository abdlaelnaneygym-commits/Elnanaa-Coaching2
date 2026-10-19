#!/usr/bin/env bash
# ================================================================
#  رفع مشروع Elnanaa Coaching إلى مستودعك على GitHub
#
#  الاستخدام (أمر واحد فقط — ضع التوكن مكان XXXX):
#    ./push-to-github.sh ghp_XXXXXXXXXXXXXXXXXXXX
# ================================================================
set -e

REPO="https://github.com/abdlaelnaneygym-commits/elnanaa-coaching2.git"
TOKEN="${1:?استخدام: ./push-to-github.sh ghp_التوكن_هنا}"
TOKEN="${1}"

echo "➜ [1/4] إضافة الريموت..."
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO"

echo "➜ [2/4] تأكيد الفرع main..."
git branch -M main

echo "➜ [3/4] الرفع إلى GitHub (push)..."
git push -u "https://${TOKEN}@github.com/abdlaelnaneygym-commits/elnanaa-coaching2.git" main:main --force

echo "➜ [4/4] تنظيف بيانات الاعتماد من الريموت..."
git remote set-url origin "$REPO"

echo
echo "✅ تم رفع الكود بنجاح إلى فرع main"
echo "🔗 https://github.com/abdlaelnaneygym-commits/elnanaa-coaching2"
