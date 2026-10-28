@echo off
rem Fait sortir UNE carte SIM du distributeur SK-AD3, sans passer par la borne.
rem Arreter d'abord le serveur de la borne (npm run dev) : il garde le port serie ouvert.
rem Port : SIM_DISPENSER_PORT de frontend\.env.local (sinon COM5). Autre port : ejecter-carte-sim.bat COM4

cd /d "%~dp0..\frontend"
node --experimental-transform-types --no-warnings scripts\ejecter-carte.mts %1
pause
