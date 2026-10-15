#!/usr/bin/env sh
# Dev-only check: the header block must be byte-identical on every page.
# The only allowed difference is aria-current="page" on the current item, which is stripped before comparing.
set -eu
cd "$(dirname "$0")/.."
extract() { sed -n '/^<header class="site-nav">/,/^<\/header>/p' "$1" | sed 's/ aria-current="page"//'; }
ref=$(extract index.html)
if [ -z "$ref" ]; then echo "no header block found in index.html"; exit 1; fi
status=0
for f in */index.html; do
  if [ "$(extract "$f")" != "$ref" ]; then echo "nav differs: $f"; status=1; fi
done
[ "$status" -eq 0 ] && echo "nav identical on all pages"
exit "$status"
