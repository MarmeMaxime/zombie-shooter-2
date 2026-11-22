param([string]$assets)
# Pixel-art reskins. ASCII only (PowerShell 5.1 reads scripts as ANSI).
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

function C($hex) { [System.Drawing.ColorTranslator]::FromHtml("#$hex") }
function K($c) { if ($c.A -eq 0) { return '' } ; '{0:X2}{1:X2}{2:X2}' -f $c.R, $c.G, $c.B }
function Load($path) { $s = [System.Drawing.Bitmap]::FromFile($path); $b = New-Object System.Drawing.Bitmap $s; $s.Dispose(); $b }
function Px($bmp, $x, $y, $hex) { if ($x -ge 0 -and $y -ge 0 -and $x -lt $bmp.Width -and $y -lt $bmp.Height) { $bmp.SetPixel($x, $y, (C $hex)) } }
function Opaque($bmp, $x, $y) { $x -ge 0 -and $y -ge 0 -and $x -lt $bmp.Width -and $y -lt $bmp.Height -and $bmp.GetPixel($x, $y).A -gt 0 }

# Soldier palette (source colors)
$cU='322B28'; $cD='171819'; $cH='4C3D2E'; $cVd='14121D'; $cVl='242234'; $cC='586335'
$cO1='FA6A0A'; $cO2='F9A31B'; $cWl='C68556'; $cWd='8C5B3E'; $cG='673931'; $cT='271F1B'; $cN='171516'
$OUTL = @('000000', '050403')

# Frames du soldat (assets\persos\soldat\<frame>.png)
$soldat = @{}
foreach ($fr in @('arret', 'tir', 'marche1', 'marche2', 'marche3', 'marche4')) { $soldat[$fr] = "persos\soldat\$fr" }
foreach ($d in @('persos\mira', 'persos\brutus', 'monstres\magicalgirl')) { New-Item -ItemType Directory -Force "$assets\$d" | Out-Null }

function HeadLeft($src) {
    for ($x = 0; $x -lt $src.Width; $x++) { if ($src.GetPixel($x, 4).A -gt 0) { return $x } }
    return 8
}

# ---------------------------------------------------------------- MIRA
$skinU='EDB98F'; $skinD='C98E66'; $skinH='F8D2AE'
$blond=@{ $cU='F2D46B'; $cC='FFEFA8'; $cT='C9A23A'; $cD='B8902E'; $cH='E6C258' }
foreach ($nom in $soldat.Keys) {
    $src = Load "$assets\$($soldat[$nom]).png"
    $bmp = Load "$assets\$($soldat[$nom]).png"
    $wx = 0; $wy = 0; $wn = 0
    # Face: remove the goggle frame (outline pixels inside the face) and keep a single eye
    $eyeX = -1; $eyeY = -1
    for ($y = 5; $y -le 9; $y++) { for ($x = 0; $x -lt $src.Width; $x++) { if ((K $src.GetPixel($x, $y)) -eq $cO1 -and $x -gt $eyeX) { $eyeX = $x; $eyeY = $y } } }
    $hl0 = HeadLeft $src
    for ($y = 6; $y -le 9; $y++) {
        $xr = -1; for ($x = 0; $x -lt $src.Width; $x++) { if ($src.GetPixel($x, $y).A -gt 0) { $xr = $x } }
        for ($x = $hl0 + 4; $x -lt $xr; $x++) {
            if ($OUTL -contains (K $src.GetPixel($x, $y)) -and ($x -lt $xr - 1 -or $y -ge 8)) { $bmp.SetPixel($x, $y, (C $skinU)) }
        }
    }
    for ($y = 0; $y -lt $src.Height; $y++) { for ($x = 0; $x -lt $src.Width; $x++) {
        $k = K $src.GetPixel($x, $y); if ($k -eq '') { continue }
        $n = $null
        if ($y -le 9 -and $k -eq $cO1) { $n = if ($x -eq $eyeX - 1 -and $y -eq $eyeY) { '22305A' } else { $skinU } }
        elseif ($k -eq $cWl) { $n = '3C4654'; if (-not (Opaque $src $x ($y-1)) -or (K $src.GetPixel($x, $y-1)) -ne $cWl) { $n = 'E07A1F' } }
        elseif ($k -eq $cWd) { $n = '262C36'; if ($y -ge 22) { $wx += $x; $wy += $y; $wn++ } }
        elseif ($k -eq $cG) { $n = '5A3A22' }
        elseif ($y -le 7 -and $blond.ContainsKey($k)) { $n = $blond[$k] }
        elseif ($y -le 9 -and $k -eq $cVd) { $n = $skinU }
        elseif ($y -le 11 -and $k -eq $cO2) { $n = $skinH }
        elseif ($y -le 9 -and $k -eq $cT) { $n = 'C9A23A' }
        elseif ($y -le 31) {
            switch ($k) {
                $cU { $n = $skinU } $cD { $n = $skinD } $cH { $n = $skinH } $cN { $n = $skinD } $cC { $n = $skinD }
                { $_ -eq $cVl -or $_ -eq $cVd } {
                    if ($y -le 12) { $n = if ($k -eq $cVl) { $skinU } else { $skinD } }   # neck, not a hood
                    elseif ($y -le 20) {
                        $n = if ($k -eq $cVl) { 'F2F2F5' } else { 'B9B9C6' }
                        if (($y -eq 20 -and ($x % 3) -eq 0) -or ($y -eq 19 -and ($x % 5) -eq 1) -or ($y -eq 16 -and ($x % 7) -eq 3)) { $n = $skinD }   # torn edge / holes
                    } else { $n = if ($k -eq $cVl) { $skinU } else { $skinD } }
                }
            }
        }
        elseif ($y -le 42) {
            switch ($k) { $cU { $n = '3E5E92' } $cD { $n = '283F66' } $cH { $n = '5C80B8' } $cVl { $n = '283F66' } $cVd { $n = '283F66' } }
            if ($y -eq 42 -and $n -and ($x % 2) -eq 0) { $n = '8FA8D0' }   # frayed hem
        }
        else { switch ($k) { $cU { $n = $skinU } $cD { $n = $skinD } $cH { $n = $skinH } } }
        if ($n) { $bmp.SetPixel($x, $y, (C $n)) }
    } }

    # Cute face: big eye with highlight, lashes, blush, soft nose, lips
    if ($eyeX -gt 0) {
        $ex = $eyeX - 1; $ey = $eyeY
        # soften: no dark pixel left inside the face except the silhouette
        for ($y = $ey; $y -le $ey + 3; $y++) {
            $xr = -1; for ($x = 0; $x -lt $src.Width; $x++) { if ($src.GetPixel($x, $y).A -gt 0) { $xr = $x } }
            for ($x = $ex - 3; $x -lt $xr; $x++) { if ($OUTL -contains (K $bmp.GetPixel($x, $y))) { $bmp.SetPixel($x, $y, (C $skinU)) } }
        }
        Px $bmp $ex $ey '22305A'; Px $bmp $ex ($ey + 1) '2A4FA8'
        Px $bmp ($ex - 1) $ey 'FFFFFF'; Px $bmp ($ex - 1) ($ey + 1) '3A6BD8'
        Px $bmp ($ex - 2) ($ey - 1) '3A2A10'; Px $bmp ($ex - 1) ($ey - 1) '3A2A10'; Px $bmp $ex ($ey - 1) '3A2A10'; Px $bmp ($ex + 1) ($ey - 2) '3A2A10'
        Px $bmp ($ex - 2) ($ey + 2) 'F4A3A3'; Px $bmp ($ex - 1) ($ey + 2) 'F4A3A3'
        Px $bmp ($ex + 1) ($ey + 3) 'D0606A'; Px $bmp $ex ($ey + 3) 'E58A8A'
    }

    # Profile frames: same silhouette as the front view (chest curve in the crop top)
    if ($nom -like 'marche*') {
        $avance = @{ 14 = 1; 15 = 2; 16 = 3; 17 = 3; 18 = 3; 19 = 2; 20 = 1 }
        foreach ($y in 14..20) {
            $tx = -1
            for ($x = 8; $x -lt 30; $x++) { if ((K $bmp.GetPixel($x, $y)) -eq 'F2F2F5') { $tx = $x; break } }
            if ($tx -lt 0) { continue }
            $bord = $tx
            while ($bord + 1 -lt $bmp.Width -and $bmp.GetPixel($bord + 1, $y).A -gt 0) { $bord++ }
            $neuf = $bord + $avance[$y]
            for ($x = $tx; $x -lt $neuf; $x++) {
                $col = if ($y -ge 18 -and $x -ge $neuf - 2) { 'C4C4D0' } elseif ($x -eq $neuf - 1 -and $y -le 15) { 'FFFFFF' } else { 'F2F2F5' }
                $bmp.SetPixel($x, $y, (C $col))
            }
            $bmp.SetPixel($neuf, $y, (C '050403'))
        }
    }

    # Front-facing frames: clean, fitted crop top with a feminine silhouette
    if ($nom -eq 'arret' -or $nom -eq 'tir') {
        $haut = @(
            'owwwshswwwo',
            'owwwwswwwwh',
            'ogwwwdwwwws',
            'ogwwwgwwwws',
            'oggwgggwgws',
            'odggwgdggwo',
            'odswswswsdo'
        )
        # o outline, w white, g shade, s skin, d skin shadow, h skin highlight
        $pal = @{ 'o' = '050403'; 'w' = 'F2F2F5'; 'g' = 'C4C4D0'; 's' = $skinU; 'd' = $skinD; 'h' = $skinH }
        for ($r = 0; $r -lt $haut.Count; $r++) { for ($q = 0; $q -lt 11; $q++) {
            Px $bmp (11 + $q) (14 + $r) $pal[[string]$haut[$r][$q]]
        } }
    }

    # Grenade drum on the launcher
    if ($wn -gt 0) {
        $cx = [int]($wx / $wn); $cy = [int]($wy / $wn)
        for ($dy = -4; $dy -le 4; $dy++) { for ($dx = -4; $dx -le 4; $dx++) {
            $d2 = $dx * $dx + $dy * $dy
            if ($d2 -le 12) { Px $bmp ($cx+$dx) ($cy+$dy) $(if ($dy -eq 0) { 'E07A1F' } elseif ($d2 -le 4) { '4E5A6C' } else { '3C4654' }) }
            elseif ($d2 -le 20) { Px $bmp ($cx+$dx) ($cy+$dy) '000000' }
        } }
    }

    # Long blond hair falling down the back
    $hl = HeadLeft $src
    for ($y = 5; $y -le 25; $y++) {
        $w = if ($y -le 18) { 4 } elseif ($y -le 22) { 3 } else { 2 }
        $x0 = $hl - 1 - [Math]::Floor(($y - 5) / 6)
        Px $bmp ($x0 - 1) $y '6E5414'
        for ($i = 0; $i -lt $w; $i++) { Px $bmp ($x0 + $i) $y $(if ($i -eq 1) { 'FFEFA8' } elseif ($i -eq 0) { 'C9A23A' } else { 'F2D46B' }) }
    }
    Px $bmp ($hl - 2 - [Math]::Floor(20 / 6)) 26 '6E5414'

    $bmp.Save("$assets\persos\mira\$nom.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose(); $src.Dispose()
}

# ---------------------------------------------------------------- BRUTUS
$bU='C68A5E'; $bD='9E6640'; $bH='DDA27A'
foreach ($nom in $soldat.Keys) {
    $src = Load "$assets\$($soldat[$nom]).png"
    $tmp = Load "$assets\$($soldat[$nom]).png"
    $ox = 0; $oy = 0; $on = 0; $oxMax = 0
    $hl0 = HeadLeft $src
    # Bare head: every outline pixel inside the head (helmet rim, goggle frame) becomes skin
    for ($y = 3; $y -le 9; $y++) {
        $xr = -1; for ($x = 0; $x -lt $src.Width; $x++) { if ($src.GetPixel($x, $y).A -gt 0) { $xr = $x } }
        for ($x = $hl0 + 2; $x -lt $xr; $x++) {
            if ($OUTL -contains (K $src.GetPixel($x, $y))) { $tmp.SetPixel($x, $y, (C $(if ($y -ge 8) { '6E5A48' } else { 'B87E54' }))) }
        }
    }
    for ($y = 0; $y -lt $src.Height; $y++) { for ($x = 0; $x -lt $src.Width; $x++) {
        $k = K $src.GetPixel($x, $y); if ($k -eq '') { continue }
        if ($y -le 9 -and $k -eq $cO1) { $ox += $x; $oy += $y; $on++; if ($x -gt $oxMax) { $oxMax = $x } }
    } }
    for ($y = 0; $y -lt $src.Height; $y++) { for ($x = 0; $x -lt $src.Width; $x++) {
        $k = K $src.GetPixel($x, $y); if ($k -eq '') { continue }
        $n = $null
        if ($k -eq $cWl) { $n = '8A3A2A' }
        elseif ($k -eq $cWd) { $n = '5E2418' }
        elseif ($y -le 9) {
            if ($y -le 2 -and ($k -eq $cU -or $k -eq $cC -or $k -eq $cT)) { $n = '3E3630' }       # buzz cut
            elseif ($k -eq $cC) { $n = '3E3630' }
            elseif ($k -eq $cU -or $k -eq $cH) { $n = $bU }
            elseif ($k -eq $cD -or $k -eq $cT) { $n = $bD }
            elseif ($k -eq $cVd) { $n = if ($y -ge 8) { '6E5A48' } else { $bD } }                  # stubble
            elseif ($k -eq $cO1) { $n = if ($x -eq $oxMax) { '1A1A1A' } else { $bU } }
            elseif ($k -eq $cO2) { $n = $bH }
        }
        elseif ($y -le 31) {
            switch ($k) { $cU { $n = $bU } $cD { $n = $bD } $cH { $n = $bH } $cN { $n = '7A4A30' } $cVl { $n = '5E6E34' } $cVd { $n = '3E4A22' } }
            if ($y -le 12 -and ($k -eq $cVd -or $k -eq $cVl)) { $n = if ($y -le 10) { '6E5A48' } else { $bD } }   # neck, not a hood
            if ($y -le 11 -and $k -eq $cO2) { $n = $bH }
        }
        else { switch ($k) { $cU { $n = '4A5A2A' } $cD { $n = '28331A' } $cH { $n = '6E7E3C' } $cVl { $n = '3A2414' } $cVd { $n = '3A2414' } } }
        if ($n) { $tmp.SetPixel($x, $y, (C $n)) }
    } }

    # Big scar across the face
    if ($on -gt 0) {
        $cx = [int]($ox / $on); $cy = [int]($oy / $on)
        for ($i = -4; $i -le 3; $i++) {
            $sx = $cx - 1 + [int]($i * 0.6); $sy = $cy + $i
            foreach ($p in @(@($sx, 'A8443E'), @(($sx + 1), 'E08A80'))) {
                $px = $p[0]
                if ($px -ge 0 -and $sy -ge 0 -and $sy -lt $src.Height) {
                    $kk = K $tmp.GetPixel($px, $sy)
                    if ($kk -ne '' -and $OUTL -notcontains $kk) { $tmp.SetPixel($px, $sy, (C $p[1])) }
                }
            }
        }
        # Eye and heavy brow
        $tmp.SetPixel($oxMax - 1, $cy, (C '1A1A1A'))
        foreach ($bx in ($oxMax - 2)..$oxMax) { $tmp.SetPixel($bx, $cy - 1, (C '3E3630')) }
    }

    # Bulkier: stretch horizontally (nearest neighbour)
    $out = New-Object System.Drawing.Bitmap $src.Width, $src.Height
    $f = 1.2
    for ($y = 0; $y -lt $src.Height; $y++) { for ($x = 0; $x -lt $out.Width; $x++) {
        $sx = [Math]::Floor($x / $f)
        if ($sx -lt $tmp.Width) { $out.SetPixel($x, $y, $tmp.GetPixel($sx, $y)) }
    } }
    $out.Save("$assets\persos\brutus\$nom.png",[System.Drawing.Imaging.ImageFormat]::Png)
    $out.Dispose(); $tmp.Dispose(); $src.Dispose()
}

# ---------------------------------------------------------------- MAGICAL GIRL
$etoile = @('...X...', '..XXX..', 'XXXXXXX', '.XXXXX.', '..XXX..', '.XX.XX.', '.X...X.')
$noeudPoitrine = @('.RR.RR.', 'RRRYRRR', '.RR.RR.', '..R.R..')
$grandNoeud = @('RR...RR', 'RRRYRRR', 'RR.R.RR')
for ($i = 1; $i -le 12; $i++) {
    $src = Load "$assets\monstres\tank\marche$i.png"
    $bmp = Load "$assets\monstres\tank\marche$i.png"
    $W = $src.Width; $Hh = $src.Height

    # Measure the frame
    $topW = 999; $hairR = 0; $hairTop = 999; $hairL = 999
    $skirtTop = @{}; $skirtBot = @{}; $bootTop = @{}
    $main = $null
    for ($y = 0; $y -lt $Hh; $y++) { for ($x = 0; $x -lt $W; $x++) {
        $k = K $src.GetPixel($x, $y); if ($k -eq '') { continue }
        if ($k -eq 'DDCEBF' -or $k -eq '696682') { if ($y -lt $topW) { $topW = $y } }
        if ($k -eq '271F1B' -or $k -eq '0E0C0C') {
            if ($y -lt $hairTop) { $hairTop = $y }
            if ($y -ge 6 -and $y -le 10 -and $x -gt $hairR) { $hairR = $x }
            if ($y -le 4 -and $x -lt $hairL) { $hairL = $x }
        }
        if ($k -eq '242234' -or $k -eq '14121D') {
            if (-not $skirtTop.ContainsKey($x) -and $y -ge 28) { $skirtTop[$x] = $y }
            if ($y -ge 28) { $skirtBot[$x] = $y }
        }
        if (($k -eq '452A1B' -or $k -eq '4F342F') -and -not $bootTop.ContainsKey($x)) { $bootTop[$x] = $y }
        if (($k -eq 'C7B08B' -or $k -eq 'A08662') -and (-not $main -or $x -lt $main[0])) { $main = @($x, $y) }
    } }

    $cxs = 0; $cys = 0; $cn = 0
    for ($y = 0; $y -lt $Hh; $y++) { for ($x = 0; $x -lt $W; $x++) {
        $k = K $src.GetPixel($x, $y); if ($k -eq '') { continue }
        $n = $null
        switch ($k) {
            '271F1B' { $n = 'F06AAE' }
            '0E0C0C' { $n = 'A8306E' }
            { $_ -eq 'DDCEBF' -or $_ -eq '696682' } {
                $hi = ($k -eq 'DDCEBF')
                if ($y -lt $topW + 4) { $n = if ($hi) { '6FA0FF' } else { '3A62C4' } }            # sailor collar
                elseif ($y -lt $topW + 12) { $n = if ($hi) { 'FFF6FB' } else { 'E2A6C8' }; if ($y -ge $topW + 4 -and $y -le $topW + 8) { $cxs += $x; $cys += $y; $cn++ } }
                else { $n = if ($hi) { 'FF86C0' } else { 'D0589A' } }                                  # bodice
            }
            { $_ -eq '242234' -or $_ -eq '14121D' } {
                $n = if ($k -eq '242234') { 'FF5FA8' } else { 'C23C82' }
                if ($skirtTop.ContainsKey($x) -and $y -eq $skirtTop[$x]) { $n = 'FFD84D' }               # golden waistband
                elseif ($skirtBot.ContainsKey($x) -and $y -ge $skirtBot[$x] - 1) { $n = if ((($x + $y) % 2) -eq 0) { 'FFFFFF' } else { 'FFC6E4' } }   # frills
            }
            '36282B' { $n = 'F4EEFA' }
            '2D1B1E' { $n = 'B6A8CC' }
            { $_ -eq '452A1B' -or $_ -eq '4F342F' } {
                $n = if ($k -eq '452A1B') { 'E0408A' } else { '9E2463' }
                if ($bootTop.ContainsKey($x) -and $y -eq $bootTop[$x]) { $n = 'FFFFFF' }                # boot cuff
            }
        }
        if ($n) { $bmp.SetPixel($x, $y, (C $n)) }
    } }

    # Twin tail behind the head
    if ($hairR -gt 0) {
        for ($y = 7; $y -le 36; $y++) {
            $x0 = $hairR + [int][Math]::Round(1.5 * [Math]::Sin($y / 3.5))
            $w = if ($y -lt 32) { 3 } else { 2 }
            for ($j = -1; $j -le $w; $j++) {
                $xx = $x0 + $j
                if (Opaque $src $xx $y) { continue }
                $col = if ($j -eq -1 -or $j -eq $w) { '7A1F52' } elseif ($j -eq 0) { 'C94F90' } elseif ($j -eq 1) { 'F06AAE' } else { 'FF9AD0' }
                Px $bmp $xx $y $col
            }
        }
        Px $bmp ($hairR) 7 'FFE14D'; Px $bmp ($hairR + 1) 7 'FFE14D'; Px $bmp ($hairR) 8 'FFE14D'; Px $bmp ($hairR + 1) 8 'E8195C'
        # Big bow on top
        $bx = $hairR - 7; $by = [Math]::Max(0, $hairTop - 1)
        for ($r = 0; $r -lt 3; $r++) { for ($q = 0; $q -lt 7; $q++) {
            switch ($grandNoeud[$r][$q]) { 'R' { Px $bmp ($bx + $q) ($by + $r) 'E8195C' } 'Y' { Px $bmp ($bx + $q) ($by + $r) 'FFE14D' } }
        } }
    }

    # Tiara on the forehead
    if ($hairL -lt 999) {
        for ($q = 0; $q -lt 6; $q++) { Px $bmp ($hairL + 1 + $q) ($hairTop + 3) 'FFD84D' }
        Px $bmp ($hairL + 3) ($hairTop + 2) 'FFD84D'; Px $bmp ($hairL + 3) ($hairTop + 3) 'FF2E8A'
    }

    # Ribbon bow on the chest
    if ($cn -gt 0) {
        $cx = [int]($cxs / $cn) - 3; $cy = [int]($cys / $cn) - 1
        for ($r = 0; $r -lt 4; $r++) { for ($q = 0; $q -lt 7; $q++) {
            switch ($noeudPoitrine[$r][$q]) { 'R' { Px $bmp ($cx + $q) ($cy + $r) 'E8195C' } 'Y' { Px $bmp ($cx + $q) ($cy + $r) 'FFE14D' } }
        } }
    }

    # Wand with a big star
    if ($main) {
        $hx = [Math]::Max(3, $main[0])
        for ($d = 1; $d -le 6; $d++) { Px $bmp $hx ($main[1] - $d) 'F7F2FF' }
        $ex = $hx - 3; $ey = $main[1] - 13
        for ($r = 0; $r -lt 7; $r++) { for ($q = 0; $q -lt 7; $q++) { if ($etoile[$r][$q] -eq 'X') { Px $bmp ($ex + $q) ($ey + $r) 'FFE14D' } } }
        Px $bmp ($ex + 3) ($ey + 3) 'FF7EB9'
    }

    $bmp.Save("$assets\monstres\magicalgirl\marche$i.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose(); $src.Dispose()
}
"ok"
