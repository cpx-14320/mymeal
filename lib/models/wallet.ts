import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";
import "@/lib/models/member"; // 確保 populate("memberId"/"departmentId") 前 Member（連帶 Department／Unit）model 一定已註冊

/**
 * wallet_ledger collection —— 錢包流水帳，append-only（只新增不修改/刪除既有紀錄）。
 * amount 有正負：正數增加餘額（儲值/退款/正向調整），負數減少（訂餐扣款/負向調整)。
 * member.balance 是這份流水帳滾出來的快取，每筆流水帳都透過 createLedgerEntry 用
 * $inc 同步更新，balanceBefore/balanceAfter 直接記錄異動當下的餘額，方便稽核回溯，
 * 不用重新加總整份流水帳。referenceType/referenceId 是多型參照（比照舊系統
 * balance_transactions 的 reference_type/reference_id），指回觸發這筆異動的來源。
 */
export type LedgerType = "topup" | "spend" | "refund" | "adjustment";
export type LedgerReferenceType = "topup_request" | "group_order" | "manual";

export interface WalletLedgerDocument {
  _id: Types.ObjectId;
  memberId: Types.ObjectId; // ref Member
  type: LedgerType;
  amount: number; // 正數增加、負數減少
  detail: string;
  note?: string; // 手動調整時的必填備註
  balanceBefore: number;
  balanceAfter: number;
  referenceType: LedgerReferenceType;
  referenceId?: Types.ObjectId;
  by: string; // 操作者：系統自動扣款是「系統」，後台手動調整記管理員名稱
  createdAt: Date;
}

const walletLedgerSchema = new Schema<WalletLedgerDocument>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    type: { type: String, enum: ["topup", "spend", "refund", "adjustment"], required: true },
    amount: { type: Number, required: true },
    detail: { type: String, required: true, trim: true },
    note: { type: String, trim: true },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    referenceType: { type: String, enum: ["topup_request", "group_order", "manual"], required: true },
    referenceId: { type: Schema.Types.ObjectId },
    by: { type: String, required: true, default: "系統" },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "wallet_ledger" },
);
walletLedgerSchema.index({ memberId: 1, createdAt: -1 });

export const WalletLedger =
  models.WalletLedger ?? model<WalletLedgerDocument>("WalletLedger", walletLedgerSchema);

export interface WalletLedgerInput {
  memberId: string;
  type: LedgerType;
  amount: number;
  detail: string;
  note?: string;
  referenceType: LedgerReferenceType;
  referenceId?: string;
  by?: string;
}

/** 寫入一筆流水帳，同步用 $inc 更新 member.balance（atomic，balanceAfter 直接讀更新後的值）。 */
export async function createLedgerEntry(input: WalletLedgerInput) {
  await connectMongo();
  if (!Types.ObjectId.isValid(input.memberId)) throw new Error("無效的會員 id");
  const { Member } = await import("@/lib/models/member");
  const memberObjId = new Types.ObjectId(input.memberId);

  const updated = await Member.findByIdAndUpdate(
    memberObjId,
    { $inc: { balance: input.amount } },
    { returnDocument: "after" },
  );
  if (!updated) throw new Error("找不到這位會員。");

  const balanceAfter = updated.balance ?? 0;
  const balanceBefore = balanceAfter - input.amount;

  const doc = await WalletLedger.create({
    memberId: memberObjId,
    type: input.type,
    amount: input.amount,
    detail: input.detail,
    note: input.note,
    balanceBefore,
    balanceAfter,
    referenceType: input.referenceType,
    ...(input.referenceId && Types.ObjectId.isValid(input.referenceId)
      ? { referenceId: new Types.ObjectId(input.referenceId) }
      : {}),
    by: input.by ?? "系統",
  });

  return { id: String(doc._id), balanceAfter };
}

/** 手動調整餘額：加值/扣款/退款校正都走這裡，一律要求填備註（稽核用）。 */
export async function adjustMemberBalance(memberId: string, amount: number, note: string, by = "管理員") {
  if (!note.trim()) throw new Error("請填寫調整備註。");
  if (amount === 0) throw new Error("調整金額不能是 0。");
  return createLedgerEntry({
    memberId,
    type: "adjustment",
    amount,
    detail: "手動調整",
    note,
    referenceType: "manual",
    by,
  });
}

export async function getMemberBalance(memberId: string): Promise<number> {
  await connectMongo();
  if (!Types.ObjectId.isValid(memberId)) return 0;
  const { Member } = await import("@/lib/models/member");
  const doc = await Member.findById(memberId);
  return doc?.balance ?? 0;
}

export interface WalletBalanceRow {
  memberId: string;
  name: string;
  dept: string;
  balance: number;
  totalTopup: number;
  totalSpend: number;
}

/** 後台「會員餘額」頁用：每位會員目前餘額 + 累計儲值/消費（從流水帳彙總，不是另外存一份）。 */
export async function listMemberBalances(): Promise<WalletBalanceRow[]> {
  await connectMongo();
  const { Member } = await import("@/lib/models/member");
  const members = await Member.find({})
    .sort({ createdAt: -1 })
    .populate<{ departmentId: { name: string } | null }>("departmentId");

  const totals = await WalletLedger.aggregate<{
    _id: { memberId: Types.ObjectId; type: LedgerType };
    sum: number;
  }>([{ $group: { _id: { memberId: "$memberId", type: "$type" }, sum: { $sum: "$amount" } } }]);

  const topupByMember = new Map<string, number>();
  const spendByMember = new Map<string, number>();
  for (const t of totals) {
    const key = String(t._id.memberId);
    if (t._id.type === "topup") topupByMember.set(key, (topupByMember.get(key) ?? 0) + t.sum);
    if (t._id.type === "spend") spendByMember.set(key, (spendByMember.get(key) ?? 0) + Math.abs(t.sum));
  }

  return members.map((m) => ({
    memberId: String(m._id),
    name: m.name,
    dept: m.departmentId?.name ?? "",
    balance: m.balance ?? 0,
    totalTopup: topupByMember.get(String(m._id)) ?? 0,
    totalSpend: spendByMember.get(String(m._id)) ?? 0,
  }));
}

export interface WalletLedgerRow {
  id: string;
  memberId: string;
  memberName: string;
  type: LedgerType;
  amount: number;
  balanceAfter: number;
  by: string;
  detail: string;
  at: Date;
}

/** 後台「最近交易」用：跨全部會員的流水帳，最新的在前面。 */
export async function listRecentLedger(limit = 200): Promise<WalletLedgerRow[]> {
  await connectMongo();
  const docs = await WalletLedger.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate<{ memberId: { _id: Types.ObjectId; name: string } | null }>("memberId");

  return docs.map((d) => ({
    id: String(d._id),
    memberId: d.memberId ? String(d.memberId._id) : "",
    memberName: d.memberId?.name ?? "（已刪除會員）",
    type: d.type,
    amount: d.amount,
    balanceAfter: d.balanceAfter,
    by: d.by,
    detail: d.detail,
    at: d.createdAt,
  }));
}

/** 前台「交易明細」用：單一會員自己的流水帳。 */
export async function listLedgerForMember(memberId: string, limit = 200): Promise<WalletLedgerRow[]> {
  await connectMongo();
  if (!Types.ObjectId.isValid(memberId)) return [];
  const docs = await WalletLedger.find({ memberId: new Types.ObjectId(memberId) })
    .sort({ createdAt: -1 })
    .limit(limit);

  return docs.map((d) => ({
    id: String(d._id),
    memberId,
    memberName: "",
    type: d.type,
    amount: d.amount,
    balanceAfter: d.balanceAfter,
    by: d.by,
    detail: d.detail,
    at: d.createdAt,
  }));
}
