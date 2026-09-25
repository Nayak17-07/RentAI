import os
import sys
import uuid
import datetime
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rentai_core.settings')

import django
django.setup()

from api.mongo_client import get_mongo_db

def train_and_generate_recommendations():
    try:
        db = get_mongo_db()
        print("Fetching data from MongoDB...")
        
        appliances_cursor = db.appliances.find({})
        appliances = list(appliances_cursor)
        
        if not appliances:
            print("No appliances found. Please seed the database first.")
            return
            
        df_appliances = pd.DataFrame(appliances)
        
        # Create a content string for TF-IDF
        df_appliances['content'] = df_appliances['rental_name'].fillna('') + " " + \
                                   df_appliances['category_id'].fillna('') + " " + \
                                   df_appliances['description'].fillna('')
                                   
        print(f"Training TF-IDF model on {len(df_appliances)} appliances...")
        
        tfidf = TfidfVectorizer(stop_words='english')
        tfidf_matrix = tfidf.fit_transform(df_appliances['content'])
        
        # Compute cosine similarity
        cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)
        
        users_cursor = db.users.find({})
        users = list(users_cursor)
        
        print(f"Generating recommendations for {len(users)} users...")
        
        recommendations = []
        
        for user in users:
            user_id = user['_id']
            
            # Fetch user's rentals
            user_rentals = list(db.rentals.find({"user_id": user_id}))
            
            if not user_rentals:
                # Cold start: recommend popular or random items
                # Let's pick 6 random appliances for now
                sample = df_appliances.sample(n=min(6, len(df_appliances)))
                for _, row in sample.iterrows():
                    recommendations.append({
                        "_id": str(uuid.uuid4()),
                        "user_id": user_id,
                        "recommended_appliance_id": row['_id'],
                        "last_updated": datetime.datetime.utcnow()
                    })
                continue
                
            # If user has rentals, get the appliance indices
            rented_ids = [r['appliance_id'] for r in user_rentals]
            
            # Find matching indices in df
            rented_indices = df_appliances[df_appliances['appliance_id'].isin(rented_ids)].index.tolist()
            
            if not rented_indices:
                sample = df_appliances.sample(n=min(6, len(df_appliances)))
                for _, row in sample.iterrows():
                    recommendations.append({
                        "_id": str(uuid.uuid4()),
                        "user_id": user_id,
                        "recommended_appliance_id": row['_id'],
                        "last_updated": datetime.datetime.utcnow()
                    })
                continue
                
            # Get similarity scores for all rented items and average them
            sim_scores = sum([cosine_sim[idx] for idx in rented_indices]) / len(rented_indices)
            
            # Sort by highest similarity
            similar_indices = sim_scores.argsort()[::-1]
            
            # Get top 6, excluding already rented
            top_indices = []
            for idx in similar_indices:
                if df_appliances.iloc[idx]['appliance_id'] not in rented_ids:
                    top_indices.append(idx)
                if len(top_indices) >= 6:
                    break
                    
            for idx in top_indices:
                recommendations.append({
                    "_id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "recommended_appliance_id": df_appliances.iloc[idx]['_id'],
                    "last_updated": datetime.datetime.utcnow()
                })
                
        # Clear old recommendations and insert new
        db.appliance_recommendations.delete_many({})
        if recommendations:
            db.appliance_recommendations.insert_many(recommendations)
            print(f"Successfully generated {len(recommendations)} recommendations.")
        else:
            print("No recommendations generated.")
            
    except Exception as e:
        print(f"Error during recommendation generation: {e}")

if __name__ == '__main__':
    train_and_generate_recommendations()
