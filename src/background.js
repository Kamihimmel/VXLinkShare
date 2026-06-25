// VX Link Share - Background Entry Point
// MV3 service worker (Chrome/Safari): pull in deps via importScripts.
// MV2 background page (Firefox): manifest's background.scripts already loaded them.
if (typeof importScripts !== 'undefined') {
    importScripts('common.js', 'sites.js');
}

VX.initBackground();
