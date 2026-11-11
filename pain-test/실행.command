#!/bin/bash
cd "$(dirname "$0")"
if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3가 필요합니다. https://www.python.org/downloads/ 에서 설치해주세요."
  read -r -p "Enter를 누르면 닫힙니다."
  exit 1
fi
python3 server.py
