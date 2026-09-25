from pymongo import MongoClient
from django.conf import settings

def get_mongo_db():
    """
    Returns a connected MongoDB database instance.
    Uses credentials from Django settings.
    """
    client = MongoClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB_NAME]
    return db
