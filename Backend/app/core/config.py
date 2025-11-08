"""
config.py
"""
# STANDARD IMPORTS
from dotenv import load_dotenv
import os

load_dotenv()

class Settings:
    ENV = os.getenv("ENV")

settings = Settings()