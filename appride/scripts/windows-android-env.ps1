#Requires -Version 5.1
# Sets ANDROID_HOME / ANDROID_SDK_ROOT and user PATH for local Android builds (Expo / Gradle / adb).
#   npm run setup:android-env
#   npm run setup:android-env -- -SdkRoot D:\Android\sdk
# After a successful run, fully quit and reopen Cursor (or log off) so new env vars load everywhere.

param(
  [string]$SdkRoot = ''
)

$ErrorActionPreference = 'Stop'

$sdk = $SdkRoot.Trim()
if (-not $sdk) {
  $fromUser = [Environment]::GetEnvironmentVariable('ANDROID_HOME', 'User')
  $fromMachine = [Environment]::GetEnvironmentVariable('ANDROID_HOME', 'Machine')
  foreach ($c in @($fromUser, $fromMachine)) {
    if ($c -and (Test-Path -LiteralPath $c)) { $sdk = $c; break }
  }
}
if (-not $sdk) {
  $sdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
}

if (-not (Test-Path -LiteralPath $sdk)) {
  Write-Host ''
  Write-Host 'Android SDK folder was not found:' -ForegroundColor Yellow
  Write-Host "  $sdk" -ForegroundColor Yellow
  Write-Host ''
  Write-Host 'You do not need Android Studio. Options:' -ForegroundColor Cyan
  Write-Host ''
  Write-Host 'A) Command-line tools only (much lighter):' -ForegroundColor White
  Write-Host '   https://developer.android.com/studio#command-line-tools-only' -ForegroundColor DarkGray
  Write-Host '   Install JDK 17+, unpack cmdline-tools, use sdkmanager for platform-tools + build-tools + a platform.' -ForegroundColor DarkGray
  Write-Host '   Then: npm run setup:android-env -- -SdkRoot YOUR_SDK_FOLDER' -ForegroundColor DarkGray
  Write-Host ''
  Write-Host 'B) No local SDK - build in the cloud with EAS:' -ForegroundColor White
  Write-Host '   eas build --platform android' -ForegroundColor DarkGray
  Write-Host '   Install the .apk on your phone (use a dev-client profile if you use native modules).' -ForegroundColor DarkGray
  Write-Host ''
  Write-Host 'C) Full Android Studio (heaviest) if you still want the IDE.' -ForegroundColor White
  Write-Host ''
  exit 1
}

[Environment]::SetEnvironmentVariable('ANDROID_HOME', $sdk, 'User')
[Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT', $sdk, 'User')

$candidates = @(
  (Join-Path $sdk 'platform-tools')
  (Join-Path $sdk 'emulator')
  (Join-Path $sdk 'cmdline-tools\latest\bin')
)

$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if (-not $userPath) { $userPath = '' }
$pathOrder = [System.Collections.Generic.List[string]]::new()
$pathKeys = @{}
foreach ($seg in $userPath.Split(';', [StringSplitOptions]::RemoveEmptyEntries)) {
  $t = $seg.Trim().TrimEnd('\')
  if (-not $t) { continue }
  $key = $t.ToLowerInvariant()
  if ($pathKeys.ContainsKey($key)) { continue }
  $pathKeys[$key] = $true
  [void]$pathOrder.Add($t)
}

foreach ($dir in $candidates) {
  if (-not (Test-Path $dir)) {
    Write-Host "Skip (install via SDK Manager if needed): $dir" -ForegroundColor DarkYellow
    continue
  }
  $norm = (Resolve-Path -LiteralPath $dir).Path.TrimEnd('\')
  $key = $norm.ToLowerInvariant()
  if ($pathKeys.ContainsKey($key)) { continue }
  $pathKeys[$key] = $true
  [void]$pathOrder.Add($norm)
  Write-Host "Added to user PATH: $norm" -ForegroundColor Green
}

[Environment]::SetEnvironmentVariable('Path', ($pathOrder -join ';'), 'User')

# Same shell session (until you restart the app)
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
foreach ($dir in $candidates) {
  if (-not (Test-Path $dir)) { continue }
  $norm = (Resolve-Path -LiteralPath $dir).Path
  if ($env:Path -notlike "*$norm*") {
    $env:Path = "$norm;$env:Path"
  }
}

Write-Host ''
Write-Host "ANDROID_HOME is now: $sdk" -ForegroundColor Green
Write-Host 'Quit Cursor completely and reopen, then run: npm run run:android' -ForegroundColor Yellow
Write-Host ''
