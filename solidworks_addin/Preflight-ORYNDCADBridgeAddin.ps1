param(
    [string]$SolidWorksInstallDir = "C:\Program Files\SOLIDWORKS Corp\SOLIDWORKS",
    [string]$MsBuildPath = "",
    [string]$RegAsmPath = "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\RegAsm.exe",
    [switch]$Json
)

$ErrorActionPreference = "Stop"

function Test-File($Path) {
    return [bool](Test-Path -Path $Path -PathType Leaf)
}

function Test-Directory($Path) {
    return [bool](Test-Path -Path $Path -PathType Container)
}

function Find-MsBuild {
    param([string]$RequestedPath)

    if ($RequestedPath -and (Test-File $RequestedPath)) {
        return $RequestedPath
    }

    $candidates = @(
        "${env:ProgramFiles}\Microsoft Visual Studio\2022\Professional\MSBuild\Current\Bin\MSBuild.exe",
        "${env:ProgramFiles}\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin\MSBuild.exe",
        "${env:ProgramFiles}\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\MSBuild.exe",
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2019\Professional\MSBuild\Current\Bin\MSBuild.exe",
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2019\Community\MSBuild\Current\Bin\MSBuild.exe",
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2019\BuildTools\MSBuild\Current\Bin\MSBuild.exe"
    )

    foreach ($candidate in $candidates) {
        if (Test-File $candidate) {
            return $candidate
        }
    }

    $command = Get-Command msbuild.exe -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    return ""
}

$msbuild = Find-MsBuild -RequestedPath $MsBuildPath
$redistDir = Join-Path $SolidWorksInstallDir "api\redist"

$checks = [ordered]@{
    solidworks_install_dir = Test-Directory $SolidWorksInstallDir
    solidworks_redist_dir = Test-Directory $redistDir
    interop_sldworks = Test-File (Join-Path $redistDir "SolidWorks.Interop.sldworks.dll")
    interop_swconst = Test-File (Join-Path $redistDir "SolidWorks.Interop.swconst.dll")
    interop_swpublished = Test-File (Join-Path $redistDir "SolidWorks.Interop.swpublished.dll")
    msbuild = [bool]$msbuild
    regasm = Test-File $RegAsmPath
}

$result = [ordered]@{
    ok = -not ($checks.Values -contains $false)
    solidworks_install_dir = $SolidWorksInstallDir
    redist_dir = $redistDir
    msbuild_path = $msbuild
    regasm_path = $RegAsmPath
    checks = $checks
}

if ($Json) {
    $result | ConvertTo-Json -Depth 5
    exit ($(if ($result.ok) { 0 } else { 2 }))
}

Write-Host "ORYND CAD Bridge SolidWorks Add-in preflight"
Write-Host "SolidWorksInstallDir: $SolidWorksInstallDir"
Write-Host "MSBuild: $msbuild"
Write-Host "RegAsm: $RegAsmPath"
Write-Host ""

foreach ($item in $checks.GetEnumerator()) {
    $status = if ($item.Value) { "OK" } else { "MISSING" }
    Write-Host ("{0,-24} {1}" -f $item.Key, $status)
}

if (-not $result.ok) {
    Write-Host ""
    Write-Host "Preflight failed. Install/locate SolidWorks, Visual Studio Build Tools, and .NET Framework RegAsm before building."
    exit 2
}

Write-Host ""
Write-Host "Preflight passed. You can build the add-in."
