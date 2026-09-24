<#
  wia-scan.ps1 — Déclenche un scan via WIA (Windows Image Acquisition) et
  sauvegarde le résultat en JPEG. Compatible avec la plupart des scanners
  grand public (dont l'imprimante HP DeskJet 2700 All-in-One).

  WIA est intégré à Windows : pas de SDK/pilote supplémentaire à installer
  au-delà du pilote HP standard (installé automatiquement en USB).

  Utilisation :
    powershell -ExecutionPolicy Bypass -File wia-scan.ps1 -OutputPath "C:\...\scan.jpg" -DPI 300

  Code de sortie 0 = succès (fichier écrit à OutputPath), non-zéro = échec
  (message d'erreur sur stderr).
#>

param(
    [Parameter(Mandatory = $true)][string]$OutputPath,
    [int]$DPI = 300
)

$ErrorActionPreference = "Stop"

# GUID du format de fichier JPEG pour WIA (constante standard wiaFormatJPEG)
$WIA_FORMAT_JPEG = "{B96B3CAE-0728-11D3-9D7B-0000F81EF32E}"
$WIA_DEVICE_TYPE_SCANNER = 1

# IDs de propriétés WIA standard (item de scan)
$WIA_IPS_CUR_INTENT = 6146   # 1=Texte/N&B, 2=Couleur, 4=Niveaux de gris
$WIA_IPS_XRES = 6147         # Résolution horizontale (DPI)
$WIA_IPS_YRES = 6148         # Résolution verticale (DPI)
$WIA_INTENT_COLOR = 2

function Set-WiaProperty {
    param($Item, [int]$PropertyId, $Value)
    try {
        $Item.Properties.Item($PropertyId).Value = $Value
    } catch {
        Write-Warning "Propriété WIA $PropertyId non supportée par ce scanner (ignorée)."
    }
}

try {
    $deviceManager = New-Object -ComObject WIA.DeviceManager

    $scannerInfo = $null
    foreach ($info in $deviceManager.DeviceInfos) {
        if ($info.Type -eq $WIA_DEVICE_TYPE_SCANNER) {
            $scannerInfo = $info
            break
        }
    }

    if (-not $scannerInfo) {
        Write-Error "Aucun scanner détecté. Vérifiez que l'imprimante HP DeskJet 2700 est bien branchée et allumée."
        exit 1
    }

    $device = $scannerInfo.Connect()
    $item = $device.Items.Item(1)

    Set-WiaProperty -Item $item -PropertyId $WIA_IPS_CUR_INTENT -Value $WIA_INTENT_COLOR
    Set-WiaProperty -Item $item -PropertyId $WIA_IPS_XRES -Value $DPI
    Set-WiaProperty -Item $item -PropertyId $WIA_IPS_YRES -Value $DPI

    $image = $item.Transfer($WIA_FORMAT_JPEG)

    if (Test-Path $OutputPath) {
        Remove-Item $OutputPath -Force
    }
    $image.SaveFile($OutputPath)

    Write-Output "OK"
    exit 0
} catch {
    Write-Error "Échec du scan : $($_.Exception.Message)"
    exit 1
}
