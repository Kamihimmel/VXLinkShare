param(
    [string]$Mode = "patch"
)

$ErrorActionPreference = "Stop"
$manifestPaths = @("chrome/manifest.json", "firefox/manifest.json", "safari/manifest.json")

function Assert-Version([string]$Version) {
    if ($Version -notmatch '^\d+(\.\d+){0,3}$') {
        throw "Unsupported manifest version '$Version'. Expected 1-4 numeric parts."
    }
}

function Bump-Version([string]$Version, [string]$BumpMode) {
    Assert-Version $Version
    $parts = @($Version.Split('.') | ForEach-Object { [int]$_ })
    while ($parts.Count -lt 3) { $parts += 0 }

    switch ($BumpMode) {
        "major" { $parts[0] += 1; $parts[1] = 0; $parts[2] = 0 }
        "minor" { $parts[1] += 1; $parts[2] = 0 }
        "patch" { $parts[2] += 1 }
        default {
            Assert-Version $BumpMode
            return $BumpMode
        }
    }
    return ($parts[0..2] -join '.')
}

$manifests = @()
foreach ($path in $manifestPaths) {
    $text = Get-Content -Raw -Path $path
    $match = [regex]::Match($text, '"version"\s*:\s*"([^\"]+)"')
    if (-not $match.Success) {
        throw "Could not find manifest version in $path"
    }
    $manifests += [pscustomobject]@{ Path = $path; Text = $text; Version = $match.Groups[1].Value }
}

$versions = @($manifests | ForEach-Object { $_.Version } | Select-Object -Unique)
if ($versions.Count -ne 1) {
    $details = ($manifests | ForEach-Object { "$($_.Path)=$($_.Version)" }) -join ', '
    throw "Manifest versions are out of sync: $details"
}

$currentVersion = $versions[0]
$nextVersion = Bump-Version $currentVersion $Mode
Assert-Version $nextVersion

foreach ($manifest in $manifests) {
    $updated = [regex]::Replace(
        $manifest.Text,
        '("version"\s*:\s*")[^"]+(")',
        "`${1}$nextVersion`${2}",
        1
    )
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText((Resolve-Path $manifest.Path).ProviderPath, $updated, $utf8NoBom)
}

Write-Host "VXLinkShare version: $currentVersion -> $nextVersion"
