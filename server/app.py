# flask run --host=0.0.0.0

from flask import Flask

app = Flask(__name__)


@app.route("/", methods=['POST'])
def hello_world():
    return "<p>Hello, World!</p>"
