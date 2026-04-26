import mongoose from 'mongoose'

declare global {
  var mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined
}

const MONGODB_URI = process.env.MONGODB_URI

const cached = global.mongooseCache ?? { conn: null, promise: null }

if (!global.mongooseCache) {
  global.mongooseCache = cached
}

export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable')
  }

  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      autoIndex: true,
      dbName: process.env.MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}
