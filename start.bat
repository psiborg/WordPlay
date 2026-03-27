@echo off
echo Starting WordPlay...
start "" http://localhost:8084
python -m http.server 8084
