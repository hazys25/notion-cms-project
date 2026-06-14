# ============================================================================
# notify-done.ps1 — "작업 완료" 알림 (Claude Code의 Stop 이벤트)
# ----------------------------------------------------------------------------
# 목적:
#   - Claude Code 메인 에이전트가 응답(작업)을 마쳤을 때 PC 소리 + Slack 메시지로 알린다.
#   - 긴 작업을 맡겨두고 다른 일을 하다가도 완료 시점을 즉시 알 수 있게 한다.
# ============================================================================

# 공통 Slack 전송 함수 로드(선택 사항).
# slack.ps1 은 비밀 Webhook URL을 담고 있어 git에서 제외되므로, 이 파일이 없을 수 있다.
# 없으면 Slack 전송은 건너뛰고 PC 소리 알림만 동작한다.
$slackModule = "$PSScriptRoot\slack.ps1"
if (Test-Path $slackModule) { . $slackModule }

# --- 1) PC 소리 ------------------------------------------------------------
# 완료 느낌의 사운드. PlaySync()로 끝까지 재생 보장.
$soundPath = "C:\Windows\Media\tada.wav"  # 사용할 사운드 파일 경로
if (Test-Path $soundPath) {
    (New-Object Media.SoundPlayer $soundPath).PlaySync()
} else {
    # 파일이 없을 경우 시스템 기본음으로 대체
    [System.Media.SystemSounds]::Asterisk.Play()
    Start-Sleep -Milliseconds 700
}

# --- 2) Slack 메시지 (slack.ps1 이 로드돼 함수가 존재할 때만) ---------------
if (Get-Command Send-SlackMessage -ErrorAction SilentlyContinue) {
    Send-SlackMessage "✅ [Claude Code] 작업이 완료되었습니다."
}
