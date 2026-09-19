// 一次性 migration：把 menu_items.kind（寫死的字串 "meal"/"drink"/"snack"/"other"）
// 轉成 menu_items.kindId（關聯 menu_kinds 的 ObjectId，跟「分類」的 categoryId 一樣的做法）。
// menu_kinds 裡沒有對應名稱就直接建立，避免資料遺失。
//
// 用法：node --env-file=.env.local scripts/migrate-item-kind.mjs
// 可重複執行：已經有 kindId、沒有 kind 欄位的品項會被跳過。

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable (set it in .env.local)");
}

const KIND_LABEL = { meal: "餐點", drink: "飲料", snack: "點心", other: "其他" };

const client = new MongoClient(uri);

async function findOrCreateKind(col, name, sortOrder) {
  const existing = await col.findOne({ name });
  if (existing) return existing._id;
  const now = new Date();
  const { insertedId } = await col.insertOne({ name, sortOrder, createdAt: now, updatedAt: now });
  console.log(`  [建立缺少的類型] ${name}`);
  return insertedId;
}

async function main() {
  await client.connect();
  const db = client.db("MyMeal");
  const itemCol = db.collection("menu_items");
  const kindCol = db.collection("menu_item_kinds");

  const kindIdByOldKey = {};
  let order = await kindCol.countDocuments();
  for (const key of Object.keys(KIND_LABEL)) {
    kindIdByOldKey[key] = await findOrCreateKind(kindCol, KIND_LABEL[key], order);
    order++;
  }

  const cursor = itemCol.find({ kind: { $exists: true } });

  let migrated = 0;
  let skipped = 0;
  for await (const doc of cursor) {
    const kindId = kindIdByOldKey[doc.kind];
    if (!kindId) {
      console.warn(`  [略過] ${doc.name ?? doc._id} 的 kind 值 "${doc.kind}" 對不到任何類型`);
      skipped++;
      continue;
    }

    await itemCol.updateOne({ _id: doc._id }, { $set: { kindId }, $unset: { kind: "" } });
    console.log(`已轉換：${doc.name ?? doc._id}（${doc.kind} → ${KIND_LABEL[doc.kind]}）`);
    migrated++;
  }

  console.log(`\n完成，共轉換 ${migrated} 筆品項，跳過 ${skipped} 筆格式異常的資料。`);
}

main()
  .catch((err) => {
    console.error("migration 失敗：", err);
    process.exitCode = 1;
  })
  .finally(() => client.close());
