#!/bin/bash
set -e

AUTO_VERSION=""
if [ "${1:-}" = "--auto-version" ]; then
    AUTO_VERSION="${2:-patch}"
elif [ -n "${VX_AUTO_VERSION:-}" ]; then
    AUTO_VERSION="$VX_AUTO_VERSION"
fi

if [ -n "$AUTO_VERSION" ]; then
    node scripts/bump-version.js "$AUTO_VERSION"
fi

VERSION=$(python3 - <<'PY'
import json
with open('firefox/manifest.json', encoding='utf-8') as f:
    print(json.load(f)['version'])
PY
)
echo "VXLinkShare version: $VERSION"
echo "Trigger: build"
echo "Building VXLinkShare extensions..."

# Automatically clean previous build products
if [ -f "./clean.sh" ]; then
    ./clean.sh --quiet
fi

# Ensure target directories exist
mkdir -p chrome firefox safari

# Copy common files to target folders
for target in chrome firefox safari; do
    cp src/common.js "$target/common.js"
    cp src/sites.js "$target/sites.js"
    cp src/background.js "$target/background.js"
    cp src/content.js "$target/content.js"
    cp src/options/options.html "$target/options.html"
    cp src/options/options.js "$target/options.js"
    cp src/options/options.css "$target/options.css"
    cp src/icon128.png "$target/icon128.png"
    cp src/icon32.png "$target/icon32.png"
    cp src/icon48.png "$target/icon48.png"
    cp src/icon64.png "$target/icon64.png"
    cp src/icon96.png "$target/icon96.png"
    rm -rf "$target/_locales"
    cp -R src/_locales "$target/_locales"
    echo "Copied shared assets to $target/"
done

echo "Build completed successfully!"
echo "Trigger: build-complete"
