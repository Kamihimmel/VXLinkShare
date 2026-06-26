@echo off
echo Cleaning generated extension files...

for %%T in (chrome firefox safari) do (
    if exist %%T\common.js del /f /q %%T\common.js
    if exist %%T\sites.js del /f /q %%T\sites.js
    if exist %%T\background.js del /f /q %%T\background.js
    if exist %%T\content.js del /f /q %%T\content.js
    if exist %%T\options.html del /f /q %%T\options.html
    if exist %%T\options.js del /f /q %%T\options.js
    if exist %%T\options.css del /f /q %%T\options.css
    if exist %%T\icon128.png del /f /q %%T\icon128.png
    if exist %%T\icon32.png del /f /q %%T\icon32.png
    if exist %%T\icon48.png del /f /q %%T\icon48.png
    if exist %%T\icon64.png del /f /q %%T\icon64.png
    if exist %%T\icon96.png del /f /q %%T\icon96.png
    if exist %%T\_locales rmdir /s /q %%T\_locales
    echo Cleaned generated assets from %%T/
)

echo Clean completed successfully!
