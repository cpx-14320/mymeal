import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";

/**
 * department / unit collection —— 註冊表單與會員編輯頁「部門」「單位」下拉選單的資料來源。
 * 原本寫死在 app/register/constants.ts，現在讓管理者可以在後台自己增減，不用改程式碼。
 * 單位隸屬於部門（一個單位只會屬於一個部門）；兩個集合第一次讀取若是空的，
 * 會自動補回原本寫死的預設值，避免舊資料/註冊流程壞掉。
 *
 * member 的部門/單位是關聯這兩個集合的 ObjectId（見 member.ts 的 departmentId/unitId），
 * 所以這裡改名字不用再手動同步 member 的資料。
 */

export interface OrgOption {
  id: string;
  name: string;
}

export interface UnitOption extends OrgOption {
  departmentId: string;
  departmentName: string;
}

const DEFAULT_DEPARTMENTS = ["網路發展部"];
const DEFAULT_UNITS = [
  "會員經營課",
  "數位推展課",
  "網通行銷課",
  "平台開發課",
  "運營推展課",
  "卡務控管課",
  "客戶服務課",
];

const DUPLICATE_KEY_ERROR = 11000;

function isDuplicateKeyError(err: unknown): boolean {
  return !!err && typeof err === "object" && "code" in err && err.code === DUPLICATE_KEY_ERROR;
}

interface DepartmentDocument {
  _id: Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UnitDocument {
  _id: Types.ObjectId;
  name: string;
  departmentId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<DepartmentDocument>(
  { name: { type: String, required: true, unique: true, trim: true } },
  { timestamps: true, collection: "member_departments" },
);

const unitSchema = new Schema<UnitDocument>(
  {
    name: { type: String, required: true, trim: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
  },
  { timestamps: true, collection: "member_units" },
);
// 同一部門底下單位名稱唯一；跨部門可以同名。
unitSchema.index({ departmentId: 1, name: 1 }, { unique: true });

const Department = models.Department ?? model<DepartmentDocument>("Department", departmentSchema);
const Unit = models.Unit ?? model<UnitDocument>("Unit", unitSchema);

/** 集合是空的才補預設值；靠唯一索引擋重複，避免熱重載或多個請求同時觸發時重複塞入。 */
async function seedIfEmpty<T extends { name: string }>(
  count: () => Promise<number>,
  insertMany: (docs: T[]) => Promise<unknown>,
  docs: T[],
) {
  if (docs.length === 0) return;
  if ((await count()) > 0) return;
  try {
    await insertMany(docs);
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
  }
}

export async function listDepartments(): Promise<OrgOption[]> {
  await connectMongo();
  await seedIfEmpty(
    () => Department.countDocuments(),
    (docs) => Department.insertMany(docs, { ordered: false }),
    DEFAULT_DEPARTMENTS.map((name) => ({ name })),
  );
  const docs = await Department.find({}).sort({ createdAt: 1 });
  return docs.map((d) => ({ id: String(d._id), name: d.name }));
}

export async function createDepartment(name: string): Promise<OrgOption> {
  await connectMongo();
  const existing = await Department.findOne({ name });
  if (existing) throw new Error("這個部門名稱已經存在了。");
  const doc = await Department.create({ name });
  return { id: String(doc._id), name };
}

/** 改部門名稱：member 存的是 departmentId，改名不用同步任何地方。 */
export async function updateDepartment(id: string, name: string): Promise<OrgOption> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的 id");
  const current = await Department.findById(id);
  if (!current) throw new Error("找不到這筆資料，可能已被刪除。");
  if (current.name === name) return { id, name };

  const existing = await Department.findOne({ name, _id: { $ne: current._id } });
  if (existing) throw new Error("這個部門名稱已經存在了。");

  current.name = name;
  await current.save();
  return { id, name };
}

/** 刪除部門會連同底下的單位一起刪除；還有會員屬於這個部門（或底下任一單位）就擋下來，避免留下斷掉的關聯。 */
export async function deleteDepartment(id: string): Promise<boolean> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的 id");
  const objId = new Types.ObjectId(id);

  const { Member } = await import("@/lib/models/member");
  const memberCount = await Member.countDocuments({ departmentId: objId });
  if (memberCount > 0) throw new Error("這個部門底下還有會員，請先將會員移到其他部門再刪除。");

  await Unit.deleteMany({ departmentId: objId });
  const result = await Department.deleteOne({ _id: objId });
  return result.deletedCount > 0;
}

/** 不傳 departmentId 拿全部單位（後台管理頁用）；傳了就只拿該部門底下的單位（表單cascading用）。 */
export async function listUnits(departmentId?: string): Promise<UnitOption[]> {
  await connectMongo();
  const departments = await listDepartments(); // 順便確保部門已經有種子資料
  if (departments.length > 0) {
    const defaultDeptId = new Types.ObjectId(departments[0].id);
    await seedIfEmpty(
      () => Unit.countDocuments(),
      (docs) => Unit.insertMany(docs, { ordered: false }),
      DEFAULT_UNITS.map((name) => ({ name, departmentId: defaultDeptId })),
    );
  }

  const filter =
    departmentId && Types.ObjectId.isValid(departmentId)
      ? { departmentId: new Types.ObjectId(departmentId) }
      : {};
  const docs = await Unit.find(filter).sort({ createdAt: 1 });
  const deptNameById = new Map(departments.map((d) => [d.id, d.name]));
  return docs.map((d) => ({
    id: String(d._id),
    name: d.name,
    departmentId: String(d.departmentId),
    departmentName: deptNameById.get(String(d.departmentId)) ?? "",
  }));
}

export async function createUnit(name: string, departmentId: string): Promise<OrgOption> {
  await connectMongo();
  if (!Types.ObjectId.isValid(departmentId)) throw new Error("請選擇有效的部門。");
  const deptObjId = new Types.ObjectId(departmentId);
  const existing = await Unit.findOne({ name, departmentId: deptObjId });
  if (existing) throw new Error("這個部門底下已經有相同名稱的單位了。");
  const doc = await Unit.create({ name, departmentId: deptObjId });
  return { id: String(doc._id), name };
}

/** 改單位名稱：member 存的是 unitId，改名不用同步任何地方。 */
export async function updateUnit(id: string, name: string): Promise<OrgOption> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的 id");
  const current = await Unit.findById(id);
  if (!current) throw new Error("找不到這筆資料，可能已被刪除。");
  if (current.name === name) return { id, name };

  const existing = await Unit.findOne({
    name,
    departmentId: current.departmentId,
    _id: { $ne: current._id },
  });
  if (existing) throw new Error("這個部門底下已經有相同名稱的單位了。");

  current.name = name;
  await current.save();
  return { id, name };
}

/** 刪除單位；還有會員屬於這個單位就擋下來，避免留下斷掉的關聯。 */
export async function deleteUnit(id: string): Promise<boolean> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的 id");
  const objId = new Types.ObjectId(id);

  const { Member } = await import("@/lib/models/member");
  const memberCount = await Member.countDocuments({ unitId: objId });
  if (memberCount > 0) throw new Error("這個單位底下還有會員，請先將會員移到其他單位再刪除。");

  const result = await Unit.deleteOne({ _id: objId });
  return result.deletedCount > 0;
}
