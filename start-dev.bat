@echo off
title MoneyPay Gateway Dev Server (0.0.0.0:3000)
echo ===================================================
echo   MoneyPay Gateway Dev Server (Hot-Reloading)
echo ===================================================
echo.
echo Starting Development Server on 0.0.0.0:3000...
echo.
echo - Local Desktop Access: http://localhost:3000
echo - Network / Mobile Access: http://192.168.29.248:3000
echo.
npx next dev -H 0.0.0.0 -p 3000
pause
