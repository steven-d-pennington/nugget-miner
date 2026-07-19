param(
    [string]$SilentVideo = (Join-Path (Split-Path $PSScriptRoot -Parent) 'demo-video-final\nugget-demo-activation-silent.mp4'),
    [string]$NarrationDirectory = (Join-Path (Split-Path $PSScriptRoot -Parent) 'demo-video-final\activation-narration'),
    [string]$Captions = (Join-Path (Split-Path $PSScriptRoot -Parent) 'demo-video-final\nugget-demo-activation-voiceover.srt'),
    [string]$Output = (Join-Path (Split-Path $PSScriptRoot -Parent) 'demo-video-final\nugget-demo-activation-narrated.mp4'),
    [string]$FfmpegDirectory = 'C:\Users\Steven Pennington\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin'
)

$ErrorActionPreference = 'Stop'
$ffmpeg = Join-Path $FfmpegDirectory 'ffmpeg.exe'
$ffprobe = Join-Path $FfmpegDirectory 'ffprobe.exe'
$manifestPath = Join-Path $NarrationDirectory 'manifest.json'

foreach ($file in @($ffmpeg, $ffprobe, $SilentVideo, $Captions, $manifestPath)) {
    if (-not (Test-Path -LiteralPath $file)) { throw "Required file is missing: $file" }
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$inputs = @('-y', '-i', $SilentVideo)
$filters = @()
$audioLabels = @()
$totalDuration = 171.2

function Convert-ToFfmpegNumber {
    param([double]$Value)
    return $Value.ToString('0.###', [Globalization.CultureInfo]::InvariantCulture)
}

for ($index = 0; $index -lt $manifest.cues.Count; $index += 1) {
    $cue = $manifest.cues[$index]
    $file = Join-Path $NarrationDirectory $cue.filename
    if (-not (Test-Path -LiteralPath $file)) { throw "Narration cue is missing: $file" }
    $inputs += @('-i', $file)

    $durationText = & $ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 -- $file
    if ($LASTEXITCODE -ne 0) { throw "Could not probe narration cue: $file" }
    $duration = [double]::Parse($durationText.Trim(), [Globalization.CultureInfo]::InvariantCulture)
    $slot = [double]$cue.endSeconds - [double]$cue.startSeconds - 0.12
    $speed = [Math]::Max(1.0, $duration / $slot)
    if ($speed -gt 1.25) {
        throw "Cue $($cue.id) is too long for its beat ($([Math]::Round($speed, 3))x required). Shorten or regenerate it."
    }

    $inputNumber = $index + 1
    $label = "a$($cue.id)"
    $audioLabels += "[$label]"
    $speedFilter = if ($speed -gt 1.001) { "atempo=$(Convert-ToFfmpegNumber $speed)," } else { '' }
    $delay = [Math]::Round(([double]$cue.startSeconds) * 1000)
    $filters += "[$inputNumber`:a]$speedFilter" +
        "atrim=duration=$(Convert-ToFfmpegNumber $slot)," +
        "adelay=$delay`:all=1,apad=whole_dur=$(Convert-ToFfmpegNumber $totalDuration)[$label]"
}

$filters += ($audioLabels -join '') +
    "amix=inputs=$($audioLabels.Count):duration=longest:normalize=0," +
    'loudnorm=I=-16:TP=-1.5:LRA=11[narration]'

$font = 'C\:/Windows/Fonts/arial.ttf'
$videoFilter = "drawtext=fontfile='$font':" +
    "text='AI-GENERATED NARRATION - OPENAI $($manifest.model.ToUpperInvariant())':" +
    "fontcolor=0x6F4600@0.9:fontsize=18:x=w-tw-42:y=h-th-26"

$args = $inputs + @(
    '-i', $Captions,
    '-filter_complex', ($filters -join ';'),
    '-map', '0:v:0', '-map', '[narration]', '-map', "$($manifest.cues.Count + 1):0",
    '-vf', $videoFilter,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-color_range', 'tv',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '1',
    '-c:s', 'mov_text', '-metadata:s:a:0', 'language=eng', '-metadata:s:s:0', 'language=eng',
    '-t', (Convert-ToFfmpegNumber $totalDuration), '-movflags', '+faststart',
    '-metadata', 'title=Nugget capture-to-activation narrated demo',
    $Output
)

& $ffmpeg @args
if ($LASTEXITCODE -ne 0) { throw "Narrated activation render failed with exit code $LASTEXITCODE" }

& $ffprobe -v error -show_entries format=duration,size -show_entries stream=index,codec_type,codec_name,width,height,r_frame_rate,pix_fmt,sample_rate,channels:stream_tags=language -of json -- $Output
if ($LASTEXITCODE -ne 0) { throw "Narrated activation verification failed with exit code $LASTEXITCODE" }

Write-Host "Created $Output"
