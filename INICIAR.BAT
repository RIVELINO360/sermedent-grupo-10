@echo off
echo Iniciando SERMEDENT...
cd /d %~dp0
start cmd /k nodemon server.js
start login.html