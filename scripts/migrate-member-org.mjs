// 一次性 migration：把 member.dept / member.unit（名稱字串）轉成
// member.departmentId / member.unitId（關聯 department / unit 的 ObjectId）。
// 名稱在 department/unit 集合裡找不到就直接建立，避免資料遺失。
//
// 用法：node --env-file=.env.local scripts/migrate-member-org.mjs
// 可重複執行：已經有 departmentId/unitId、沒有 dept/unit 欄位的會員會被跳過。

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable (set it in .env.local)");
}

const client = new MongoClient(uri);

async function findOrCreateDepartment(col, name) {
  const existing = await col.findOne({ name });
  if (existing) return existing._id;
  const now = new Date();
  const { insertedId } = await col.insertOne({ name, createdAt: now, updatedAt: now });
  console.log(`  [建立缺少的部門] ${name}`);
  return insertedId;
}

async function findOrCreateUnit(col, name, departmentId) {
  const existing = await col.findOne({ name, departmentId });
  if (existing) return existing._id;
  const now = new Date();
  const { insertedId } = await col.insertOne({ name, departmentId, createdAt: now, updatedAt: now });
  console.log(`  [建立缺少的單位] ${name}`);
  return insertedId;
}

async function main() {
  await client.connect();
  const db = client.db("MyMeal");
  const memberCol = db.collection("member");
  const deptCol = db.collection("member_departments");
  const unitCol = db.collection("member_units");

  const cursor = memberCol.find({ dept: { $exists: true }, unit: { $exists: true } });

  let migrated = 0;
  let skipped = 0;
  for await (const doc of cursor) {
    if (typeof doc.dept !== "string" || typeof doc.unit !== "string") {
      skipped++;
      continue;
    }

    const departmentId = await findOrCreateDepartment(deptCol, doc.dept);
    const unitId = await findOrCreateUnit(unitCol, doc.unit, departmentId);

    await memberCol.updateOne(
      { _id: doc._id },
      {
        $set: { departmentId, unitId },
        $unset: { dept: "", unit: "" },
      },
    );

    console.log(`已轉換：${doc.name ?? doc._id}（${doc.dept} / ${doc.unit}）`);
    migrated++;
  }

  console.log(`\n完成，共轉換 ${migrated} 筆會員資料，跳過 ${skipped} 筆格式異常的資料。`);
}

main()
  .catch((err) => {
    console.error("migration 失敗：", err);
    process.exitCode = 1;
  })
  .finally(() => client.close());
