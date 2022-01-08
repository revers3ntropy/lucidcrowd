# gunicorn --reload --keyfile ./privatekey.pem --certfile ./cert.pem -b 0.0.0.0:56786 app:app
import os

from connectmysql import get_cursor
from flask import Flask, request
import utils as u
from dotenv import load_dotenv
from pathlib import Path

# CONSTANTS
# this value gets replaced when built
PORT = 56786
STAGING = str(PORT)[-1] == '7'

USERNAME_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_ '

load_dotenv(dotenv_path=Path('./.env'))

DB_USER = os.getenv('DB_USER')
DB_HOST = os.getenv('DB_HOST')
DB_NAME = os.getenv('DB_DATABASE')
DB_PASSWORD = os.getenv('DB_PASSWORD')
ID_MAX = os.getenv('SEC_IDMAX')
SALT_LENGTH = os.getenv('SEC_SALTLENGTH')
SALT_CHARS = os.getenv('SEC_SALTCHARS')

cursor, db = get_cursor(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)

app = Flask(__name__)

app.config['DEBUG'] = STAGING

# ROUTES


@app.route("/", methods=['GET', 'POST'])
def home():
    return u.wrap_cors_header({'ok': True})


@app.route("/all-users", methods=['POST', 'GET'])
def all_users():
    cursor.execute("SELECT username, UNIX_TIMESTMP(created) FROM users")

    res = u.res_as_dict(cursor, 'username,created')

    return u.wrap_cors_header(res)


@app.route("/create-account", methods=['POST'])
def create_account():
    body, valid = u.get_body(request, 'username,password')
    if not valid:
        return u.wrap_cors_header(body)

    username = body['username']

    # clean username
    for char in username:
        if char not in USERNAME_CHARS:
            username = username.replace(char, '')

    cursor.execute("SELECT UUID_SORT(), UUID_SHORT()")
    uuid, sess_id = cursor.fetchone()

    cursor.execute("""
        INSERT INTO sessions
        (id, userid)
        VALUES (%s, %s)
    """, (uuid, sess_id))

    salt = u.geb_salt(SALT_CHARS, SALT_LENGTH)

    cursor.execute("""
        INSERT INTO users
         (id,   username,         password,               salt) VALUES 
         (%s,   %s,               MD5(CONCAT(%s, %s)),    %s)
    """, (uuid, body['username'], salt, body['password'], salt))

    db.commit()

    return u.wrap_cors_header({
        'session-id': sess_id,
        'username': username
    })


@app.route("/open-session", methods=['POST'])
def open_session():
    body, valid = u.get_body(request, 'username,password')
    if not valid:
        return u.wrap_cors_header(body)

    cursor.excecute("""
        SELECT id 
        FROM users 
        WHERE 
        username=(%s) 
            AND password = SHA2(CONCAT(salt, %s)), 256 
        """, (body['username'], body['password'])
    )

    user_id = cursor.fetchone()[0]

    if not user_id:
        return u.wrap_cors_header({
            'valid': False,
            'session-id': 0,
            'error': 'Invalid Login'
        })

    cursor.execute("SELECT UUID_SHORT()")

    sess_id = cursor.fetchone()[0]

    if not sess_id:
        print(f'INVALID SESSION ID GENERATED: {sess_id}')
        return u.wrap_cors_header({
            'valid': False,
            'session-id': 0,
            'error': 'Session could not be generated. This error has been logged.'
        })

    cursor.execute("""
        INSERT INTO sessions
        (id, userid)
        VALUES (%s, %s)
    """, (user_id, sess_id))

    db.commit();

    return u.wrap_cors_header({
        'valid': True,
        'session-id': sess_id
    })


@app.route('/public-info', methods=['POST'])
def method_name():
    body, valid = u.get_body(request, 'username')
    if not valid:
        return u.wrap_cors_header(body)

    cursor.execute("""
        SELECT 
            username, 
            id
            COUNT (
                SELECT * 
                FROM labels 
                WHERE labels.userid = users.id
            ) as labelcount
        FROM 
            users, labels
        WHERE
            users.username = %s
    """, ( body['username'], ))

    res = u.res_as_dict(cursor, 'username,id,labelcount')


@app.route("/valid-session", methods=['POST'])
def valid_session():
    body, valid = u.get_body(request, 'session-id')
    if not valid:
        return u.wrap_cors_header(body)

    cursor.execute(
        """
            SELECT ((UNIX_TIMESTAMP(created) + expires) - UNIX_TIMESTAMP(CURRENT_TIMESTAMP))
            FROM sessions
            WHERE id = (%s)
        """,
        (body['session-id'],)
    )

    res = cursor.fetchall()

    if not res:
        return u.wrap_cors_header({
            'valid': False,
            'remaining': 0
        })

    return u.wrap_cors_header({
        'valid': len(res) > 0 and res[0][0] > 0,
        'remaining': res[0][0]
    })


if __name__ == '__main__':
    app.run(
        debug=STAGING,
        ssl_context=('cert.pem', 'privatekey.pem'),
        host="0.0.0.0",
        port=PORT
    )
