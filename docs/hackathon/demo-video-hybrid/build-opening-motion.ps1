param(
    [string]$Source = (Join-Path (Split-Path $PSScriptRoot -Parent) 'demo-video-final\nugget-opening-starting-frame-v1.png'),
    [string]$Output = (Join-Path (Split-Path $PSScriptRoot -Parent) 'demo-video-final\nugget-opening-motion-v1.mp4'),
    [string]$ContactSheetOutput = (Join-Path (Split-Path $PSScriptRoot -Parent) 'demo-video-final\nugget-opening-motion-v1-contact-sheet.jpg'),
    [string]$FfmpegDirectory = 'C:\Users\Steven Pennington\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin'
)

$ErrorActionPreference = 'Stop'

$ffmpeg = Join-Path $FfmpegDirectory 'ffmpeg.exe'
$ffprobe = Join-Path $FfmpegDirectory 'ffprobe.exe'

foreach ($file in @($ffmpeg, $ffprobe, $Source)) {
    if (-not (Test-Path -LiteralPath $file)) { throw "Required file is missing: $file" }
}

# Keep the generated artwork completely fixed. One soft amber pulse supplies
# the motion and can later be timed against narration or an editorial title.
$filter = "[0:v]scale=1920:1076:flags=lanczos," +
    "pad=1920:1080:0:2:color=0xF7F2EA,format=yuv420p[base];" +
    "nullsrc=s=220x220:r=30:d=5,format=rgba," +
    "geq=r='255':g='198':b='62':" +
    "a='82*exp(-(pow(X-110,2)+pow(Y-110,2))/(2*pow(42,2)))'[glow];" +
    "[base][glow]overlay=" +
    "x='-220+(W+440)*min(max((t-0.5)/3.9,0),1)':" +
    "y=434:enable='between(t,0.5,4.4)',format=yuv420p[out]"

& $ffmpeg -y -loglevel error -loop 1 -t 5 -i $Source `
    -filter_complex $filter -map '[out]' -an -t 5 `
    -c:v libx264 -preset medium -crf 18 -r 30 -pix_fmt yuv420p `
    -color_range tv -movflags +faststart `
    -metadata 'title=Nugget opening motion master' $Output
if ($LASTEXITCODE -ne 0) { throw "Opening motion render failed with exit code $LASTEXITCODE" }

& $ffmpeg -y -loglevel error -i $Output `
    -vf 'fps=1,scale=480:270:flags=lanczos,tile=5x1:padding=8:margin=8:color=0xF7F2EA' `
    -frames:v 1 -q:v 2 $ContactSheetOutput
if ($LASTEXITCODE -ne 0) { throw "Opening contact sheet failed with exit code $LASTEXITCODE" }

& $ffprobe -v error `
    -show_entries 'format=duration,size:stream=codec_name,width,height,r_frame_rate,pix_fmt' `
    -of json $Output
if ($LASTEXITCODE -ne 0) { throw "Opening motion verification failed with exit code $LASTEXITCODE" }

Write-Host "Created $Output"
Write-Host "Created $ContactSheetOutput"
