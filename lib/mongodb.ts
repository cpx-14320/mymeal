import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable (set it in .env.local)");
}

// Next.js dev 模式熱重載會重新執行這個模組，若每次都 new MongoClient 會很快耗盡連線池，
// 所以用 globalThis 快取同一個 client/連線 promise，跨熱重載重複使用。
const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
};

const client = globalForMongo._mongoClientPromise
  ? undefined
  : new MongoClient(uri);

const clientPromise: Promise<MongoClient> =
  globalForMongo._mongoClientPromise ?? client!.connect();

if (process.env.NODE_ENV !== "production") {
  globalForMongo._mongoClientPromise = clientPromise;
}

export default clientPromise;

export async function getDb() {
  const client = await clientPromise;
  return client.db("MyMeal");
}
