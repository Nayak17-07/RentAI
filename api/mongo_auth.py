import os
import jwt
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / 'server' / '.env'
if env_path.exists():
    load_dotenv(env_path)

SECRET_KEY = os.getenv('SECRET_KEY', 'rentora-secret-key-high-performance-jwt-token-984210a')

def generate_tokens(user_id):
    """
    Generates standard JWT access and refresh tokens for test and script utilities.
    """
    now = datetime.utcnow()
    access_payload = {
        'user_id': str(user_id),
        'exp': now + timedelta(minutes=60),
        'iat': now
    }
    refresh_payload = {
        'user_id': str(user_id),
        'exp': now + timedelta(days=1),
        'iat': now
    }
    
    access_token = jwt.encode(access_payload, SECRET_KEY, algorithm='HS256')
    refresh_token = jwt.encode(refresh_payload, SECRET_KEY, algorithm='HS256')
    
    return {'access': access_token, 'refresh': refresh_token}
