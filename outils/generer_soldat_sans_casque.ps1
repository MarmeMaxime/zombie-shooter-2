param([string]$assets = "$PSScriptRoot\..\assets")
# The Soldier without the helmet: built from the Soldier's finished sprites
# (persos\soldat\*.png), so it keeps the same pixel-art style. ASCII only (PowerShell 5.1).
# Output: persos\soldat-sans-casque\arret/tir/marche1..4.png (not used by the game yet).
#  1. the helmet, goggles and balaclava are removed, down to the brown scarf
#     (row 10 when standing, row 8 when walking: the head is anchored on it)
#  2. a hand-drawn head is stamped in their place: auburn hair (light band on top,
#     shadow underneath), a fringe in strands, a ponytail tied with an olive band,
#     a big green eye with a highlight, the other eye in three-quarter view,
#     pink cheek, small mouth, ear and shaded jaw; the dark neck becomes skin
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

function C($hex) { [System.Drawing.ColorTranslator]::FromHtml("#$hex") }
function K($c) { if ($c.A -eq 0) { return '' } ; '{0:X2}{1:X2}{2:X2}' -f $c.R, $c.G, $c.B }

# Palette of the head (letters of the drawing below; 'H' and 'h' differ: case-sensitive table)
$COUL = New-Object System.Collections.Hashtable ([StringComparer]::Ordinal)
$COUL['a'] = '050403'                                        # outline (same as the sprite)
$COUL['L'] = 'E0A060'; $COUL['H'] = 'A35A30'; $COUL['h'] = '6E3820'   # hair: light, base, shadow
$COUL['S'] = 'F8D3B3'; $COUL['s'] = 'E2A982'                 # skin, shaded skin
$COUL['e'] = '22161F'; $COUL['i'] = '2F8A5A'; $COUL['j'] = '7FD09C'; $COUL['w'] = 'FFFFFF'   # lashes, iris, iris light, highlight
$COUL['b'] = 'F3949A'; $COUL['m'] = 'B2525A'                 # cheek, mouth
$COUL['T'] = '7A8A40'; $COUL['t'] = '4A5426'                 # hair band (olive, like the helmet rim)
# The head, columns x = 6..22 and rows 0..10 of the standing frame ('.' = transparent)
$TETE = @(
    '.....aaaaaaa.....',
    '....aLLLLHHHaa...',
    '...aLLHHHHHHHHa..',
    '.aaTHHHHHHHHHHHa.',
    'aHHtHHHHHHHHHhHHa',
    'aHhahHHHhHSHSShHa',
    'ahHahHhHsSSeeeSea',
    'ahHahhHSsSSswiSia',
    'aHhahhhssSbbijSSa',
    'aha.ahasSSSSSmSa.',
    '.a.....asSSSSsa..'
)
$ECHARPE = '4C3D2E'; $CAGOULE = '14121D'

$src = "$assets\persos\soldat"; $dst = "$assets\persos\soldat-sans-casque"
New-Item -ItemType Directory -Force $dst | Out-Null
foreach ($fr in @('arret', 'tir', 'marche1', 'marche2', 'marche3', 'marche4')) {
    $s = [System.Drawing.Bitmap]::FromFile("$src\$fr.png")
    $bmp = New-Object System.Drawing.Bitmap 64, 64
    for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $bmp.SetPixel($x, $y, $s.GetPixel($x, $y)) } }
    $s.Dispose()
    # Horizontal anchor: the top of the helmet starts at x = 11 on the standing frame
    $x0 = 0; for ($x = 0; $x -lt 64; $x++) { if ($bmp.GetPixel($x, 0).A -ne 0) { $x0 = $x; break } }
    $dx = $x0 - 11
    # The scarf: where the head stops
    $echarpe = 10
    for ($y = 5; $y -lt 14; $y++) {
        $trouve = $false
        for ($x = 6 + $dx; $x -le 24 + $dx; $x++) { if ((K $bmp.GetPixel($x, $y)) -eq $ECHARPE) { $trouve = $true } }
        if ($trouve) { $echarpe = $y; break }
    }
    # 1. remove helmet, goggles and balaclava; the dark neck becomes skin
    $vide = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
    for ($y = 0; $y -lt $echarpe; $y++) { for ($x = 5 + $dx; $x -le 24 + $dx; $x++) { if ($x -ge 0 -and $x -lt 64) { $bmp.SetPixel($x, $y, $vide) } } }
    for ($y = $echarpe; $y -lt $echarpe + 3; $y++) {
        for ($x = 5 + $dx; $x -le 24 + $dx; $x++) {
            if ((K $bmp.GetPixel($x, $y)) -eq $CAGOULE) { $bmp.SetPixel($x, $y, (C $(if ($y -eq $echarpe) { 'C98A66' } else { 'E2A982' }))) }
        }
    }
    # 2. the new head
    for ($y = 0; $y -lt $TETE.Count; $y++) {
        $ligne = $TETE[$y]
        for ($k = 0; $k -lt $ligne.Length; $k++) {
            $ch = [string]$ligne[$k]
            if ($ch -eq '.') { continue }
            $x = 6 + $dx + $k
            if ($x -ge 0 -and $x -lt 64) { $bmp.SetPixel($x, $y, (C $COUL[$ch])) }
        }
    }
    $bmp.Save("$dst\$fr.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "$fr : x0=$x0 echarpe=$echarpe"
}
