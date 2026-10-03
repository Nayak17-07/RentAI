import os
import jwt
from datetime import datetime, timedelta

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-o!q0=y&+y5v47g9c6xi#^40$k=47kcml-9o_h_&u%t4x(@quq9')

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
