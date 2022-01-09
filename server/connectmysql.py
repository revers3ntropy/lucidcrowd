from dotenv import load_dotenv
from pathlib import Path

import mysql.connector
import os

load_dotenv(dotenv_path=Path('./.env'))


DB_USER = os.getenv('DB_USER')
DB_HOST = os.getenv('DB_HOST')
DB_NAME = os.getenv('DB_DATABASE')
DB_PASSWORD = os.getenv('DB_PASSWORD')

mydb = mysql.connector.connect(
    host=DB_HOST,
    user=DB_USER,
    password=DB_PASSWORD,
    database=DB_NAME
)

cursor = mydb.cursor()
