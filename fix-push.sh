#!/usr/bin/env bash
# Run this in Git Bash from the kengriffin-courses folder.
set -euo pipefail
cd "$(dirname "$0")"

if [ -d .git/rebase-merge ] || [ -d .git/rebase-apply ]; then
  git rebase --abort || true
fi

grep -q '^\.env$' .gitignore 2>/dev/null || echo '.env' >> .gitignore

git add -A
git status
git commit -m "Deploy academy site, portal, Supabase, market curriculum" || true

# Keep YOUR files if GitHub and local both edited the same path
git fetch origin
if git rev-parse --verify origin/main >/dev/null 2>&1; then
  git merge origin/main --allow-unrelated-histories -m "Merge origin/main, keep local site" || true
  # resolve by taking the working-tree (local) version
  git checkout --ours . 2>/dev/null || true
  git add -A
  git commit -m "Resolve deploy conflicts in favor of local site" || true
fi

git push -u origin main
echo "Pushed: https://github.com/brownstoneresearch/kengriffin.courses"
