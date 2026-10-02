@echo off
title AI Resume Analyzer
cd /d "%~dp0final-app"

echo Starting AI Resume Analyzer...
echo Make sure PostgreSQL is running before continuing.
echo.

if not exist "node_modules" (
    echo Installing dependencies for the first time, please wait...
    call npm install
)

start "" http://localhost:3000
call npm start

pause
