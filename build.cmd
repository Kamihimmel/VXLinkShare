@echo off
echo Building VXLinkShare extensions...

if not exist chrome mkdir chrome
if not exist firefox mkdir firefox
if not exist safari mkdir safari

for %%T in (chrome firefox safari) do (
    copy /y src\common.js %%T\common.js >nul
    copy /y src\background.js %%T\background.js >nul
    copy /y src\content.js %%T\content.js >nul
    copy /y src\options\options.html %%T\options.html >nul
    copy /y src\options\options.js %%T\options.js >nul
    copy /y src\options\options.css %%T\options.css >nul
    copy /y src\icon128.png %%T\icon128.png >nul
    echo Copied shared assets to %%T/
)

echo Build completed successfully!
