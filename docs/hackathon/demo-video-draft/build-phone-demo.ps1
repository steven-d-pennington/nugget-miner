param(
    [string]$CaptureDirectory = (Join-Path $env:USERPROFILE 'Downloads'),
    [string]$FfmpegDirectory = 'C:\Users\Steven Pennington\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin'
)

$ErrorActionPreference = 'Stop'

$ffmpeg = Join-Path $FfmpegDirectory 'ffmpeg.exe'
$ffprobe = Join-Path $FfmpegDirectory 'ffprobe.exe'
$draftDirectory = $PSScriptRoot
$finalDirectory = Join-Path (Split-Path $draftDirectory -Parent) 'demo-video-final'
$visualOutput = Join-Path $draftDirectory 'nugget-demo-phone-visual-rough-cut.mp4'
$narratedSource = Join-Path $finalDirectory 'nugget-demo-final-with-openai-narration.mp4'
$finalOutput = Join-Path $finalDirectory 'nugget-demo-final-phone-walkthrough.mp4'

$capture0110 = Join-Path $CaptureDirectory 'ScreenRecording_07-18-2026 01-10-58_1.MP4'
$capture0235 = Join-Path $CaptureDirectory 'ScreenRecording_07-18-2026 02-35-48_1.MP4'
$capture0238 = Join-Path $CaptureDirectory 'ScreenRecording_07-18-2026 02-38-45_1.MP4'
$capture0242 = Join-Path $CaptureDirectory 'ScreenRecording_07-18-2026 02-42-35_1.MP4'
$capture0246 = Join-Path $CaptureDirectory 'ScreenRecording_07-18-2026 02-46-36_1.MP4'

$requiredFiles = @(
    $ffmpeg,
    $ffprobe,
    $capture0110,
    $capture0235,
    $capture0238,
    $capture0242,
    $capture0246,
    $narratedSource
)

foreach ($file in $requiredFiles) {
    if (-not (Test-Path -LiteralPath $file)) {
        throw "Required file is missing: $file"
    }
}

function Get-PortraitFilter {
    param(
        [int]$Index,
        [int]$Duration
    )

    $shadow = 'drawbox=x=737:y=48:w=462:h=1000:color=black@0.12:t=fill'
    $border = 'drawbox=x=728:y=39:w=464:h=1002:color=0xD8CBB7@0.9:t=2'

    return "[$Index`:v]fps=30,scale=-2:1000:flags=lanczos,setsar=1[fg$Index];" +
        "color=c=0xF7F2EA:s=1920x1080:r=30:d=$Duration[bg$Index];" +
        "[bg$Index]$shadow,$border[base$Index];" +
        "[base$Index][fg$Index]overlay=(W-w)/2:(H-h)/2:shortest=1," +
        "format=yuv420p,setpts=PTS-STARTPTS[v$Index]"
}

$filters = @(
    (Get-PortraitFilter -Index 0 -Duration 16),
    (Get-PortraitFilter -Index 1 -Duration 13),
    (Get-PortraitFilter -Index 2 -Duration 20),
    (Get-PortraitFilter -Index 3 -Duration 13),
    (Get-PortraitFilter -Index 4 -Duration 16),
    (Get-PortraitFilter -Index 5 -Duration 9),
    (Get-PortraitFilter -Index 6 -Duration 12),
    (Get-PortraitFilter -Index 7 -Duration 20),
    (Get-PortraitFilter -Index 8 -Duration 17),
    '[9:v]fps=30,scale=1920:1080:flags=lanczos,setsar=1,trim=duration=36,setpts=PTS-STARTPTS[v9]',
    '[v0][v1][v2][v3][v4][v5][v6][v7][v8][v9]concat=n=10:v=1:a=0[outv]'
)

$visualArgs = @(
    '-y',
    '-ss', '24', '-t', '16', '-i', $capture0110,
    '-ss', '38', '-t', '13', '-i', $capture0235,
    '-ss', '62', '-t', '20', '-i', $capture0238,
    '-ss', '140.5', '-t', '13', '-i', $capture0235,
    '-ss', '104', '-t', '16', '-i', $capture0238,
    '-ss', '0', '-t', '9', '-i', $capture0246,
    '-ss', '4', '-t', '12', '-i', $capture0246,
    '-ss', '0', '-t', '20', '-i', $capture0242,
    '-ss', '28', '-t', '17', '-i', $capture0246,
    '-ss', '136', '-t', '36', '-i', $narratedSource,
    '-filter_complex', ($filters -join ';'),
    '-map', '[outv]',
    '-an',
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '19',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    $visualOutput
)

& $ffmpeg @visualArgs
if ($LASTEXITCODE -ne 0) {
    throw "Visual render failed with exit code $LASTEXITCODE"
}

$muxArgs = @(
    '-y',
    '-i', $visualOutput,
    '-i', $narratedSource,
    '-map', '0:v:0',
    '-map', '1:a:0',
    '-map', '1:s:0?',
    '-c:v', 'copy',
    '-c:a', 'copy',
    '-c:s', 'mov_text',
    '-metadata:s:a:0', 'language=eng',
    '-metadata:s:s:0', 'language=eng',
    '-shortest',
    '-movflags', '+faststart',
    $finalOutput
)

& $ffmpeg @muxArgs
if ($LASTEXITCODE -ne 0) {
    throw "Narration mux failed with exit code $LASTEXITCODE"
}

& $ffprobe -v error -show_entries format=duration,size -show_entries stream=index,codec_type,codec_name,width,height,sample_rate,channels -of json -- $finalOutput
if ($LASTEXITCODE -ne 0) {
    throw "Final media verification failed with exit code $LASTEXITCODE"
}

Write-Host "Created $finalOutput"
