from flask import Flask, request, jsonify
from flask_cors import CORS
from password_analyzer import analyze_password
import os

app = Flask(__name__)

# Allow requests from the React frontend
CORS(app, resources={r"/api/*": {"origins": [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://vault-sight-analyzer-8vqm.vercel.app"
]}})

@app.route('/api/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    pw = data.get('password', '')

    # Zero-persistence: analyze and return immediately, never store
    result = analyze_password(pw)

    # Clear local reference (best-effort)
    pw = None

    return jsonify(result)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)