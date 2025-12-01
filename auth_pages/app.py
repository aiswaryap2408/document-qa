from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
import os
import jwt
import datetime

# Ensure the auth module is importable
from .auth import create_user, authenticate_user, get_user

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'supersecretkey')
JWT_SECRET = os.getenv('JWT_SECRET', 'jwtsecretkey')

# Set the folder for HTML templates (the auth_pages directory)
app.template_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), ''))

@app.route('/')
def index():
    return redirect(url_for('sign_in'))

@app.route('/signin', methods=['GET', 'POST'])
def sign_in():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        if authenticate_user(email, password):
            # Generate JWT token
            token = jwt.encode({
                'email': email,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
            }, JWT_SECRET, algorithm='HS256')
            
            # Redirect to Streamlit app with token
            return redirect(f"http://localhost:8501/?token={token}")
        else:
            flash('Invalid credentials', 'danger')
            return redirect(url_for('sign_in'))
    return render_template('sign_in.html')

@app.route('/signup', methods=['GET', 'POST'])
def sign_up():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        try:
            create_user(email, password)
            flash('Account created! Please sign in.', 'success')
            return redirect(url_for('sign_in'))
        except ValueError as e:
            flash(str(e), 'danger')
            return redirect(url_for('sign_up'))
    return render_template('sign_up.html')

@app.route('/verify_token', methods=['GET'])
def verify_token():
    token = request.args.get('token')
    if not token:
        return jsonify({'valid': False, 'error': 'Missing token'}), 401
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return jsonify({'valid': True, 'email': data['email']})
    except jwt.ExpiredSignatureError:
        return jsonify({'valid': False, 'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'valid': False, 'error': 'Invalid token'}), 401

if __name__ == '__main__':
    # Run on localhost:5000
    app.run(host='0.0.0.0', port=5000, debug=True)
