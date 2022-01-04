from flask import jsonify, Response


def res_as_dict(cursor, columns):
    """
        Gets the current set of rows as a list of dicts,
        rather than a list of lists which is the default
    :param cursor: mysql.connector.connection_cext.CMySQLConnection
    :param columns: list[string]
    :return: list[dict]
    """
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def get_body(request, structure):
    """
        Gets a nicely formatted dict from the body of the request
    :param request: flask.globals.Request
    :param structure: dict
    :return: list[string]
    """
    body = request.get_json(force=True)

    for key in structure:
        if key not in body:
            return f"'{key}' required property of request body"

    return body


def wrap_cors_header(res):
    """
        Wraps a dict response in a 'Access-Control-Allow-Origin: *' header and jsonifies it
    :param res:
    :return:
    """
    resp = jsonify(res)
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp
