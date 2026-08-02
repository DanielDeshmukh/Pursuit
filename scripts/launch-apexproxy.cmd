@echo off
setlocal enabledelayedexpansion

:: Parse arguments
set "INSTANCE=%~1"
set "THEME=%~2"

if "%INSTANCE%"=="" (
    echo Usage: launch-apexproxy.cmd ^<instance^> [theme]
    echo   instance: port number of the 9router instance
    echo   theme:     model name (default: claude-fable-5)
    exit /b 1
)
if "%THEME%"=="" set "THEME=claude-fable-5"

set "PORT=%INSTANCE%"
set "API_KEY=sk-demo-fable-%RANDOM%%RANDOM%"

echo ============================================
echo   ApexProxy Claude Instance
echo ============================================
echo   Port:     %PORT%
echo   Theme:    %THEME%
echo   Proxy:    http://127.0.0.1:%PORT%/v1
echo ============================================
echo.

:: Set environment variables for this session
set ANTHROPIC_BASE_URL=http://127.0.0.1:%PORT%/v1
set ANTHROPIC_AUTH_TOKEN=%API_KEY%
set ANTHROPIC_MODEL=%THEME%

:: Launch Claude Code in its own window
start "ApexProxy-%PORT%" cmd /k "claude --dangerously-skip-permissions --system-prompt-file \"%USERPROFILE%\.claude\CLAUDE-FABLE-5.md\""

echo Claude Code launched in new window (ApexProxy-%PORT%)
echo Proxy: http://127.0.0.1:%PORT%/v1
echo.
exit /b 0