#!/usr/bin/env bash
# Permanent deploy: local folder wins, never rebase.
# Git Bash:  bash deploy-github.sh
set -euo pipefail
cd "$(dirname "$0")"

git rebase --abort 2>/dev/null || true
git merge --abort 2>/dev/null || true

if [ ! -d .git ]; then
  git init
  git branch -M main
fi

git config pull.rebase false
git config rebase.autoStash false

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin https://github.com/brownstoneresearch/kengriffin.courses.git
else
  git remote add origin https://github.com/brownstoneresearch/kengriffin.courses.git
fi

touch .gitignore
grep -qxF '.env' .gitignore || echo '.env' >> .gitignore

git add -A
git diff --cached --quiet || git commit -m "Deploy Ken Cordele Griffin Academy"

git fetch origin || true
git push --force-with-lease origin HEAD:main

echo
echo "Deployed: https://github.com/brownstoneresearch/kengriffin.courses"
echo "Pages: Settings → Pages → branch main / (root) → kengriffin.courses"
