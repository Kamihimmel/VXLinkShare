#!/bin/bash
set -e

QUIET=""
if [ "${1:-}" = "--quiet" ]; then
    QUIET="1"
fi

if [ -z "$QUIET" ]; then
    VERSION=$(python3 - <<'PY' 2>/dev/null || printf 'unknown'
import json
with open('firefox/manifest.json', encoding='utf-8') as f:
    print(json.load(f)['version'])
PY
)
    echo "VXLinkShare version: $VERSION"
    echo "Trigger: clean"
    echo "Cleaning generated extension files..."
fi

for target in chrome firefox safari; do
    rm -f "$target/common.js" \
          "$target/sites.js" \
          "$target/background.js" \
          "$target/content.js" \
          "$target/options.html" \
          "$target/options.js" \
          "$target/options.css" \
          "$target/icon128.png"  \
          "$target/icon32.png"   \
          "$target/icon48.png"   \
          "$target/icon64.png"   \
          "$target/icon96.png"
    rm -rf "$target/_locales"
    if [ -z "$QUIET" ]; then
        echo "Cleaned generated assets from $target/"
    fi
done

if [ -z "$QUIET" ]; then
    echo "Clean completed successfully!"
    echo "Trigger: clean-complete"
fi
