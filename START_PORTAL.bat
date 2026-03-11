@echo off
title FORTUNA - Investor Portal
color 0A
echo.
echo  ============================================
echo   FORTUNA - PORTAIL INVESTISSEURS
echo  ============================================
echo.
echo  Demarrage du serveur sur http://localhost:3000
echo.
echo  Mot de passe partage  : Fortuna2026!
echo  Admin (Laurent)       : laurent@fortuna.re / Laurent2026!
echo  Admin (Thierry)       : thierry@fortuna.re / Thierry2026!
echo.
echo  Appuyer sur CTRL+C pour arreter le serveur
echo.
cd /d "%~dp0"
start http://localhost:3000
node server.js
pause
