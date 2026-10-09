@echo off
title MoneyPay Gateway Host Server (0.0.0.0:3000)
echo ===================================================
echo   MoneyPay Direct Deposit & PayIn Gateway Server
echo ===================================================
echo.
echo Starting Production Server on 0.0.0.0:3000...
echo.
echo - Local Desktop Access: http://localhost:3000
echo - Network / Mobile Access: http://192.168.29.248:3000
echo.
echo Press Ctrl+C to stop the server at any time.
echo ===================================================
echo.

npm run build && npx next start -H 0.0.0.0 -p 3000
pause
