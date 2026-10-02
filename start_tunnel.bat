@echo off
title MineSafe AI Server & Public Tunnel
echo ===================================================
echo Starting MineSafe AI Local Server & Public Tunnel
echo ===================================================
echo.
echo Local Server: http://localhost:4173/index.html
echo Public Link:  https://minesafe-ai.loca.lt
echo Tunnel Password / IP: 49.205.107.43
echo.
echo Keeping tunnel alive... (Press Ctrl+C to stop)
:loop
npx -y localtunnel --port 4173 --subdomain minesafe-ai
timeout /t 5
echo Reconnecting tunnel...
goto loop
