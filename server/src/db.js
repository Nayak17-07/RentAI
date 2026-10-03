const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/';
const dbName = process.env.MONGO_DB_NAME || 'rentai_db';

let client = null;
let db = null;

async function connectDb() {
  if (db) return db;
  client = new MongoClient(uri, {
    maxPoolSize: 50,
  });
  await client.connect();
  db = client.db(dbName);
  console.log(`Connected to MongoDB: ${dbName}`);
  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database not connected. Call connectDb() first.');
  }
  return db;
}

module.exports = { connectDb, getDb };
