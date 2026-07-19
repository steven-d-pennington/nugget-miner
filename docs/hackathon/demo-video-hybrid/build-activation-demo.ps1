param(
    [string]$RecordingSource = (Join-Path $env:USERPROFILE 'Downloads\ScreenRecording_07-18-2026 02-35-48_1.MP4'),
    [double]$RecordingStart = 38,
    [double]$RecordingDuration = 13,
    [string]$BrowserSource = (Join-Path $PSScriptRoot 'browser-walkthrough.webm'),
    [string]$BrowserTimeline = (Join-Path $PSScriptRoot 'browser-walkthrough-timeline.json'),
    [string]$Output = '',
    [string]$ContactSheetOutput = '',
    [string]$CaptureDirectory = (Join-Path $env:USERPROFILE 'Downloads'),
    [string]$FfmpegDirectory = 'C:\Users\Steven Pennington\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin'
)

$ErrorActionPreference = 'Stop'

$ffmpeg = Join-Path $FfmpegDirectory 'ffmpeg.exe'
$ffprobe = Join-Path $FfmpegDirectory 'ffprobe.exe'
$hackathonDirectory = Split-Path $PSScriptRoot -Parent
$finalDirectory = Join-Path $hackathonDirectory 'demo-video-final'
if (-not $Output) {
    $Output = Join-Path $finalDirectory 'nugget-demo-activation-silent.mp4'
}
if (-not $ContactSheetOutput) {
    $ContactSheetOutput = Join-Path $finalDirectory 'nugget-demo-activation-contact-sheet.png'
}

$capture0110 = Join-Path $CaptureDirectory 'ScreenRecording_07-18-2026 01-10-58_1.MP4'
$capture0235 = Join-Path $CaptureDirectory 'ScreenRecording_07-18-2026 02-35-48_1.MP4'
$capture0238 = Join-Path $CaptureDirectory 'ScreenRecording_07-18-2026 02-38-45_1.MP4'

foreach ($file in @($ffmpeg, $ffprobe, $capture0110, $capture0235, $capture0238, $RecordingSource, $BrowserSource, $BrowserTimeline)) {
    if (-not (Test-Path -LiteralPath $file)) {
        throw "Required file is missing: $file"
    }
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
    return [pscustomobject]@{
        Start = [double]$matches[0].startSeconds
        Duration = [double]$matches[0].endSeconds - [double]$matches[0].startSeconds
    }
}

function Get-PortraitFilter {
    param(
        [int]$Index,
        [string]$OutputLabel,
        [double]$InputDuration,
        [double]$OutputDuration,
        [ValidateSet('trim', 'hold', 'stretch')]
        [string]$Timing = 'trim'
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
        default { "trim=duration=$output" }
    }

    return "[$Index`:v]fps=30,scale=-2:1000:flags=lanczos,setsar=1,trim=duration=$input,setpts=PTS-STARTPTS,$timingFilter[fg$Index];" +
        "color=c=0xF7F2EA:s=1920x1080:r=30:d=$output[bg$Index];" +
        "[bg$Index]drawbox=x=737:y=48:w=462:h=1000:color=black@0.12:t=fill," +
        "drawbox=x=728:y=39:w=464:h=1002:color=0xD8CBB7@0.9:t=2[base$Index];" +
        "[base$Index][fg$Index]overlay=(W-w)/2:(H-h)/2:shortest=1,format=yuv420p,setpts=PTS-STARTPTS[$OutputLabel]"
}

function Get-PushInFilter {
    param([string]$InputLabel, [string]$OutputLabel, [double]$Duration, [double]$MaximumZoom = 1.05)
    $frames = Convert-ToFfmpegNumber ($Duration * 30)
    $zoom = Convert-ToFfmpegNumber $MaximumZoom
    $delta = Convert-ToFfmpegNumber ($MaximumZoom - 1)
    return "[$InputLabel]zoompan=z='min(1+$delta*on/$frames,$zoom)':" +
        "x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30," +
        "format=yuv420p[$OutputLabel]"
}

$ideas = Get-Chapter 'ideas-cards'
$detail = Get-Chapter 'idea-detail'
$intents = Get-Chapter 'activation-intents'
$consent = Get-Chapter 'activation-consent'
$processing = Get-Chapter 'activation-processing'
$brief = Get-Chapter 'activation-brief'
$settings = Get-Chapter 'settings'
$close = Get-Chapter 'close'
$activationStart = $intents.Start
$activationEnd = $consent.Start + $consent.Duration
$activationDuration = $activationEnd - $activationStart

$filters = @(
    (Get-PortraitFilter -Index 0 -OutputLabel 'v0' -InputDuration 16 -OutputDuration 16),
    (Get-PortraitFilter -Index 1 -OutputLabel 'v1raw' -InputDuration $RecordingDuration -OutputDuration $RecordingDuration),
    (Get-PushInFilter -InputLabel 'v1raw' -OutputLabel 'v1' -Duration $RecordingDuration),
    (Get-PortraitFilter -Index 2 -OutputLabel 'v2' -InputDuration 20 -OutputDuration 20),
    (Get-PortraitFilter -Index 3 -OutputLabel 'v3' -InputDuration 13 -OutputDuration 13),
    (Get-PortraitFilter -Index 4 -OutputLabel 'v4' -InputDuration 16 -OutputDuration 16),
    (Get-PortraitFilter -Index 5 -OutputLabel 'v5' -InputDuration $ideas.Duration -OutputDuration 12 -Timing 'hold'),
    (Get-PortraitFilter -Index 6 -OutputLabel 'v6raw' -InputDuration $detail.Duration -OutputDuration 17 -Timing 'stretch'),
    (Get-PushInFilter -InputLabel 'v6raw' -OutputLabel 'v6' -Duration 17),
    ("color=c=0xF7F2EA:s=1920x1080:r=30:d=8," +
        "drawbox=x=260:y=210:w=1400:h=660:color=0xFFF9EF:t=fill," +
        "drawbox=x=260:y=210:w=1400:h=660:color=0xE5A11A:t=3," +
        "drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='ACTUAL NUGGET CAPTURE  -  JULY 19, 2026':fontcolor=0xA56B00:fontsize=28:x=(w-tw)/2:y=300," +
        "drawtext=fontfile='C\:/Windows/Fonts/georgia.ttf':text='Export Nugget ideas as':fontcolor=0x101D36:fontsize=66:x=(w-tw)/2:y=405," +
        "drawtext=fontfile='C\:/Windows/Fonts/georgiab.ttf':text='AI-ready prompts':fontcolor=0x101D36:fontsize=72:x=(w-tw)/2:y=490," +
        "drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='That captured thought became this shipped feature.':fontcolor=0x615A50:fontsize=32:x=(w-tw)/2:y=635,format=yuv420p[v7]"),
    (Get-PortraitFilter -Index 7 -OutputLabel 'v8' -InputDuration $activationDuration -OutputDuration 14 -Timing 'stretch'),
    (Get-PortraitFilter -Index 8 -OutputLabel 'v9' -InputDuration 4 -OutputDuration 4),
    (Get-PortraitFilter -Index 9 -OutputLabel 'v10raw' -InputDuration $brief.Duration -OutputDuration 24 -Timing 'stretch'),
    (Get-PushInFilter -InputLabel 'v10raw' -OutputLabel 'v10' -Duration 24),
    (Get-PortraitFilter -Index 10 -OutputLabel 'v11' -InputDuration $settings.Duration -OutputDuration 9 -Timing 'hold'),
    (Get-PortraitFilter -Index 11 -OutputLabel 'v12' -InputDuration $close.Duration -OutputDuration 5.5 -Timing 'trim'),
    ('[v0][v1][v2][v3][v4][v5][v6][v7][v8][v9][v10][v11][v12]concat=n=13:v=1:a=0,' +
        'trim=duration=171.5,scale=in_range=auto:out_range=tv,format=yuv420p[outv]')
)

$renderArgs = @(
    '-y',
    '-ss', '24', '-t', '16', '-i', $capture0110,
    '-ss', (Convert-ToFfmpegNumber $RecordingStart), '-t', (Convert-ToFfmpegNumber $RecordingDuration), '-i', $RecordingSource,
    '-ss', '62', '-t', '20', '-i', $capture0238,
    '-ss', '140.5', '-t', '13', '-i', $capture0235,
    '-ss', '104', '-t', '16', '-i', $capture0238,
    '-ss', (Convert-ToFfmpegNumber $ideas.Start), '-t', (Convert-ToFfmpegNumber $ideas.Duration), '-i', $BrowserSource,
    '-ss', (Convert-ToFfmpegNumber $detail.Start), '-t', (Convert-ToFfmpegNumber $detail.Duration), '-i', $BrowserSource,
    '-ss', (Convert-ToFfmpegNumber $activationStart), '-t', (Convert-ToFfmpegNumber $activationDuration), '-i', $BrowserSource,
    '-ss', (Convert-ToFfmpegNumber $processing.Start), '-t', '4', '-i', $BrowserSource,
    '-ss', (Convert-ToFfmpegNumber $brief.Start), '-t', (Convert-ToFfmpegNumber $brief.Duration), '-i', $BrowserSource,
    '-ss', (Convert-ToFfmpegNumber $settings.Start), '-t', (Convert-ToFfmpegNumber $settings.Duration), '-i', $BrowserSource,
    '-ss', (Convert-ToFfmpegNumber $close.Start), '-t', (Convert-ToFfmpegNumber $close.Duration), '-i', $BrowserSource,
    '-filter_complex', ($filters -join ';'),
    '-map', '[outv]', '-an',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-r', '30',
    '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-movflags', '+faststart',
    '-metadata', 'title=Nugget capture-to-activation demo silent master',
    $Output
)

if ($env:NUGGET_DEMO_DEBUG_FILTER -eq '1') {
    Write-Host ($filters -join ';')
    exit 0
}

& $ffmpeg @renderArgs
if ($LASTEXITCODE -ne 0) {
    throw "Activation demo render failed with exit code $LASTEXITCODE"
}

& $ffmpeg -y -loglevel error -i $Output -vf 'fps=1/15,scale=640:360:flags=lanczos,tile=3x4:padding=8:margin=8:color=0xF7F2EA' -frames:v 1 $ContactSheetOutput
if ($LASTEXITCODE -ne 0) {
    throw "Activation contact sheet generation failed with exit code $LASTEXITCODE"
}

& $ffprobe -v error -show_entries format=duration,size -show_entries stream=index,codec_type,codec_name,width,height,r_frame_rate,pix_fmt -of json -- $Output
if ($LASTEXITCODE -ne 0) {
    throw "Activation demo verification failed with exit code $LASTEXITCODE"
}

Write-Host "Created $Output"
Write-Host "Created $ContactSheetOutput"
