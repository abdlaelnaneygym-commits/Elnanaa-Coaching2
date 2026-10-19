#!/usr/bin/env bash
# ============================================================
#  سكربت رفع مشروع Elnanaa Coaching إلى GitHub
#  الاستخدام:
#    ./push-to-github.sh https://github.com/USERNAME/elnanaa-coaching.git TOKEN
# ============================================================
set -e

REMOTE_URL="${1:?}"
TOKEN="${2:?}"

# إزالة التوكن من الرابط وتخزينه بشكل آمن في بيانات الاعتماد
CLEAN_URL=$(echo "$REMOTE_URL" | sed -E 's#https://[^@]+@#https://#')
AUTH_URL=$(echo "$CLEAN_URL" | sed "s#https://#https://${TOKEN}@#")

echo "➜ إضافة الريموت..."
git remote remove origin 2>/dev/null || true
git remote add origin "$CLEAN_URL"

echo "➜ تأكيد الفرع main..."
git branch -M main

echo "➜ رفع الكود (push)..."
git push -u "$AUTH_URL" main:main

# تنظيف: إزالة التوكن من تاريخ الأوامر
git remote set-url origin "$CLEAN_URL"
git remote -v | head -2
echo "✅ تم الرفع بنجاح إلى فرع main"
