@echo off
setlocal enabledelayedexpansion

set AUTO_VERSION=
if "%~1"=="--auto-version" (
    if "%~2"=="" (
        set AUTO_VERSION=patch
    ) else (
        set AUTO_VERSION=%~2
    )
)
if not "%VX_AUTO_VERSION%"=="" set AUTO_VERSION=%VX_AUTO_VERSION%
if not "%AUTO_VERSION%"=="" (
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts\bump-version.ps1 %AUTO_VERSION%
    if errorlevel 1 exit /b 1
)

for /f "tokens=2 delims=:" %%V in ('findstr /c:"\"version\"" firefox\manifest.json') do set VERSION=%%V
set VERSION=%VERSION:"=%
set VERSION=%VERSION:,=%
set VERSION=%VERSION: =%

echo VXLinkShare version: %VERSION%
echo Trigger: build
echo Building VXLinkShare extensions...

if exist clean.cmd call clean.cmd --quiet

if not exist chrome mkdir chrome
if not exist firefox mkdir firefox
if not exist safari mkdir safari

for %%T in (chrome firefox safari) do (
    copy /y src\common.js %%T\common.js >nul
    copy /y src\sites.js %%T\sites.js >nul
    copy /y src\background.js %%T\background.js >nul
    copy /y src\content.js %%T\content.js >nul
    copy /y src\options\options.html %%T\options.html >nul
    copy /y src\options\options.js %%T\options.js >nul
    copy /y src\options\options.css %%T\options.css >nul
    copy /y src\icon128.png %%T\icon128.png >nul
    copy /y src\icon32.png %%T\icon32.png >nul
    copy /y src\icon48.png %%T\icon48.png >nul
    copy /y src\icon64.png %%T\icon64.png >nul
    copy /y src\icon96.png %%T\icon96.png >nul
    if exist %%T\_locales rmdir /s /q %%T\_locales
    xcopy /e /i /y src\_locales %%T\_locales >nul
    echo Copied shared assets to %%T/
)

echo Build completed successfully!
echo Trigger: build-complete
