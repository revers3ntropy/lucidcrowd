# gunicorn --reload --keyfile ./privatekey.pem --certfile ./cert.pem -b 0.0.0.0:56786 app:app
from connectmysql import cursor
from flask import Flask, request
import utils as u

app = Flask(__name__)


@app.route("/", methods=['GET', 'POST'])
def home():
    return u.wrap_cors_header({'ok': True, 'data': 'hi'})


@app.route("/all-users", methods=['POST', 'GET'])
def all_users():
    cursor.execute("SELECT username, UNIX_TIMESTMP(created) FROM users")

    res = u.res_as_dict(cursor, 'username,created')

    return u.wrap_cors_header(res)


@app.route("/open-session", methods=['POST'])
def open_session():
    body = u.get_body(request, 'username,password')

    cursor.excecute(
        "SELECT id FROM users WHERE username=(%s) AND password = SHA2(CONCAT((%s), ':SALT:', salt), 256)",
        (body['username'], body['password'])
    )

    res = cursor.fetchall()

    if not res:
        return u.wrap_cors_header({
            'valid': False,
            'session-id': 0
        })

    return u.wrap_cors_header({
        'valid': len(res) > 0 and res[0][0] > 0,
        'remaining': res[0][0]
    })


@app.route("/valid-session", methods=['POST'])
def valid_session():
    body = u.get_body(request, 'session-id')

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
        debug=False,
        ssl_context=('cert.pem', 'privatekey.pem'),
        host="0.0.0.0",
        port=56786
    )
