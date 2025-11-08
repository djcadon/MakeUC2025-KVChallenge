"""
config.py
"""
# STANDARD IMPORTS
from dotenv import load_dotenv
import os

load_dotenv()

class Settings:
    ENV = os.getenv("ENV")
    KV_API_TOKEN = os.getenv("KV_API_TOKEN")

settings = Settings()