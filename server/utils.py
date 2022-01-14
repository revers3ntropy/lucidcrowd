import random
import logging
from os.path import exists

from connectmysql import cursor

from flask import jsonify

if exists('log.txt'):
    logger = logging.getLogger()
    handler = logging.FileHandler('log.txt')
    logger.addHandler(handler)

    def log(msg, lvl=1):
        logger.log(lvl, msg)

else:
    log = print


def res_as_dict(columns):
    """
        Gets the current set of rows as a list of dicts,
        rather than a list of lists which is the default
    :param columns: list[string]
    :return: list[dict]
    """
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def get_body(request, structure):
    """
        Gets a nicely formatted dict from the body of the request
    :param request: flask.globals.Request
    :param structure: dict
    :return: string
    """
    body = request.get_json(force=True)

    for key in structure.split(','):
        if key not in body:
            return {'error': f"'{key}' required property of request body"}, False

    return body, True


def wrap_cors_header(res):
    """
        Wraps a dict response in a 'Access-Control-Allow-Origin: *' header and jsonifies it
    :param res:
    :return:
    """
    resp = jsonify(res)
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp


def gen_salt(chars, length):
    result = 'LCsalt-'

    while len(result) < length:
        result += random.choice(chars)

    return result


def valid_session(session):
    """
    :param session:
    :return: (valid: bool, userid: string, session_time_remaining: int)
    """
    cursor.execute(
        """
            SELECT 
                (
                    (UNIX_TIMESTAMP(sessions.created) + sessions.expires) - 
                    UNIX_TIMESTAMP(CURRENT_TIMESTAMP)
                ),
                users.id,
                sessions.valid
            FROM sessions, users
            WHERE 
                sessions.id = (%s) AND
                users.id = sessions.userid
        """,
        (session,)
    )

    res = cursor.fetchall()

    if not res or not len(res) > 0 or not len(res[0][1]) > 0 or not res[0][2]:
        return False, 0, 0

    return True, str(res[0][1]), int(res[0][0])


def reputation_user():
    return 0


def reputation_label():
    return 0


def reputation_dataset():
    return 0


def reputation_datapoint():
    return 0