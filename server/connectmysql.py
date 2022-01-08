import mysql.connector


def get_cursor(host, username, password, db_name):
    mydb = mysql.connector.connect(
        host=host,
        user=username,
        password=password,
        database=db_name
    )

    return mydb.cursor(), mydb
