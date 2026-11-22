param([string]$assets, [int]$queues = 1, [string]$sortie = '')
# -queues 9 -sortie <path prefix> : nine-tailed variant (base of an outfit, see generer_tenues.ps1)
# Lassie, the foxgirl: built from Mira's finished sprites (persos\mira\*.png) so she
# keeps the same pixel-art style. ASCII only (PowerShell 5.1).
# Run AFTER generer_persos.ps1. Output: persos\lassie\arret/tir/marche1..4.png
#  1. slimmer and a bit smaller (frees the top rows for the ears), room for the tail
#  2. colours: ginger hair, green eye, dark outfit with yellow trim, electric gun
#  3. swimsuit-style top: two cups, skin visible between and above, light bounce
#  4. fox ears standing on top of the head, big fluffy tail
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

function C($hex) { [System.Drawing.ColorTranslator]::FromHtml("#$hex") }
function K($c) { if ($c.A -eq 0) { return '' } ; '{0:X2}{1:X2}{2:X2}' -f $c.R, $c.G, $c.B }
function Px($bmp, $x, $y, $hex) { if ($x -ge 0 -and $y -ge 0 -and $x -lt 64 -and $y -lt 64) { $bmp.SetPixel($x, $y, (C $hex)) } }
function Vide($bmp, $x, $y) { $x -lt 0 -or $y -lt 0 -or $x -ge 64 -or $y -ge 64 -or $bmp.GetPixel($x, $y).A -eq 0 }

$ECHX = 0.86; $ECHY = 0.9; $CENTRE = 16; $DECALAGE = 7
$OUT = '050403'
$NAVY = '2A2F45'; $NAVYD = '1A1D2C'; $JAUNE = 'FFD23C'
$ROUX = 'D8742E'; $ROUXC = 'F0A060'; $ROUXD = 'A04E1C'; $BLANC = 'F4ECE0'; $BLANCD = 'C8BCA8'
$SKIN = 'EDB98F'; $SKIND = 'C98E66'; $SKINH = 'F8D2AE'

$map = @{
    'F2D46B' = $ROUX; 'FFEFA8' = $ROUXC; 'C9A23A' = $ROUXD; 'B8902E' = '8A3A10'; 'E6C258' = 'C8642A'; '6E5414' = '5A2008'   # hair
    '22305A' = '1E5A30'; '3A6BD8' = '3AD06A'; '2A4FA8' = '2A9A50'                                                       # eye
    'F2F2F5' = $NAVY; 'C4C4D0' = $NAVYD; 'B9B9C6' = $NAVYD                                                               # top
    '3E5E92' = '26293A'; '283F66' = '16182A'; '5C80B8' = '3A3F58'; '8FA8D0' = $JAUNE                                    # shorts
    '3C4654' = '4A5060'; '262C36' = '2A2E38'; 'E07A1F' = '5AE6FF'; '4E5A6C' = '2AB8FF'                                  # electric gun
}
$HAUT = @($NAVY, $NAVYD)

$frames = @('arret', 'tir', 'marche1', 'marche2', 'marche3', 'marche4')
$rebond = @{ 'marche1' = 1; 'marche2' = 0; 'marche3' = -1; 'marche4' = 0; 'arret' = 0; 'tir' = 1 }
$balance = @{ 'marche1' = 1; 'marche2' = 0; 'marche3' = -1; 'marche4' = 0; 'arret' = 0; 'tir' = 0 }

foreach ($fr in $frames) {
    $s = [System.Drawing.Bitmap]::FromFile("$assets\persos\mira\$fr.png")
    $bmp = New-Object System.Drawing.Bitmap 64, 64
    # 1) slimmer + smaller (anchored on the feet), shifted right, recoloured
    for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) {
        $sx = [Math]::Floor($CENTRE + ($x - $DECALAGE - $CENTRE) / $ECHX)
        $sy = [Math]::Floor(64 - (64 - $y) / $ECHY)
        if ($sx -lt 0 -or $sy -lt 0 -or $sx -ge 64 -or $sy -ge 64) { continue }
        $c = $s.GetPixel($sx, $sy); if ($c.A -eq 0) { continue }
        $k = K $c
        if ($k -eq 'FFFFFF' -and $sy -ge 13) { $k = $NAVY }
        elseif ($map.ContainsKey($k)) { $k = $map[$k] }
        $bmp.SetPixel($x, $y, (C $k))
    } }
    $s.Dispose()
    $b = $rebond[$fr]

    # Where the top is: bounding box of the outfit colour in the chest area
    $x0 = 64; $x1 = -1; $y0 = 64; $y1 = -1
    for ($y = 12; $y -le 32; $y++) { for ($x = 0; $x -lt 48; $x++) {
        if ($HAUT -contains (K $bmp.GetPixel($x, $y))) { if ($x -lt $x0) { $x0 = $x }; if ($x -gt $x1) { $x1 = $x }; if ($y -lt $y0) { $y0 = $y }; if ($y -gt $y1) { $y1 = $y } }
    } }
    if ($x1 -lt 0) { Write-Host "  ($fr : pas de haut trouve, poitrine non retouchee)" }

    if ($x1 -lt 0) { }
    elseif ($fr -eq 'arret' -or $fr -eq 'tir') {
        # 2) Front: skin over the whole chest area, then two cups with a cleavage line,
        #    thin straps and a yellow trim; they drop 1px on the recoil (light bounce)
        for ($y = $y0; $y -le $y1; $y++) { for ($x = $x0; $x -le $x1; $x++) {
            $k = K $bmp.GetPixel($x, $y)
            if ($HAUT -contains $k) { Px $bmp $x $y $(if ($x -eq $x0 -or $y -eq $y1) { $SKIND } else { $SKIN }) }
        } }
        $w = $x1 - $x0 + 1
        $cy = $y0 + 3 + $b
        $mil = [Math]::Floor($x0 + $w / 2)                     # cleavage column: never covered by a cup
        $rx = [Math]::Max(2.2, ($w - 1) / 4.3); $ry = 3.0
        $centres = @(($mil - $rx - 0.2), ($mil + 1 + $rx + 0.2))
        $bonnet = New-Object 'bool[,]' 64, 64
        foreach ($cx in $centres) {
            for ($y = $cy - 4; $y -le $cy + 4; $y++) { for ($x = [int]($cx - $rx - 1); $x -le $cx + $rx + 1; $x++) {
                if ($x -eq $mil) { continue }
                $dx = ($x + 0.5 - $cx) / $rx; $dy = ($y + 0.5 - $cy) / $ry
                if ($dx * $dx + $dy * $dy -le 1 -and $x -ge 0 -and $y -ge 0 -and $x -lt 64 -and $y -lt 64 -and -not (Vide $bmp $x $y)) {
                    $bonnet[$x, $y] = $true
                    Px $bmp $x $y $(if ($dy -gt 0.35) { $NAVYD } elseif ($dy -lt -0.55) { $JAUNE } else { $NAVY })
                }
            } }
        }
        # Outline around the cups (where they meet the skin) and the cleavage line
        for ($y = $cy - 5; $y -le $cy + 5; $y++) { for ($x = $x0; $x -le $x1; $x++) {
            if ($x -lt 0 -or $y -lt 0 -or $x -ge 64 -or $y -ge 64 -or $bonnet[$x, $y] -or (Vide $bmp $x $y)) { continue }
            $touche = $false
            foreach ($v in @(@(1, 0), @(-1, 0), @(0, 1), @(0, -1))) { $nx = $x + $v[0]; $ny = $y + $v[1]; if ($nx -ge 0 -and $ny -ge 0 -and $nx -lt 64 -and $ny -lt 64 -and $bonnet[$nx, $ny]) { $touche = $true } }
            if ($touche) { Px $bmp $x $y $(if ($y -gt $cy) { $OUT } else { $SKIND }) }
        } }
        # Cleavage: a short shadow line between the cups
        for ($y = $cy - 1; $y -le $cy + 1; $y++) { if (-not (Vide $bmp $mil $y)) { Px $bmp $mil $y $(if ($y -le $cy) { $SKIND } else { $OUT }) } }
        # Straps up to the shoulders
        foreach ($cx in $centres) { for ($y = $y0 - 2; $y -lt $cy - 2; $y++) { if (-not (Vide $bmp ([int]$cx) $y)) { Px $bmp ([int]$cx) $y $NAVY } } }
    } else {
        # 2) Profile: a rounder, fuller chest curve; skin on top, cup below; the
        #    curve lags the step by one frame (light bounce)
        $plus = @{ 0 = 1; 1 = 2; 2 = 3; 3 = 3; 4 = 3; 5 = 3; 6 = 2; 7 = 1 }
        foreach ($y in ($y0 - 1)..([Math]::Min(63, $y0 + 9))) {
            $e = $plus[$y - $y0 - $b]; if (-not $e) { continue }
            $tx = -1
            for ($x = 8; $x -lt 40; $x++) { if ($HAUT -contains (K $bmp.GetPixel($x, $y))) { $tx = $x; break } }
            if ($tx -lt 0) { continue }
            $bord = $tx
            while ($bord + 1 -lt 64 -and -not (Vide $bmp ($bord + 1) $y)) { $bord++ }
            $r = $y - $y0 - $b
            for ($x = $tx; $x -lt $bord + $e; $x++) {
                $col = if ($r -le 1) { if ($x -ge $bord + $e - 2) { $SKINH } else { $SKIN } } elseif ($r -eq 2) { $JAUNE } elseif ($r -ge 6) { $NAVYD } else { $NAVY }
                Px $bmp $x $y $col
            }
            Px $bmp ($bord + $e) $y $OUT
        }
    }

    # 3) Fox ears standing on top of the head (the slimmer body freed the top rows)
    $tete = 64; $gauche = 64; $droite = -1
    for ($y = 0; $y -lt 20; $y++) { for ($x = 0; $x -lt 64; $x++) {
        $kk = K $bmp.GetPixel($x, $y)
        if ($kk -eq $ROUX -or $kk -eq $ROUXC -or $kk -eq $ROUXD) { if ($y -lt $tete) { $tete = $y } }
    } }
    for ($x = 0; $x -lt 64; $x++) { if (-not (Vide $bmp $x ($tete + 1))) { if ($x -lt $gauche) { $gauche = $x }; $droite = $x } }
    $mil = [Math]::Floor(($gauche + $droite) / 2)
    foreach ($ox in @(($gauche - 1), ($mil + 1))) {         # back ear and front ear
        for ($k = 0; $k -le 6; $k++) {
            $yy = $tete + 1 - $k
            $l = [Math]::Max(1, 5 - [Math]::Floor($k * 4 / 6))
            $xa = $ox + [Math]::Floor((5 - $l) / 2) + [Math]::Floor($k / 3)   # leans slightly forward
            for ($q = 0; $q -lt $l; $q++) { Px $bmp ($xa + $q) $yy $(if ($q -eq 0) { $ROUXD } elseif ($q -eq $l - 1) { $ROUX } elseif ($k -ge 1 -and $k -le 4) { $BLANC } else { $ROUX }) }
            Px $bmp ($xa - 1) $yy $OUT; Px $bmp ($xa + $l) $yy $OUT
            if ($k -eq 6) { Px $bmp $xa ($yy - 1) $OUT }
        }
    }

    # 4) Big fluffy tail behind the hips (only on empty pixels: it stays behind her)
    $yh = 39; $xl = 64
    for ($x = 0; $x -lt 64; $x++) { if (-not (Vide $bmp $x $yh)) { $xl = $x; break } }
    $sw = $balance[$fr]
    # Each ball: x, y, radius, 'r' (fur) or 'w' (white tip), tail number
    if ($queues -le 1) {
        $boules = @(
            @(($xl - 1), 39, 3.4, 'r', 0), @(($xl - 3), 43, 4.0, 'r', 0), @(($xl - 4 + $sw), 48, 4.4, 'r', 0),
            @(($xl - 4 + $sw), 53, 4.0, 'r', 0), @(($xl - 3 + $sw), 57, 3.4, 'w', 0), @(($xl - 1 + $sw), 60, 2.4, 'w', 0)
        )
    } else {
        # Fan of thinner tails spreading out behind the hips, each curling a little upward
        $boules = @()
        $rayons = @(1.7, 2.0, 2.2, 2.2, 2.0, 1.6, 1.2)
        # The fan must fit between the hips and the left edge of the 64 px sprite:
        # it is squeezed horizontally to the room there is (and spreads up and down instead)
        $place = $xl - 1
        $kx = [Math]::Min(1.0, ($place - 2.5) / 19.5)
        for ($n = 0; $n -lt $queues; $n++) {
            $angle = (-85 + 170 * $n / ($queues - 1)) * [Math]::PI / 180      # 0 = straight back
            for ($b = 0; $b -lt 7; $b++) {
                $a = $angle + $b * 0.06
                $d = 1.5 + $b * 3.0
                $bx = ($xl + 1) - [Math]::Cos($a) * $d * $kx + $sw * $b / 6
                $by = 42 - [Math]::Sin($a) * $d * $(if ($a -gt 0) { 1.3 } else { 0.9 })   # upper tails reach higher, along her back; lower ones stay above the bottom edge
                $boules += , @($bx, $by, $rayons[$b], $(if ($b -ge 5) { 'w' } else { 'r' }), $n)
            }
        }
    }
    $queue = New-Object 'bool[,]' 64, 64
    $numero = New-Object 'int[,]' 64, 64
    foreach ($bo in $boules) {
        for ($y = [int]($bo[1] - $bo[2] - 1); $y -le $bo[1] + $bo[2] + 1; $y++) { for ($x = [int]($bo[0] - $bo[2] - 1); $x -le $bo[0] + $bo[2] + 1; $x++) {
            if ($x -lt 0 -or $y -lt 0 -or $x -ge 64 -or $y -ge 64) { continue }
            if ((($x - $bo[0]) * ($x - $bo[0]) + ($y - $bo[1]) * ($y - $bo[1])) -gt $bo[2] * $bo[2]) { continue }
            if (-not (Vide $bmp $x $y) -and -not $queue[$x, $y]) { continue }
            $queue[$x, $y] = $true
            $numero[$x, $y] = $bo[4]
            $ombre = ($x -lt $bo[0] - $bo[2] * 0.3) -or ($y -gt $bo[1] + $bo[2] * 0.4)
            Px $bmp $x $y $(if ($bo[3] -eq 'w') { if ($ombre) { $BLANCD } else { $BLANC } } else { if ($ombre) { $ROUXD } else { $ROUX } })
        } }
    }
    # Several tails: a dark line where two of them overlap, so each one reads separately
    if ($queues -gt 1) {
        for ($y = 0; $y -lt 63; $y++) { for ($x = 0; $x -lt 63; $x++) {
            if (-not $queue[$x, $y]) { continue }
            if (($queue[($x + 1), $y] -and $numero[($x + 1), $y] -ne $numero[$x, $y]) -or ($queue[$x, ($y + 1)] -and $numero[$x, ($y + 1)] -ne $numero[$x, $y])) { Px $bmp $x $y $OUT }
        } }
    }
    for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) {
        if (-not (Vide $bmp $x $y)) { continue }
        foreach ($v in @(@(1, 0), @(-1, 0), @(0, 1), @(0, -1))) {
            $nx = $x + $v[0]; $ny = $y + $v[1]
            if ($nx -ge 0 -and $ny -ge 0 -and $nx -lt 64 -and $ny -lt 64 -and $queue[$nx, $ny]) { Px $bmp $x $y $OUT; break }
        }
    } }

    $fichier = if ($sortie) { "${sortie}_$fr.png" } else { New-Item -ItemType Directory -Force "$assets\persos\lassie" | Out-Null; "$assets\persos\lassie\$fr.png" }
    $bmp.Save($fichier, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}
"ok"
