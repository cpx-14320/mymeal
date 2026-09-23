import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";
import type { AdminNavKey } from "@/components/layout/nav";

/**
 * role collection —— 會員權限組別（「一般使用者」「餐飲管理員」…）。
 * 權限鍵跟後台側欄一對一對應（見 nav.ts 的 AdminNavKey），permissions 是
 * { [key in AdminNavKey]?: boolean }，勾了才有那個權限鍵。
 * member.role 存的是這裡的 name（字串比對，不是 ObjectId 關聯）——沿用註冊/會員編輯
 * 表單原本就是存權限「名稱」字串的做法，改成關聯會牽動 member.ts 和既有資料，先不做。
 * 集合第一次讀取若是空的，會自動補回原本寫死的預設組別，避免舊資料/既有頁面壞掉。
 */

export type RolePermissions = Partial<Record<AdminNavKey, boolean>>;

export interface RoleDocument {
  _id: Types.ObjectId;
  name: string;
  permissions: RolePermissions;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<RoleDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    permissions: { type: Schema.Types.Mixed, required: true, default: {} },
  },
  { timestamps: true, collection: "member_roles" },
);

export const Role = models.Role ?? model<RoleDocument>("Role", roleSchema);

const DUPLICATE_KEY_ERROR = 11000;

function isDuplicateKeyError(err: unknown): boolean {
  return !!err && typeof err === "object" && "code" in err && err.code === DUPLICATE_KEY_ERROR;
}

/** 沿用既有介面預覽的 5 個預設組別；集合是空的才會種入。 */
const DEFAULT_ROLES: { name: string; permissions: RolePermissions }[] = [
  { name: "一般使用者", permissions: {} },
  {
    name: "餐飲管理員",
    permissions: {
      zones: true,
      templates: true,
      pages: true,
      itemClassification: true,
      items: true,
      grouporders: true,
      reports: true,
    },
  },
  {
    name: "財務管理員",
    permissions: { topups: true, wallets: true, reports: true, audit: true },
  },
  {
    name: "客服管理員",
    permissions: { grouporders: true, members: true, memberInsights: true, gamification: true },
  },
  {
    name: "超級管理員",
    permissions: {
      zones: true,
      pages: true,
      items: true,
      itemClassification: true,
      templates: true,
      grouporders: true,
      topups: true,
      wallets: true,
      members: true,
      memberInsights: true,
      roles: true,
      orgUnits: true,
      itemStats: true,
      gamification: true,
      reports: true,
      audit: true,
      promos: true,
      settings: true,
    },
  },
];

async function seedIfEmpty() {
  if ((await Role.countDocuments()) > 0) return;
  try {
    await Role.insertMany(DEFAULT_ROLES, { ordered: false });
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
  }
}

export interface RoleInput {
  name: string;
  permissions: RolePermissions;
}

export interface RoleView {
  id: string;
  name: string;
  permissions: RolePermissions;
  permCount: number;
  memberCount: number;
}

function permCount(permissions: RolePermissions): number {
  return Object.values(permissions).filter(Boolean).length;
}

/** 依角色名稱數一數目前有幾位會員套用（member.role 存的是名稱字串）。 */
async function countMembersByRole(name: string): Promise<number> {
  const { Member } = await import("@/lib/models/member");
  return Member.countDocuments({ role: name });
}

export async function listRoles(): Promise<RoleView[]> {
  await connectMongo();
  await seedIfEmpty();
  const docs = await Role.find({}).sort({ createdAt: 1 });
  return Promise.all(
    docs.map(async (d) => ({
      id: String(d._id),
      name: d.name,
      permissions: d.permissions ?? {},
      permCount: permCount(d.permissions ?? {}),
      memberCount: await countMembersByRole(d.name),
    })),
  );
}

export async function findRoleById(id: string): Promise<RoleView | null> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = await Role.findById(id);
  if (!doc) return null;
  return {
    id: String(doc._id),
    name: doc.name,
    permissions: doc.permissions ?? {},
    permCount: permCount(doc.permissions ?? {}),
    memberCount: await countMembersByRole(doc.name),
  };
}

export async function createRole(input: RoleInput) {
  await connectMongo();
  const existing = await Role.findOne({ name: input.name });
  if (existing) throw new Error("這個組別名稱已經存在了。");
  const doc = await Role.create({ name: input.name, permissions: input.permissions });
  return { id: String(doc._id) };
}

/** 改名會讓套用這個組別的會員自動跟著改，因為 member.role 存的是名稱字串——一併更新既有會員的 role。 */
export async function updateRole(id: string, input: RoleInput) {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的組別 id");
  const current = await Role.findById(id);
  if (!current) throw new Error("找不到這個組別，可能已被刪除。");

  if (current.name !== input.name) {
    const existing = await Role.findOne({ name: input.name, _id: { $ne: current._id } });
    if (existing) throw new Error("這個組別名稱已經存在了。");
  }

  const oldName = current.name;
  current.name = input.name;
  current.permissions = input.permissions;
  await current.save();

  if (oldName !== input.name) {
    const { Member } = await import("@/lib/models/member");
    await Member.updateMany({ role: oldName }, { $set: { role: input.name } });
  }

  return { id };
}

/** 還有會員套用這個組別就擋下來，避免會員的 role 字串對不到任何組別。 */
export async function deleteRole(id: string): Promise<boolean> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的組別 id");
  const current = await Role.findById(id);
  if (!current) return false;

  const memberCount = await countMembersByRole(current.name);
  if (memberCount > 0) throw new Error("還有會員套用這個組別，請先將會員改為其他組別再刪除。");

  const result = await Role.deleteOne({ _id: current._id });
  return result.deletedCount > 0;
}

export async function deleteRoles(ids: string[]): Promise<{ deleted: number; blocked: string[] }> {
  await connectMongo();
  let deleted = 0;
  const blocked: string[] = [];
  for (const id of ids) {
    if (!Types.ObjectId.isValid(id)) continue;
    const current = await Role.findById(id);
    if (!current) continue;
    const memberCount = await countMembersByRole(current.name);
    if (memberCount > 0) {
      blocked.push(current.name);
      continue;
    }
    await Role.deleteOne({ _id: current._id });
    deleted++;
  }
  return { deleted, blocked };
}
