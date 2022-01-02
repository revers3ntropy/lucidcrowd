# flask run __host=0.0.0.0
from connectmysql import cursor

from flask import Flask, request, jsonify

app = Flask(__name__)


@app.route("/login", methods=['POST'])
def login():
    body = request.get_json(force=True)

    if not body['username']:
        return jsonify({'error': 'No username specified'})
    if not body['password']:
        return jsonify({'error': 'No password specified'})

    cursor.excecute(
        "SELECT id FROM users WHERE username=(%s) AND password = SHA2(CONCAT((%s), ':SALT:', salt), 256)",
        (body['username'], body['password'])
    )

    res = cursor.fetchall()

    if len(res) != 1:
        return jsonify({'error': 'Account not found'})

    print(res)

    return jsonify({
        'error': None,
        'id': res[0]['id']
    })


@app.route("/create_account", methods=['POST'])
def create_account():
    return f""


@app.route("/delete_account", methods=['POST'])
def delete_account():
    return f""


@app.route("/create_dataset", methods=['POST'])
def create_dataset():
    return f""


@app.route("/delete_dataset", methods=['POST'])
def delete_dataset():
    return f""


@app.route("/create_datapoint", methods=['POST'])
def create_datapoint():
    return f""


@app.route("/delete_datapoint", methods=['POST'])
def delete_datapoint():
    return f""

@app.route("/create_label", methods=['POST'])
def create_label():
    return f""


@app.route("/delete_label", methods=['POST'])
def delete_label():
    return f""


@app.route("/reputation_user", methods=['POST'])
def reputation_user():
    return f""


@app.route("/reputation_dataset", methods=['POST'])
def reputation_dataset():
    return f""


@app.route("/reputation_datapoint", methods=['POST'])
def reputation_datapoint():
    return f""


@app.route("/public_info_user", methods=['POST'])
def public_info_user():
    return f""


@app.route("/public_info_dataset", methods=['POST'])
def public_info_dataset():
    return f""


@app.route("/public_info_datapoint", methods=['POST'])
def public_info_datapoint():
    return f""


@app.route("/public_info_label", methods=['POST'])
def public_info_label():
    return f""


@app.route("/download_labeled_data", methods=['POST'])
def download_labeled_data():
    return f""


@app.route("/upload_data", methods=['POST'])
def upload():
    return f""


if __name__ == '__main__':
    context = ('local.crt', 'local.key')
    app.run(
        debug=False,
        ssl_context=(),
        host="77.72.5.9",
        port=
    )
