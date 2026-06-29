#!/bin/bash
set -e

QUIET=""
if [ "${1:-}" = "--quiet" ]; then
    QUIET="1"
fi

if [ -z "$QUIET" ]; then
    VERSION=$(node -p "require('./firefox/manifest.json').version" 2>/dev/null || printf 'unknown')
    echo "VXLinkShare version: $VERSION"
    echo "Trigger: clean"
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
done

if [ -z "$QUIET" ]; then
    echo "Trigger: clean-complete"
fi
