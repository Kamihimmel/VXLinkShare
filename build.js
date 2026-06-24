const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const targets = [
    path.join(__dirname, 'chrome'),
    path.join(__dirname, 'firefox'),
    path.join(__dirname, 'safari')
];

// Helper to copy file
function copyFile(src, dest) {
    fs.copyFileSync(src, dest);
    console.log(`Copied: ${path.relative(__dirname, src)} -> ${path.relative(__dirname, dest)}`);
}

// Ensure targets exist
targets.forEach(target => {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }
});

console.log('Building VXLinkShare extensions...');

targets.forEach(target => {
    // Copy common.js to target root
    copyFile(path.join(srcDir, 'common.js'), path.join(target, 'common.js'));
    
    // Copy content.js to target root
    copyFile(path.join(srcDir, 'content.js'), path.join(target, 'content.js'));

    // Copy background.js to target root
    copyFile(path.join(srcDir, 'background.js'), path.join(target, 'background.js'));
    
    // Copy options files to target root
    copyFile(path.join(srcDir, 'options', 'options.html'), path.join(target, 'options.html'));
    copyFile(path.join(srcDir, 'options', 'options.js'), path.join(target, 'options.js'));
    copyFile(path.join(srcDir, 'options', 'options.css'), path.join(target, 'options.css'));
    
    // Copy icon to target root
    copyFile(path.join(srcDir, 'icon128.png'), path.join(target, 'icon128.png'));
});

console.log('Build completed successfully!');
