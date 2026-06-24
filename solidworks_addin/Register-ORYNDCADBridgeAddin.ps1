param(
    [Parameter(Mandatory = $true)]
    [string]$DllPath,

    [string]$RegAsmPath = "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\RegAsm.exe"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $DllPath)) {
    throw "Add-in DLL not found: $DllPath"
}

if (-not (Test-Path $RegAsmPath)) {
    throw "RegAsm not found: $RegAsmPath"
}

& $RegAsmPath $DllPath /codebase

$addinGuid = "{B7F2B6BE-AC0E-4591-A466-BA92A238E9D4}"
$addinKey = "HKCU:\Software\SolidWorks\AddIns\$addinGuid"
$startupKey = "HKCU:\Software\SolidWorks\AddInsStartup\$addinGuid"

New-Item -Path $addinKey -Force | Out-Null
New-ItemProperty -Path $addinKey -Name "(Default)" -Value 1 -PropertyType DWord -Force | Out-Null
New-ItemProperty -Path $addinKey -Name "Title" -Value "ORYND CAD Bridge" -PropertyType String -Force | Out-Null
New-ItemProperty -Path $addinKey -Name "Description" -Value "Local ORYND CAD Bridge companion for operation plans and macro previews." -PropertyType String -Force | Out-Null

New-Item -Path $startupKey -Force | Out-Null
New-ItemProperty -Path $startupKey -Name "(Default)" -Value 0 -PropertyType DWord -Force | Out-Null

Write-Host "Registered ORYND CAD Bridge Add-in."

