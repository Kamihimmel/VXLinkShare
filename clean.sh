#!/bin/bash
echo "Cleaning generated extension files..."

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
    echo "Cleaned generated assets from $target/"
done

echo "Clean completed successfully!"
