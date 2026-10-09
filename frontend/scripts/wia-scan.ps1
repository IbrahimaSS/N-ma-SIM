<#
  wia-scan.ps1 — Déclenche un scan via WIA (Windows Image Acquisition) et
  sauvegarde le résultat en JPEG. Compatible avec la plupart des scanners
  grand public (dont l'imprimante HP DeskJet 2700 All-in-One).

  WIA est intégré à Windows : pas de SDK/pilote supplémentaire à installer
  au-delà du pilote HP standard (installé automatiquement en USB).

  Utilisation :
    powershell -ExecutionPolicy Bypass -File wia-scan.ps1 -OutputPath "C:\...\scan.jpg" -DPI 300

  Code de sortie 0 = succès (fichier écrit à OutputPath), non-zéro = échec
  (message d'erreur sur stderr). En cas de succès, stdout contient une ligne
  « OK <largeur>x<hauteur> <dpi>dpi » (diagnostic de la taille réellement obtenue).
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
$WIA_IPS_XPOS = 6149         # Début de la zone de scan (pixels)
$WIA_IPS_YPOS = 6150
$WIA_IPS_XEXTENT = 6151      # Taille de la zone de scan (pixels, à la résolution courante)
$WIA_IPS_YEXTENT = 6152
$WIA_INTENT_COLOR = 2

# Attributs des propriétés WIA (SubType) : liste de valeurs ou plage min/max
$WIA_PROP_RANGE = 1
$WIA_PROP_LIST = 2

function Get-WiaProperty {
    param($Item, [int]$PropertyId)
    try { return $Item.Properties.Item([string]$PropertyId) } catch { return $null }
}

function Set-WiaProperty {
    param($Item, [int]$PropertyId, $Value)
    $prop = Get-WiaProperty -Item $Item -PropertyId $PropertyId
    if (-not $prop) {
        [Console]::Error.WriteLine("Avertissement : propriété WIA $PropertyId absente sur ce scanner (ignorée).")
        return $false
    }
    try {
        $prop.Value = $Value
        return $true
    } catch {
        [Console]::Error.WriteLine("Avertissement : valeur $Value refusée pour la propriété WIA $PropertyId.")
        return $false
    }
}

<# Résolution réellement acceptée par le scanner, la plus proche de celle demandée.
   Beaucoup de pilotes n'acceptent que certaines valeurs (75, 150, 200, 300, 600...) :
   une valeur hors liste est refusée et le scanner garde sa résolution par défaut
   (souvent 75-100 DPI) → image trop petite pour l'OCR. #>
function Get-DpiSupporte {
    param($Item, [int]$Demande)
    $prop = Get-WiaProperty -Item $Item -PropertyId $WIA_IPS_XRES
    if (-not $prop) { return $Demande }
    try {
        if ($prop.SubType -eq $WIA_PROP_LIST) {
            $valeurs = @($prop.SubTypeValues | ForEach-Object { [int]$_ })
            # Priorité à la plus proche >= demandée (meilleure lecture), sinon la plus haute disponible
            $sup = @($valeurs | Where-Object { $_ -ge $Demande } | Sort-Object)
            if ($sup.Count -gt 0) { return $sup[0] }
            return ($valeurs | Sort-Object | Select-Object -Last 1)
        }
        if ($prop.SubType -eq $WIA_PROP_RANGE) {
            $min = [int]$prop.SubTypeMin; $max = [int]$prop.SubTypeMax; $pas = [int]$prop.SubTypeStep
            $v = [Math]::Min([Math]::Max($Demande, $min), $max)
            if ($pas -gt 0) { $v = $min + [Math]::Round(($v - $min) / $pas) * $pas }
            return [int]$v
        }
    } catch { }
    return $Demande
}

<# Zone de scan = toute la vitre, recalculée APRÈS le changement de résolution
   (les étendues WIA sont en pixels à la résolution courante : sans ce recalcul,
   certains pilotes gardent une zone prévue pour l'ancienne résolution). #>
function Set-ZoneComplete {
    param($Item)
    Set-WiaProperty -Item $Item -PropertyId $WIA_IPS_XPOS -Value 0 | Out-Null
    Set-WiaProperty -Item $Item -PropertyId $WIA_IPS_YPOS -Value 0 | Out-Null
    foreach ($id in @($WIA_IPS_XEXTENT, $WIA_IPS_YEXTENT)) {
        $prop = Get-WiaProperty -Item $Item -PropertyId $id
        if ($prop -and $prop.SubType -eq $WIA_PROP_RANGE) {
            Set-WiaProperty -Item $Item -PropertyId $id -Value ([int]$prop.SubTypeMax) | Out-Null
        }
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

    Set-WiaProperty -Item $item -PropertyId $WIA_IPS_CUR_INTENT -Value $WIA_INTENT_COLOR | Out-Null

    $dpiVoulu = Get-DpiSupporte -Item $item -Demande $DPI
    Set-WiaProperty -Item $item -PropertyId $WIA_IPS_XRES -Value $dpiVoulu | Out-Null
    Set-WiaProperty -Item $item -PropertyId $WIA_IPS_YRES -Value $dpiVoulu | Out-Null
    Set-ZoneComplete -Item $item

    # Résolution réellement appliquée (relue sur l'appareil)
    $dpiReel = $dpiVoulu
    $propX = Get-WiaProperty -Item $item -PropertyId $WIA_IPS_XRES
    if ($propX) { try { $dpiReel = [int]$propX.Value } catch { } }
    if ($dpiReel -lt 200) {
        [Console]::Error.WriteLine("Avertissement : le scanner numérise à $dpiReel DPI (demandé : $DPI). L'image risque d'être trop petite pour la lecture.")
    }

    $image = $item.Transfer($WIA_FORMAT_JPEG)

    if (Test-Path $OutputPath) {
        Remove-Item $OutputPath -Force
    }
    $image.SaveFile($OutputPath)

    Write-Output ("OK {0}x{1} {2}dpi" -f $image.Width, $image.Height, $dpiReel)
    exit 0
} catch {
    Write-Error "Échec du scan : $($_.Exception.Message)"
    exit 1
}
