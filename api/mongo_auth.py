import jwt
from datetime import datetime, timedelta
from django.conf import settings
from rest_framework import authentication
from rest_framework import exceptions
from .mongo_client import get_mongo_db

def generate_tokens(user_id):
    access_payload = {
        'user_id': str(user_id),
        'exp': datetime.utcnow() + timedelta(minutes=60),
        'iat': datetime.utcnow()
    }
    refresh_payload = {
        'user_id': str(user_id),
        'exp': datetime.utcnow() + timedelta(days=1),
        'iat': datetime.utcnow()
    }
    
    access_token = jwt.encode(access_payload, settings.SECRET_KEY, algorithm='HS256')
    refresh_token = jwt.encode(refresh_payload, settings.SECRET_KEY, algorithm='HS256')
    
    return {'access': access_token, 'refresh': refresh_token}

class MongoJWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None

        try:
            prefix, token = auth_header.split(' ')
            if prefix.lower() != 'bearer':
                return None
                
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = payload['user_id']
            
            db = get_mongo_db()
            user = db.users.find_one({"_id": user_id})
            
            if not user:
                raise exceptions.AuthenticationFailed('User not found')
                
            class MockUser:
                def __init__(self, user_dict):
                    self.id = user_dict['_id']
                    self.username = user_dict.get('username', '')
                    self.is_authenticated = True
            
            return (MockUser(user), None)
            
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token expired')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid token')
        except Exception:
            return None

    def authenticate_header(self, request):
        return 'Bearer'
