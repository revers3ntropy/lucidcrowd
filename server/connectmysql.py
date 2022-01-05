import os

import mysql.connector
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path('./.env'))


def get_cursor(host, username, password, db_name):
    mydb = mysql.connector.connect(
        host=host,
        user=username,
        password=password,
        database=db_name
    )

    return mydb.cursor()
