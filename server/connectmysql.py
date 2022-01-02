import os

import mysql.connector
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path('./.env'))

mydb = mysql.connector.connect(
    host=os.getenv('DB_HOST'),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD'),
    database=os.getenv('DB_DATABASE')
)

cursor = mydb.cursor()
