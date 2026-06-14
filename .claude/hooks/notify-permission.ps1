# ============================================================================
# notify-permission.ps1 — "권한 요청" 알림 (Claude Code의 Notification 이벤트)
# ----------------------------------------------------------------------------
# 목적:
#   - Claude Code가 권한 승인을 기다리며 멈췄을 때 PC 소리 + Slack 메시지로 알린다.
#   - 화면을 보고 있지 않아도 "내 확인이 필요하다"는 사실을 즉시 인지하기 위함.
# ============================================================================

# 공통 Slack 전송 함수 로드(선택 사항).
# slack.ps1 은 비밀 Webhook URL을 담고 있어 git에서 제외되므로, 이 파일이 없을 수 있다.
# 없으면 Slack 전송은 건너뛰고 PC 소리 알림만 동작한다. ($PSScriptRoot = 이 스크립트가 있는 폴더)
$slackModule = "$PSScriptRoot\slack.ps1"
if (Test-Path $slackModule) { . $slackModule }

# --- 1) PC 소리 ------------------------------------------------------------
# 주의를 환기하는 알림음. PlaySync()는 소리가 끝날 때까지 블로킹 → PowerShell이
# 소리 재생 도중 종료되어 소리가 잘리는 문제를 방지한다.
$soundPath = "C:\Windows\Media\Windows Notify System Generic.wav"  # 사용할 사운드 파일 경로
if (Test-Path $soundPath) {
    (New-Object Media.SoundPlayer $soundPath).PlaySync()
} else {
    # 파일이 없을 경우 시스템 기본 경고음으로 대체(항상 동작 보장)
    [System.Media.SystemSounds]::Exclamation.Play()
    Start-Sleep -Milliseconds 700  # 비동기 재생이 끝나기 전 종료되지 않도록 잠시 대기
}

# --- 2) Slack 메시지 (slack.ps1 이 로드돼 함수가 존재할 때만) ---------------
if (Get-Command Send-SlackMessage -ErrorAction SilentlyContinue) {
    Send-SlackMessage "🔔 [Claude Code] 권한 요청 대기 중 — 확인이 필요합니다."
}
