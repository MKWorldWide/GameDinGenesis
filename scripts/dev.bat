@echo off

REM Check if .env.local exists
if not exist .env.local (
    echo Creating .env.local from .env.example
    copy /Y .env.example .env.local >nul
    
    if errorlevel 1 (
        echo Error: Failed to create .env.local
        exit /b 1
    )
    
    echo Please edit .env.local and add your Gemini API key
    echo Then run this script again
    pause
    exit /b 0
)

REM Load environment variables from .env.local
for /f "tokens=*" %%i in (.env.local) do (
    for /f "tokens=1* delims==" %%a in ("%%i") do (
        if not "%%a"=="" if not "%%a"=="#" (
            set "%%a=%%b"
        )
    )
)

REM Check if GEMINI_API_KEY is set
if "%GEMINI_API_KEY%"=="" (
    echo Error: GEMINI_API_KEY is not set in .env.local
    echo Please add your Gemini API key to .env.local
    pause
    exit /b 1
)

echo Starting development server...
call npm run dev
