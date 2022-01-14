# gunicorn --reload --keyfile ./privatekey.pem --certfile ./cert.pem -b 0.0.0.0:56786 app:app
import os

from connectmysql import cursor, mydb as db
from flask import Flask, request
import utils as u

# CONSTANTS
# this value gets replaced when built
PORT = 56786
STAGING = str(PORT)[-1] == '7'

USERNAME_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_ '

app = Flask(__name__)

app.config['DEBUG'] = STAGING

SALT_LENGTH = int(os.getenv('SEC_SALTLENGTH'))
SALT_CHARS = os.getenv('SEC_SALTCHARS')


# ROUTES


@app.route("/", methods=['GET', 'POST'])
def home():
    return u.wrap_cors_header({'ok': True})


@app.route("/all-users", methods=['POST', 'GET'])
def all_users():
    cursor.execute("SELECT username, UNIX_TIMESTMP(created) FROM users")

    res = u.res_as_dict('username,created')

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

    cursor.execute("""
        SELECT username FROM users WHERE username = %s
    """, (username,))

    if len(cursor.fetchall()):
        return u.wrap_cors_header({
            'error': 'Username already exists'
        })

    cursor.execute("SELECT UUID(), UUID()")
    uuid, sess_id = cursor.fetchall()[0]

    cursor.execute("""
        INSERT INTO sessions
        (id, userid)
        VALUES (%s, %s)
    """, (sess_id, uuid))

    salt = u.gen_salt(SALT_CHARS, SALT_LENGTH)

    cursor.execute("""
        INSERT INTO users
         (id,   username,         password,               salt) VALUES 
         (%s,   %s,               SHA2(CONCAT(%s, %s), 256), %s)
    """, (uuid, body['username'], salt, body['password'], salt))

    db.commit()

    return u.wrap_cors_header({
        'session-id': sess_id
    })


@app.route("/open-session", methods=['POST'])
def open_session():
    body, valid = u.get_body(request, 'username,password')
    if not valid:
        return u.wrap_cors_header(body)

    cursor.execute("""
        SELECT id 
        FROM users 
        WHERE 
            username=(%s) 
            AND password = SHA2(CONCAT(salt, %s), 256)
        """, (body['username'], body['password'])
                    )

    user_id = cursor.fetchone()

    if not user_id or not user_id[0]:
        return u.wrap_cors_header({
            'valid': False,
            'error': 'Invalid Login'
        })

    cursor.execute("SELECT UUID()")

    sess_id = cursor.fetchone()[0]

    if not sess_id:
        u.log(f'INVALID SESSION ID GENERATED: {sess_id}')
        return u.wrap_cors_header({
            'valid': False,
            'error': 'Session could not be generated. This error has been logged.'
        })

    cursor.execute("""
        INSERT INTO sessions
        (id, userid)
        VALUES (%s, %s)
    """, (sess_id, user_id[0]))

    db.commit()

    return u.wrap_cors_header({
        'valid': True,
        'session-id': sess_id
    })


@app.route('/public-info', methods=['POST'])
def public_info():
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
    """, (body['username'],))

    res = u.res_as_dict('username,id,labelcount')

    return u.wrap_cors_header({
        'username': res['username'],
        'label-count': res['labelcount']
    })


@app.route('/private-info', methods=['POST'])
def private_info():
    body, valid = u.get_body(request, 'session-id')
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
    """, (body['username'],))

    res = u.res_as_dict('username,id,labelcount')

    return u.wrap_cors_header({
        'username': res['username'],
        'label-count': res['labelcount']
    })


@app.route('/leaderboard', methods=['POST'])
def leaderboard():
    body, valid = u.get_body(request, 'options,session')
    if not valid:
        return u.wrap_cors_header(body)

    cursor.execute("""
        SELECT 
            username,
            COUNT (
                SELECT * 
                FROM labels 
                WHERE labels.userid = users.id
            ) as labelcount
        FROM 
            users, labels
        WHERE
            users.username = %s
    """, (body['username'],))

    res = u.res_as_dict('username,id,labelcount')

    return u.wrap_cors_header({
        'username': res['username'],
        'label-count': res['labelcount']
    })


@app.route("/valid-session", methods=['POST'])
def valid_session():
    body, valid = u.get_body(request, 'session-id')
    if not valid:
        return u.wrap_cors_header(body)

    valid, _, remaining = u.valid_session(body['session-id'])

    return u.wrap_cors_header({
        'valid': valid,
        'remaining': remaining
    })


@app.route("/invalidate-session", methods=['POST'])
def invalidate_session():
    body, valid = u.get_body(request, 'session-id')
    if not valid:
        return u.wrap_cors_header(body)

    valid, _, _ = u.valid_session(body['session-id'])

    if not valid:
        u.log('invalid session to invalidate')
        return u.wrap_cors_header({
            'completed': False
        })

    cursor.execute("""
        UPDATE sessions SET valid = 0 WHERE id = %s
    """, (body['session-id'], ))

    db.commit()

    return u.wrap_cors_header({
        'completed': True
    })


@app.route('/delete-account', methods=['POST'])
def delete_account():
    body, valid = u.get_body(request, 'session-id')
    if not valid:
        return u.wrap_cors_header(body)

    valid_sess, userid, _ = u.valid_session(body['session-id'])

    if not valid_sess:
        return u.wrap_cors_header({
            'completed': False,
            'error': 'invalid session'
        })

    cursor.execute('SELECT userid FROM sessions WHERE id = %s ', (body['session-id'],))

    userid, = cursor.fetchone()

    cursor.execute("DELETE FROM users WHERE id = %s", (userid,))
    cursor.execute("DELETE FROM sessions WHERE userid = %s", (userid,))

    db.commit()

    return u.wrap_cors_header({
        'completed': True
    })


if __name__ == '__main__':
    app.run(
        debug=STAGING,
        ssl_context=('cert.pem', 'privatekey.pem'),
        host="0.0.0.0",
        port=PORT
    )
