#Requires -Version 5.1
# Finds JDK 17+ (java.exe), sets JAVA_HOME for User scope, adds %JAVA_HOME%\bin to User PATH.
#   npm run setup:jdk-env
#   npm run setup:jdk-env -- -JavaHome "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
# Restart Cursor after running so new env vars load in all terminals.

param(
  [string]$JavaHome = ''
)

$ErrorActionPreference = 'Stop'

function Test-JavaExe([string]$dir) {
  $j = Join-Path $dir 'bin\java.exe'
  return (Test-Path -LiteralPath $j)
}

function Find-JdkHome {
  $searchRoots = @(
    'C:\Program Files\Eclipse Adoptium',
    'C:\Program Files\Microsoft',
    'C:\Program Files\Java',
    'C:\Program Files\Amazon Corretto',
    "${env:ProgramFiles(x86)}\Java",
    "${env:ProgramFiles(x86)}\Eclipse Adoptium"
  )
  foreach ($root in $searchRoots) {
    if (-not (Test-Path -LiteralPath $root)) { continue }
    $dirs = Get-ChildItem -LiteralPath $root -Directory -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -match 'jdk|jdk-|java-|corretto' }
    foreach ($d in $dirs) {
      if (Test-JavaExe $d.FullName) {
        return $d.FullName.TrimEnd('\')
      }
    }
  }
  return $null
}

$jdk = $JavaHome.Trim()
if (-not $jdk) {
  $fromUser = [Environment]::GetEnvironmentVariable('JAVA_HOME', 'User')
  if ($fromUser -and (Test-JavaExe $fromUser)) {
    $jdk = $fromUser.TrimEnd('\')
  }
}
if (-not $jdk) {
  $jdk = Find-JdkHome
}

if (-not $jdk -or -not (Test-JavaExe $jdk)) {
  Write-Host ''
  Write-Host 'No JDK with bin\java.exe was found (need JDK 17+ for Gradle / expo run:android).' -ForegroundColor Yellow
  Write-Host ''
  Write-Host 'Install one of these, then run this script again:' -ForegroundColor Cyan
  Write-Host '  winget install -e --id EclipseAdoptium.Temurin.17.JDK' -ForegroundColor White
  Write-Host '  https://adoptium.net/temurin/releases/?version=17' -ForegroundColor DarkGray
  Write-Host ''
  Write-Host 'If JDK is already installed in a custom folder:' -ForegroundColor Cyan
  Write-Host '  npm run setup:jdk-env -- -JavaHome "C:\Path\To\Jdk"' -ForegroundColor White
  Write-Host ''
  exit 1
}

$bin = Join-Path $jdk 'bin'
[Environment]::SetEnvironmentVariable('JAVA_HOME', $jdk, 'User')

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

$normBin = (Resolve-Path -LiteralPath $bin).Path.TrimEnd('\')
$keyBin = $normBin.ToLowerInvariant()
if (-not $pathKeys.ContainsKey($keyBin)) {
  $pathKeys[$keyBin] = $true
  [void]$pathOrder.Add($normBin)
  Write-Host "Added to user PATH: $normBin" -ForegroundColor Green
}

[Environment]::SetEnvironmentVariable('Path', ($pathOrder -join ';'), 'User')

$env:JAVA_HOME = $jdk
if ($env:Path -notlike "*$normBin*") {
  $env:Path = "$normBin;$env:Path"
}

Write-Host ''
Write-Host "JAVA_HOME is now: $jdk" -ForegroundColor Green
& (Join-Path $jdk 'bin\java.exe') -version
Write-Host ''
Write-Host 'Quit Cursor completely and reopen, then run: npm run run:android' -ForegroundColor Yellow
Write-Host ''
