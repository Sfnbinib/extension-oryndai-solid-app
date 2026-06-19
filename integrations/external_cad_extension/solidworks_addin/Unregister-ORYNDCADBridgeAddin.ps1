param(
    [Parameter(Mandatory = $true)]
    [string]$DllPath,

    [string]$RegAsmPath = "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\RegAsm.exe"
)

$ErrorActionPreference = "Stop"

if (Test-Path $RegAsmPath -and (Test-Path $DllPath)) {
    & $RegAsmPath $DllPath /unregister
}

$addinGuid = "{B7F2B6BE-AC0E-4591-A466-BA92A238E9D4}"
Remove-Item -Path "HKCU:\Software\SolidWorks\AddIns\$addinGuid" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "HKCU:\Software\SolidWorks\AddInsStartup\$addinGuid" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Unregistered ORYND CAD Bridge Add-in."

