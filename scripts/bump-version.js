#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const manifestPaths = ['chrome/manifest.json', 'firefox/manifest.json', 'safari/manifest.json'];
const mode = process.argv[2] || 'patch';
const explicitVersion = mode === 'set' ? process.argv[3] : null;

function parseVersion(version) {
    if (!/^\d+(?:\.\d+){0,3}$/.test(version)) {
        throw new Error(`Unsupported manifest version "${version}". Expected 1-4 numeric parts.`);
    }
    return version.split('.').map(Number);
}

function formatVersion(parts) {
    return parts.join('.');
}

function bump(version, bumpMode) {
    const parts = parseVersion(version);
    while (parts.length < 3) parts.push(0);

    if (bumpMode === 'major') {
        parts[0] += 1;
        parts[1] = 0;
        parts[2] = 0;
        return formatVersion(parts.slice(0, 3));
    }
    if (bumpMode === 'minor') {
        parts[1] += 1;
        parts[2] = 0;
        return formatVersion(parts.slice(0, 3));
    }
    if (bumpMode === 'patch') {
        parts[2] += 1;
        return formatVersion(parts.slice(0, 3));
    }
    throw new Error(`Unknown bump mode "${bumpMode}". Use patch, minor, major, or set <version>.`);
}

function readManifest(relPath) {
    const absPath = path.join(repoRoot, relPath);
    return { relPath, absPath, data: JSON.parse(fs.readFileSync(absPath, 'utf8')) };
}

const manifests = manifestPaths.map(readManifest);
const versions = new Set(manifests.map((manifest) => manifest.data.version));
if (versions.size !== 1) {
    throw new Error(`Manifest versions are out of sync: ${manifests.map((m) => `${m.relPath}=${m.data.version}`).join(', ')}`);
}

const currentVersion = manifests[0].data.version;
const nextVersion = explicitVersion || bump(currentVersion, mode);
parseVersion(nextVersion);

for (const manifest of manifests) {
    manifest.data.version = nextVersion;
    fs.writeFileSync(manifest.absPath, `${JSON.stringify(manifest.data, null, 2)}\n`);
}

console.log(`VXLinkShare version: ${currentVersion} -> ${nextVersion}`);
