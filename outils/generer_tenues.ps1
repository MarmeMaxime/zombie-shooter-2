param([string]$assets)
# Outfit skins: recolor the base character sprites. ASCII only (PS 5.1).
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
function C($hex) { [System.Drawing.ColorTranslator]::FromHtml("#$hex") }

$frames = @('arret', 'tir', 'marche1', 'marche2', 'marche3', 'marche4')
function BaseFile($base, $frame) {
    if ($base -eq 'joueur') {
        if ($frame -eq 'arret') { return "$assets\joueur_arr" + [char]0xEA + "t.png" }
        return "$assets\joueur_$frame.png"
    }
    return "$assets\${base}_$frame.png"
}

# --- Accessories -------------------------------------------------------------
# Each outfit can get details drawn relative to the character's eye, found on
# every frame (so they follow the head while walking). $DECOS[outfit] is a
# scriptblock(bmp, ex, ey) that draws with Pt (any pixel) / Po (opaque only).
$COULEURS_OEIL = @{ 'joueur' = 'FA6A0A'; 'brute' = '1A1A1A'; 'grenadier' = '22305A' }
function Pt($bmp, $x, $y, $hex) { if ($x -ge 0 -and $y -ge 0 -and $x -lt $bmp.Width -and $y -lt $bmp.Height) { $bmp.SetPixel($x, $y, (C $hex)) } }
function Po($bmp, $x, $y, $hex) { if ($x -ge 0 -and $y -ge 0 -and $x -lt $bmp.Width -and $y -lt $bmp.Height -and $bmp.GetPixel($x, $y).A -gt 0) { $bmp.SetPixel($x, $y, (C $hex)) } }
function Ligne($bmp, $x0, $x1, $y, $hex, [switch]$opaque) { for ($x = $x0; $x -le $x1; $x++) { if ($opaque) { Po $bmp $x $y $hex } else { Pt $bmp $x $y $hex } } }
function Oeil($bmp, $couleur) {
    $res = $null
    for ($y = 0; $y -le 14; $y++) { for ($x = 0; $x -lt $bmp.Width; $x++) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.A -gt 0 -and ('{0:X2}{1:X2}{2:X2}' -f $c.R, $c.G, $c.B) -eq $couleur -and (-not $res -or $x -gt $res[0])) { $res = @($x, $y) }
    } }
    return $res
}
$DECOS = @{}

# value: 'RRGGBB' or 'camo:A,B,C' (patchy pattern) ; $special: scriptblock(k,x,y) -> hex or $null
function Recolor($base, $out, $map, $special) {
    foreach ($fr in $frames) {
        $s = [System.Drawing.Bitmap]::FromFile((BaseFile $base $fr)); $bmp = New-Object System.Drawing.Bitmap $s; $s.Dispose()
        $posOeil = Oeil $bmp $COULEURS_OEIL[$base]
        for ($y = 0; $y -lt $bmp.Height; $y++) { for ($x = 0; $x -lt $bmp.Width; $x++) {
            $c = $bmp.GetPixel($x, $y); if ($c.A -eq 0) { continue }
            $k = '{0:X2}{1:X2}{2:X2}' -f $c.R, $c.G, $c.B
            $n = $null
            if ($special) { $n = & $special $k $x $y }
            if (-not $n -and $map.ContainsKey($k)) { $n = $map[$k] }
            if (-not $n) { continue }
            if ($n.StartsWith('camo:')) {
                $p = $n.Substring(5).Split(',')
                $n = $p[([Math]::Floor($x / 3) * 7 + [Math]::Floor($y / 3) * 13) % $p.Count]
            }
            $bmp.SetPixel($x, $y, (C $n))
        } }
        if ($posOeil -and $DECOS.ContainsKey($out)) { & $DECOS[$out] $bmp $posOeil[0] $posOeil[1] }
        $bmp.Save("$assets\skin_${out}_$fr.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $bmp.Dispose()
    }
}

# ---------------- ACCESSOIRES PAR TENUE (relative to the eye ex, ey) ----------------
# Soldat : (ex, ey) = right end of the visor
$DECOS['soldat_urbain'] = { param($b, $ex, $ey)            # tactical headset + mic
    Ligne $b ($ex - 8) ($ex - 7) ($ey) '8A8E96'; Ligne $b ($ex - 8) ($ex - 7) ($ey + 1) '8A8E96'
    for ($i = 0; $i -le 5; $i++) { Pt $b ($ex - 6 + $i) ($ey + 2 + [Math]::Floor($i / 3)) 'B0B4BC' }
    Pt $b ($ex) ($ey + 3) 'FF3A3A' }
$DECOS['soldat_neige'] = { param($b, $ex, $ey)             # fur trim around the hood
    for ($x = $ex - 10; $x -le $ex + 1; $x++) { Po $b $x ($ey - 1) $(if ($x % 2) { 'FFFFFF' } else { 'D8E0E8' }) }
    Po $b ($ex - 10) $ey 'FFFFFF'; Po $b ($ex - 10) ($ey + 1) 'D8E0E8' }
$DECOS['soldat_jungle'] = { param($b, $ex, $ey)            # leaves stuck in the helmet net
    foreach ($p in @(@(-9, -5, '3A6A1A'), @(-8, -6, '6A9A2A'), @(-5, -7, '6A9A2A'), @(-4, -6, '3A6A1A'), @(-2, -6, '6A9A2A'), @(-6, -5, '3A6A1A'), @(-1, -7, '3A6A1A'))) { Pt $b ($ex + $p[0]) ($ey + $p[1]) $p[2] }
    Ligne $b ($ex - 6) ($ex - 1) ($ey + 2) '3A2A1A' -opaque }   # black face paint
$DECOS['soldat_apparat'] = { param($b, $ex, $ey)           # red plume, gold band, medals
    Ligne $b ($ex - 7) ($ex - 3) ($ey - 6) 'E8C24A' -opaque
    for ($i = 0; $i -lt 6; $i++) { Pt $b ($ex - 6 - [Math]::Floor($i / 2)) ($ey - 7 - $i) $(if ($i % 2) { 'C81E1E' } else { 'E8402E' }); Pt $b ($ex - 5 - [Math]::Floor($i / 2)) ($ey - 7 - $i) 'C81E1E' }
    foreach ($dx in @(-4, -2)) { Pt $b ($ex + $dx) ($ey + 11) 'C81E1E'; Pt $b ($ex + $dx) ($ey + 12) 'F2D24A'; Pt $b ($ex + $dx) ($ey + 13) 'B8902E' } }
$DECOS['soldat_cyber'] = { param($b, $ex, $ey)             # glowing visor line + antenna
    Ligne $b ($ex - 7) ($ex) ($ey) '3CF0FF' -opaque; Pt $b ($ex + 1) ($ey) 'C8FFFF'
    for ($i = 1; $i -le 5; $i++) { Pt $b ($ex - 9) ($ey - 3 - $i) '1C1C28' }
    Pt $b ($ex - 9) ($ey - 9) 'FF2E88'; Pt $b ($ex - 9) ($ey - 10) 'FF8AC4' }

# Brutus : (ex, ey) = his eye
$DECOS['brute_marcel'] = { param($b, $ex, $ey)             # cigarette and smoke
    Ligne $b ($ex + 1) ($ex + 4) ($ey + 4) 'F0F0F0'; Pt $b ($ex + 5) ($ey + 4) 'FF6A1A'
    Pt $b ($ex + 6) ($ey + 2) 'B8B8B8'; Pt $b ($ex + 7) ($ey + 1) 'D8D8D8'; Pt $b ($ex + 6) ($ey) 'B8B8B8' }
$DECOS['brute_fonce'] = { param($b, $ex, $ey)              # gold chain
    for ($x = $ex - 8; $x -le $ex - 1; $x++) { Po $b $x ($ey + 7 + [Math]::Floor([Math]::Abs($x - $ex + 4.5) / 3)) $(if ($x % 2) { 'F2C230' } else { 'B8902E' }) }
    Po $b ($ex - 4) ($ey + 9) 'F2C230'; Po $b ($ex - 4) ($ey + 10) 'FFE38A' }
$DECOS['brute_hawai'] = { param($b, $ex, $ey)              # sunglasses + flower lei
    Ligne $b ($ex - 4) ($ex + 1) ($ey) '111111'; Ligne $b ($ex - 3) ($ex) ($ey + 1) '111111'; Pt $b ($ex - 1) ($ey) '4A7AB8'
    $cols = @('FF4F9A', 'FFD23C', 'FFFFFF', '3ADC6A')
    for ($x = $ex - 9; $x -le $ex - 1; $x++) { Po $b $x ($ey + 8) $cols[($x + 20) % 4] } }
$DECOS['brute_noel'] = { param($b, $ex, $ey)               # Santa hat with white trim and pompom
    for ($r = 0; $r -le 5; $r++) { Ligne $b ($ex - 9 - $r) ($ex - 1 - 2 * $r) ($ey - 5 - $r) 'D42A2A' }
    Ligne $b ($ex - 10) ($ex + 1) ($ey - 4) 'F2F2F2'; Ligne $b ($ex - 10) ($ex + 1) ($ey - 3) 'D8D8D8'
    foreach ($p in @(@(-16, -10), @(-15, -10), @(-16, -9), @(-15, -9))) { Pt $b ($ex + $p[0]) ($ey + $p[1]) 'F2F2F2' } }
$DECOS['brute_catch'] = { param($b, $ex, $ey)              # luchador mask with white eye trim
    for ($y = $ey - 5; $y -le $ey + 2; $y++) { for ($x = $ex - 7; $x -le $ex + 2; $x++) {
        if ($b.GetPixel($x, $y).A -gt 0) { $k = '{0:X2}{1:X2}{2:X2}' -f $b.GetPixel($x, $y).R, $b.GetPixel($x, $y).G, $b.GetPixel($x, $y).B; if ($k -ne '050403' -and $k -ne '000000' -and $k -ne '1A1A1A') { Pt $b $x $y $(if (($x + $y) % 5 -eq 0) { 'F2C230' } else { 'C81E1E' }) } } } }
    foreach ($p in @(@(-1, -1), @(0, -1), @(1, -1), @(-1, 0), @(1, 0), @(-1, 1), @(0, 1), @(1, 1))) { Po $b ($ex + $p[0]) ($ey + $p[1]) 'FFFFFF' }
    Pt $b $ex $ey '1A1A1A' }

# Mira : (ex, ey) = her eye
$DECOS['mira_rousse'] = { param($b, $ex, $ey)              # freckles
    foreach ($p in @(@(-2, 2), @(-1, 3), @(0, 2), @(-3, 3))) { Po $b ($ex + $p[0]) ($ey + $p[1]) 'B0602A' } }
$DECOS['mira_treillis'] = { param($b, $ex, $ey)            # face paint stripes + dog tag
    Ligne $b ($ex - 3) ($ex) ($ey + 2) '3A4A20' -opaque; Ligne $b ($ex - 2) ($ex) ($ey + 3) '5A6A30' -opaque
    Po $b ($ex - 2) ($ey + 6) '8A8A90'; Po $b ($ex - 2) ($ey + 7) 'D8D8E0'; Po $b ($ex - 1) ($ey + 7) 'C0C0C8' }
$DECOS['mira_gothique'] = { param($b, $ex, $ey)            # choker with a red gem, winged eyeliner
    Ligne $b ($ex - 5) ($ex) ($ey + 5) '111111' -opaque; Po $b ($ex - 2) ($ey + 5) 'C81E3A'
    Pt $b ($ex + 1) ($ey - 1) '111111'; Po $b ($ex + 1) ($ey) '111111' }
$DECOS['mira_plage'] = { param($b, $ex, $ey)               # sunglasses on the head + flower in the hair
    Ligne $b ($ex - 5) ($ex + 1) ($ey - 4) '111111'; Pt $b ($ex - 3) ($ey - 4) '4A7AB8'; Pt $b ($ex) ($ey - 4) '4A7AB8'
    foreach ($p in @(@(-7, -3, 'FF4F9A'), @(-9, -3, 'FF4F9A'), @(-8, -4, 'FF4F9A'), @(-8, -2, 'FF4F9A'), @(-8, -3, 'FFD23C'))) { Pt $b ($ex + $p[0]) ($ey + $p[1]) $p[2] } }
$DECOS['mira_cyber'] = { param($b, $ex, $ey)               # neon visor + glowing tattoo
    Ligne $b ($ex - 4) ($ex + 1) ($ey) '3CF0FF'; Ligne $b ($ex - 3) ($ex + 1) ($ey + 1) '1A8AA8'
    Po $b ($ex - 2) ($ey + 3) 'FF4FD8'; Po $b ($ex - 1) ($ey + 4) 'FF4FD8' }

# ---------------- SOLDAT (base: joueur) ----------------
$U='322B28'; $D='171819'; $H='4C3D2E'; $V1='14121D'; $V2='242234'; $HC='586335'; $GO='FA6A0A'
$goggle2 = { param($k, $x, $y) if ($k -eq 'F9A31B' -and $y -lt 12) { return $script:g2 } ; $null }

Recolor 'joueur' 'soldat_urbain' @{ $U='4A4E54'; $D='2A2D31'; $H='6A7078'; $V1='24282D'; $V2='3A3F46'; $HC='7A8088' } $null
$script:g2 = 'A6E4FF'
Recolor 'joueur' 'soldat_neige' @{ $U='camo:E8ECF0,C8D0D8,A8B4C0'; $D='8C98A6'; $H='FFFFFF'; $V1='6C7A8A'; $V2='9AA8B8'; $HC='DDE4EA'; $GO='39B8FF' } $goggle2
Recolor 'joueur' 'soldat_jungle' @{ $U='camo:4E6B2E,2F4A1C,7A6A3A'; $D='22341A'; $H='6E8A3A'; $V1='3A2A1A'; $V2='5A4028'; $HC='8AA84A' } $null
$script:g2 = 'FFFFFF'
Recolor 'joueur' 'soldat_apparat' @{ $U='1E2E6A'; $D='121C44'; $H='2E44A0'; $V1='B8962E'; $V2='E8C24A'; $HC='E8C24A'; $GO='FFFFFF'; 'C68556'='5A3A2A' } $goggle2
$script:g2 = 'FF8AC4'
Recolor 'joueur' 'soldat_cyber' @{ $U='1C1C28'; $D='0A0A10'; $H='2E2E48'; $V1='0FB8C8'; $V2='3CF0FF'; $HC='3CF0FF'; $GO='FF2E88'; 'C68556'='2E2E48'; '8C5B3E'='15151C' } $goggle2

# ---------------- BRUTUS (base: brute) ----------------
$TT1='5E6E34'; $TT2='3E4A22'; $P1='4A5A2A'; $P2='28331A'; $P3='6E7E3C'; $BELT='3A2414'
$PEAU = @{ 'C68A5E'='7A4A2A'; '9E6640'='563018'; 'DDA27A'='9A6440'; '7A4A30'='3E2210'; 'B87E54'='6A3E22' }

Recolor 'brute' 'brute_marcel' @{ $TT1='EDEDED'; $TT2='B8B8C0' } $null
$m = $PEAU.Clone(); $m['6E5A48'] = '2E211A'; $m['3E3630'] = '1A1410'
Recolor 'brute' 'brute_fonce' $m $null
Recolor 'brute' 'brute_hawai' @{ $TT1='camo:E8402E,F2C230,2EB8A8'; $TT2='camo:B02A1E,C89A20,1E8A7E'; $P1='D8C49A'; $P2='A8946A'; $P3='F0E0B8' } $null
Recolor 'brute' 'brute_noel' @{ $TT1='D42A2A'; $TT2='9A1A1A'; $P1='D42A2A'; $P2='9A1A1A'; $P3='F04A4A'; $BELT='111111'; '6E5A48'='F2F2F2'; '3E3630'='F2F2F2' } $null
Recolor 'brute' 'brute_catch' @{ $TT1='C81E1E'; $TT2='8A1010'; $P1='1A1A1A'; $P2='0A0A0A'; $P3='333333'; $BELT='F2C230'; '2D1B1E'='C81E1E'; '0E0C0C'='8A1010' } {
    param($k, $x, $y) if (($k -eq '2D1B1E' -or $k -eq '0E0C0C') -and $y -lt 45) { return $k } ; $null }

# ---------------- MIRA (base: grenadier) ----------------
$HAIR = @('F2D46B', 'FFEFA8', 'C9A23A', 'B8902E', 'E6C258', '6E5414')
$TOP = @('F2F2F5', 'C4C4D0', 'B9B9C6')
$SHORT = @('3E5E92', '283F66', '5C80B8', '8FA8D0')
$SKIN = 'EDB98F'; $SKIND = 'C98E66'

function HairMap($cols) { $h = @{}; for ($i = 0; $i -lt 6; $i++) { $h[$HAIR[$i]] = $cols[$i] }; $h }

Recolor 'grenadier' 'mira_rousse' (HairMap @('D8642A', 'F29050', 'A8441A', '8A3410', 'E07A3A', '5A200A')) $null

$m = @{ 'F2F2F5'='6E7A3A'; 'C4C4D0'='4E5A2A'; 'B9B9C6'='4E5A2A' }
foreach ($s in $SHORT) { $m[$s] = 'camo:5A6A30,3A4A20,7A7040' }
Recolor 'grenadier' 'mira_treillis' $m $null

$m = HairMap @('2A2A36', '4A4A5E', '1A1A22', '14141C', '3A3A4A', '0A0A10')
$m['F2F2F5'] = '1E1E1E'; $m['C4C4D0'] = '0E0E0E'; $m['B9B9C6'] = '0E0E0E'; $m['D0606A'] = '6A1A8A'
$m['3E5E92'] = '4A1A5A'; $m['283F66'] = '2E0E3A'; $m['5C80B8'] = '6A2A7A'; $m['8FA8D0'] = '8A4A9A'
Recolor 'grenadier' 'mira_gothique' $m $null

# Beach outfit: small top, swim bottoms, bare legs, flip-flops
Recolor 'grenadier' 'mira_plage' @{} {
    param($k, $x, $y)
    if ($TOP -contains $k) { if ($y -ge 15 -and $y -le 18) { return $(if ($k -eq 'F2F2F5') { 'FF4F9A' } else { 'C82E70' }) } ; return $(if ($k -eq 'F2F2F5') { $SKIN } else { $SKIND }) }
    if ($SHORT -contains $k) { if ($y -le 37) { return $(if ($k -eq '283F66') { 'C82E70' } else { 'FF4F9A' }) } ; return $(if ($k -eq '283F66') { $SKIND } else { $SKIN }) }
    if (($k -eq '2D1B1E' -or $k -eq '0E0C0C') -and $y -ge 45) { if ($y -ge 61) { return 'FF4F9A' } ; return $(if ($k -eq '0E0C0C') { $SKIND } else { $SKIN }) }
    $null }

$m = HairMap @('FF4FD8', 'FFA8EE', 'C82EA8', 'A01E88', 'E83EC4', '5A0A4A')
$m['F2F2F5'] = '1C1C28'; $m['C4C4D0'] = '0A0A10'; $m['B9B9C6'] = '0A0A10'
$m['3E5E92'] = '1C1C28'; $m['283F66'] = '0A0A10'; $m['5C80B8'] = '2E2E48'; $m['8FA8D0'] = '3CF0FF'
$m['E07A1F'] = '3CF0FF'; $m['3C4654'] = '1C1C28'; $m['4E5A6C'] = '2E2E48'
Recolor 'grenadier' 'mira_cyber' $m $null
"ok"
