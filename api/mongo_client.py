import os
from pymongo import MongoClient

def get_mongo_db():
    """
    Returns a connected MongoDB database instance.
    Uses environment variables or local defaults without any Django dependency.
    """
    uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
    db_name = os.getenv('MONGO_DB_NAME', 'rentai_db')
    client = MongoClient(uri)
    return client[db_name]
