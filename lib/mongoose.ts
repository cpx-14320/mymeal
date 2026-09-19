import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable (set it in .env.local)");
}

// 跟 lib/mongodb.ts 同樣的理由：dev 模式熱重載會重新執行這個模組，
// 用 globalThis 快取連線 promise，避免每次重載都重新 connect。
const globalForMongoose = globalThis as unknown as {
  _mongooseConnPromise?: Promise<typeof mongoose>;
};

function connect() {
  return mongoose.connect(uri!, { dbName: "MyMeal" });
}

const connPromise = globalForMongoose._mongooseConnPromise ?? connect();

if (process.env.NODE_ENV !== "production") {
  globalForMongoose._mongooseConnPromise = connPromise;
}

/** 每個 model 函式進資料庫前先 await 這個，確保連線已建立。 */
export function connectMongo() {
  return connPromise;
}
