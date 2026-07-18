param(
    [string]$RecordingSource = (Join-Path $env:USERPROFILE 'Downloads\ScreenRecording_07-18-2026 02-35-48_1.MP4'),
    [double]$RecordingStart = 38,
    [double]$RecordingDuration = 13,
    [string]$BrowserSource = (Join-Path $PSScriptRoot 'browser-walkthrough.webm'),
    [string]$BrowserTimeline = (Join-Path $PSScriptRoot 'browser-walkthrough-timeline.json'),
    [string]$SilentOutput = '',
    [string]$CaptureDirectory = (Join-Path $env:USERPROFILE 'Downloads'),
    [string]$FfmpegDirectory = 'C:\Users\Steven Pennington\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin'
)

$ErrorActionPreference = 'Stop'

$ffmpeg = Join-Path $FfmpegDirectory 'ffmpeg.exe'
$ffprobe = Join-Path $FfmpegDirectory 'ffprobe.exe'
$hackathonDirectory = Split-Path $PSScriptRoot -Parent
$finalDirectory = Join-Path $hackathonDirectory 'demo-video-final'
$narratedSource = Join-Path $finalDirectory 'nugget-demo-final-with-openai-narration.mp4'
if (-not $SilentOutput) {
    $SilentOutput = Join-Path $finalDirectory 'nugget-demo-hybrid-silent.mp4'
}

$capture0110 = Join-Path $CaptureDirectory 'ScreenRecording_07-18-2026 01-10-58_1.MP4'
$capture0235 = Join-Path $CaptureDirectory 'ScreenRecording_07-18-2026 02-35-48_1.MP4'
$capture0238 = Join-Path $CaptureDirectory 'ScreenRecording_07-18-2026 02-38-45_1.MP4'

$requiredFiles = @(
    $ffmpeg,
    $ffprobe,
    $capture0110,
    $capture0235,
    $capture0238,
    $RecordingSource,
    $BrowserSource,
    $BrowserTimeline,
    $narratedSource
)

foreach ($file in $requiredFiles) {
    if (-not (Test-Path -LiteralPath $file)) {
        throw "Required file is missing: $file"
    }
}

if ($RecordingStart -lt 0 -or $RecordingDuration -le 0) {
    throw 'RecordingStart must be non-negative and RecordingDuration must be positive.'
}

New-Item -ItemType Directory -Path $finalDirectory -Force | Out-Null
$timeline = Get-Content -LiteralPath $BrowserTimeline -Raw | ConvertFrom-Json

function Convert-ToFfmpegNumber {
    param([double]$Value)
    return $Value.ToString('0.###', [Globalization.CultureInfo]::InvariantCulture)
}

function Get-Chapter {
    param([string]$Name)

    $matches = @($timeline.chapters | Where-Object { $_.name -eq $Name })
    if ($matches.Count -ne 1) {
        throw "Expected exactly one browser chapter named '$Name'; found $($matches.Count)."
    }

    $start = [double]$matches[0].startSeconds
    $end = [double]$matches[0].endSeconds
    if ($start -lt 0 -or $end -le $start) {
        throw "Browser chapter '$Name' has invalid timing: $start to $end."
    }

    return [pscustomobject]@{
        Name = $Name
        Start = $start
        Duration = $end - $start
    }
}

function Get-PortraitFilter {
    param(
        [int]$Index,
        [string]$OutputLabel,
        [double]$InputDuration,
        [double]$OutputDuration,
        [ValidateSet('none', 'hold', 'stretch', 'action-hold')]
        [string]$Timing = 'none'
    )

    $input = Convert-ToFfmpegNumber $InputDuration
    $output = Convert-ToFfmpegNumber $OutputDuration
    $timingFilter = switch ($Timing) {
        'hold' {
            $padding = Convert-ToFfmpegNumber ([Math]::Max(0, $OutputDuration - $InputDuration))
            "tpad=stop_mode=clone:stop_duration=$padding,trim=duration=$output"
        }
        'stretch' {
            $ratio = Convert-ToFfmpegNumber ($OutputDuration / $InputDuration)
            "setpts=$ratio*PTS,trim=duration=$output"
        }
        'action-hold' {
            $endPadding = Convert-ToFfmpegNumber ([Math]::Max(0, $OutputDuration - $InputDuration - 2))
            "tpad=start_mode=clone:start_duration=2:stop_mode=clone:stop_duration=$endPadding,trim=duration=$output"
        }
        default { "trim=duration=$output" }
    }

    $shadow = 'drawbox=x=737:y=48:w=462:h=1000:color=black@0.12:t=fill'
    $border = 'drawbox=x=728:y=39:w=464:h=1002:color=0xD8CBB7@0.9:t=2'

    return "[$Index`:v]fps=30,scale=-2:1000:flags=lanczos,setsar=1,trim=duration=$input,setpts=PTS-STARTPTS,$timingFilter[fg$Index];" +
        "color=c=0xF7F2EA:s=1920x1080:r=30:d=$output[bg$Index];" +
        "[bg$Index]$shadow,$border[base$Index];" +
        "[base$Index][fg$Index]overlay=(W-w)/2:(H-h)/2:shortest=1," +
        "format=yuv420p,setpts=PTS-STARTPTS[$OutputLabel]"
}

function Get-PushInFilter {
    param(
        [string]$InputLabel,
        [string]$OutputLabel,
        [double]$Duration,
        [double]$MaximumZoom = 1.06
    )

    $frames = Convert-ToFfmpegNumber ($Duration * 30)
    $zoom = Convert-ToFfmpegNumber $MaximumZoom
    $delta = Convert-ToFfmpegNumber ($MaximumZoom - 1)
    return "[$InputLabel]zoompan=z='min(1+$delta*on/$frames,$zoom)':" +
        "x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30," +
        "format=yuv420p[$OutputLabel]"
}

$ideasCards = Get-Chapter 'ideas-cards'
$ideasCompact = Get-Chapter 'ideas-compact'
$ideasCardsReturn = Get-Chapter 'ideas-cards-return'
$ideaDetail = Get-Chapter 'idea-detail'
$actions = Get-Chapter 'actions'
$targetDuration = 158.5 + $RecordingDuration
$targetDurationText = Convert-ToFfmpegNumber $targetDuration

$filters = @(
    (Get-PortraitFilter -Index 0 -OutputLabel 'v0' -InputDuration 16 -OutputDuration 16),
    (Get-PortraitFilter -Index 1 -OutputLabel 'v1raw' -InputDuration $RecordingDuration -OutputDuration $RecordingDuration),
    (Get-PushInFilter -InputLabel 'v1raw' -OutputLabel 'v1' -Duration $RecordingDuration),
    (Get-PortraitFilter -Index 2 -OutputLabel 'v2' -InputDuration 20 -OutputDuration 20),
    (Get-PortraitFilter -Index 3 -OutputLabel 'v3' -InputDuration 13 -OutputDuration 13),
    (Get-PortraitFilter -Index 4 -OutputLabel 'v4' -InputDuration 16 -OutputDuration 16),
    (Get-PortraitFilter -Index 5 -OutputLabel 'v5' -InputDuration $ideasCards.Duration -OutputDuration 9 -Timing 'hold'),
    (Get-PortraitFilter -Index 6 -OutputLabel 'v6a' -InputDuration $ideasCompact.Duration -OutputDuration $ideasCompact.Duration),
    (Get-PortraitFilter -Index 7 -OutputLabel 'v6b' -InputDuration $ideasCardsReturn.Duration -OutputDuration $ideasCardsReturn.Duration),
    "[v6a][v6b]concat=n=2:v=1:a=0,tpad=stop_mode=clone:stop_duration=4,trim=duration=12,setpts=PTS-STARTPTS[v6raw]",
    (Get-PushInFilter -InputLabel 'v6raw' -OutputLabel 'v6' -Duration 12),
    (Get-PortraitFilter -Index 8 -OutputLabel 'v7raw' -InputDuration $ideaDetail.Duration -OutputDuration 20 -Timing 'stretch'),
    (Get-PushInFilter -InputLabel 'v7raw' -OutputLabel 'v7' -Duration 20),
    (Get-PortraitFilter -Index 9 -OutputLabel 'v8' -InputDuration $actions.Duration -OutputDuration 17 -Timing 'action-hold'),
    '[10:v]fps=30,scale=1920:1080:flags=lanczos,setsar=1,trim=duration=35.7,setpts=PTS-STARTPTS[v9]',
    ("[v0][v1][v2][v3][v4][v5][v6][v7][v8][v9]concat=n=10:v=1:a=0," +
        "trim=duration=$targetDurationText,scale=in_range=auto:out_range=tv,format=yuv420p[outv]")
)

$renderArgs = @(
    '-y',
    '-ss', '24', '-t', '16', '-i', $capture0110,
    '-ss', (Convert-ToFfmpegNumber $RecordingStart), '-t', (Convert-ToFfmpegNumber $RecordingDuration), '-i', $RecordingSource,
    '-ss', '62', '-t', '20', '-i', $capture0238,
    '-ss', '140.5', '-t', '13', '-i', $capture0235,
    '-ss', '104', '-t', '16', '-i', $capture0238,
    '-ss', (Convert-ToFfmpegNumber $ideasCards.Start), '-t', (Convert-ToFfmpegNumber $ideasCards.Duration), '-i', $BrowserSource,
    '-ss', (Convert-ToFfmpegNumber $ideasCompact.Start), '-t', (Convert-ToFfmpegNumber $ideasCompact.Duration), '-i', $BrowserSource,
    '-ss', (Convert-ToFfmpegNumber $ideasCardsReturn.Start), '-t', (Convert-ToFfmpegNumber $ideasCardsReturn.Duration), '-i', $BrowserSource,
    '-ss', (Convert-ToFfmpegNumber $ideaDetail.Start), '-t', (Convert-ToFfmpegNumber $ideaDetail.Duration), '-i', $BrowserSource,
    '-ss', (Convert-ToFfmpegNumber $actions.Start), '-t', (Convert-ToFfmpegNumber $actions.Duration), '-i', $BrowserSource,
    '-ss', '136', '-t', '35.7', '-i', $narratedSource,
    '-filter_complex', ($filters -join ';'),
    '-map', '[outv]',
    '-an',
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '19',
    '-r', '30',
    '-pix_fmt', 'yuv420p',
    '-color_range', 'tv',
    '-movflags', '+faststart',
    '-metadata', 'title=Nugget hybrid demo silent master',
    $SilentOutput
)

& $ffmpeg @renderArgs
if ($LASTEXITCODE -ne 0) {
    throw "Hybrid silent render failed with exit code $LASTEXITCODE"
}

& $ffprobe -v error -show_entries format=duration,size -show_entries stream=index,codec_type,codec_name,width,height,r_frame_rate,pix_fmt -of json -- $SilentOutput
if ($LASTEXITCODE -ne 0) {
    throw "Hybrid silent media verification failed with exit code $LASTEXITCODE"
}

Write-Host "Created $SilentOutput"
