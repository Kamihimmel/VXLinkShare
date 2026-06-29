@echo off
setlocal enabledelayedexpansion
set QUIET=
if "%~1"=="--quiet" set QUIET=1

if "%QUIET%"=="" (
    for /f "tokens=2 delims=:" %%V in ('findstr /c:"\"version\"" firefox\manifest.json 2^>nul') do set VERSION=%%V
    set VERSION=!VERSION:"=!
    set VERSION=!VERSION:,=!
    set VERSION=!VERSION: =!
    if "!VERSION!"=="" set VERSION=unknown
    echo VXLinkShare version: !VERSION!
    echo Trigger: clean
    echo Cleaning generated extension files...
)

for %%T in (chrome firefox safari) do (
    if exist %%T\common.js del /q %%T\common.js
    if exist %%T\sites.js del /q %%T\sites.js
    if exist %%T\background.js del /q %%T\background.js
    if exist %%T\content.js del /q %%T\content.js
    if exist %%T\options.html del /q %%T\options.html
    if exist %%T\options.js del /q %%T\options.js
    if exist %%T\options.css del /q %%T\options.css
    if exist %%T\icon128.png del /q %%T\icon128.png
    if exist %%T\icon32.png del /q %%T\icon32.png
    if exist %%T\icon48.png del /q %%T\icon48.png
    if exist %%T\icon64.png del /q %%T\icon64.png
    if exist %%T\icon96.png del /q %%T\icon96.png
    if exist %%T\_locales rmdir /s /q %%T\_locales
    if "%QUIET%"=="" echo Cleaned generated assets from %%T/
)

if "%QUIET%"=="" (
    echo Clean completed successfully!
    echo Trigger: clean-complete
)
