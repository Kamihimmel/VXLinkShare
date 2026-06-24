#!/bin/bash
echo "Cleaning generated extension files..."

for target in chrome firefox safari; do
    rm -f "$target/common.js" \
          "$target/background.js" \
          "$target/content.js" \
          "$target/options.html" \
          "$target/options.js" \
          "$target/options.css" \
          "$target/icon128.png"
    echo "Cleaned generated assets from $target/"
done

echo "Clean completed successfully!"
