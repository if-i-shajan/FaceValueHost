@echo off
cd backend-ai
call venv\Scripts\activate.bat
pip install -q -r requirements_simple.txt
python main_simple.py
