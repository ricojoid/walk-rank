Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\src\app\fujitsu.png"
$img = [System.Drawing.Image]::FromFile((Resolve-Path $srcPath).Path)

$origW = $img.Width
$origH = $img.Height
Write-Host "Original dimensions: ${origW}x${origH}"

# Target square size
$targetSize = 512
$squareBmp = New-Object System.Drawing.Bitmap($targetSize, $targetSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($squareBmp)

$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$graphics.Clear([System.Drawing.Color]::Transparent)

# Fit inside targetSize with 8% padding
$padding = [int]($targetSize * 0.08)
$availW = $targetSize - (2 * $padding)
$availH = $targetSize - (2 * $padding)

$ratio = [Math]::Min($availW / $origW, $availH / $origH)
$destW = [int]($origW * $ratio)
$destH = [int]($origH * $ratio)

$destX = [int](($targetSize - $destW) / 2)
$destY = [int](($targetSize - $destH) / 2)

Write-Host "Destination rect: x=$destX, y=$destY, w=$destW, h=$destH"

$rect = New-Object System.Drawing.Rectangle($destX, $destY, $destW, $destH)
$graphics.DrawImage($img, $rect)

# Save to src/app/icon.png
$iconPngPath = Join-Path $PSScriptRoot "..\src\app\icon.png"
$squareBmp.Save((Resolve-Path (Join-Path $PSScriptRoot "..\src\app")).Path + "\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Saved src/app/icon.png"

# Save to public/icon.png
$publicDir = (Resolve-Path (Join-Path $PSScriptRoot "..\public")).Path
$squareBmp.Save("$publicDir\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Saved public/icon.png"

# Also create a 64x64 version for favicon.ico
$icoSize = 64
$icoBmp = New-Object System.Drawing.Bitmap($squareBmp, $icoSize, $icoSize)
$icoBmp.Save("$publicDir\favicon.ico", [System.Drawing.Imaging.ImageFormat]::Icon)
Write-Host "Saved public/favicon.ico"

# Save to src/app/favicon.ico
$squareAppDir = (Resolve-Path (Join-Path $PSScriptRoot "..\src\app")).Path
$icoBmp.Save("$squareAppDir\favicon.ico", [System.Drawing.Imaging.ImageFormat]::Icon)
Write-Host "Saved src/app/favicon.ico"

$graphics.Dispose()
$squareBmp.Dispose()
$icoBmp.Dispose()
$img.Dispose()

Write-Host "All icons generated successfully!"
