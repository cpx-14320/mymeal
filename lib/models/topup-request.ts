import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";
import { createLedgerEntry } from "@/lib/models/wallet";
import "@/lib/models/member"; // 確保 populate("memberId") 前 Member（連帶 Department／Unit）model 一定已註冊

/**
 * topup_requests collection —— 會員的儲值申請；核准後才會透過 wallet_ledger
 * 的 createLedgerEntry 入帳（見 approveTopupRequest），申請本身不直接動 member.balance。
 */
export type TopupStatus = "pending" | "approved" | "rejected";

export interface TopupRequestDocument {
  _id: Types.ObjectId;
  memberId: Types.ObjectId; // ref Member
  amount: number;
  method: string; // 銀行轉帳／現金／餐券
  code?: string; // 匯款末五碼或憑證
  note?: string; // 申請人備註
  status: TopupStatus;
  reviewNote?: string; // 退件原因
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const topupRequestSchema = new Schema<TopupRequestDocument>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    amount: { type: Number, required: true, min: 1 },
    method: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    note: { type: String, trim: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], required: true, default: "pending" },
    reviewNote: { type: String, trim: true },
    reviewedBy: { type: String, trim: true },
    reviewedAt: { type: Date },
  },
  { timestamps: true, collection: "wallet_topup_requests" },
);
topupRequestSchema.index({ status: 1, createdAt: -1 });

export const TopupRequest =
  models.TopupRequest ?? model<TopupRequestDocument>("TopupRequest", topupRequestSchema);

export interface CreateTopupRequestInput {
  memberId: string;
  amount: number;
  method: string;
  code?: string;
  note?: string;
}

export async function createTopupRequest(input: CreateTopupRequestInput) {
  await connectMongo();
  if (!Types.ObjectId.isValid(input.memberId)) throw new Error("無效的會員 id");
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error("請輸入正確的儲值金額。");
  if (!input.method.trim()) throw new Error("請選擇付款方式。");

  const doc = await TopupRequest.create({
    memberId: new Types.ObjectId(input.memberId),
    amount: input.amount,
    method: input.method,
    code: input.code,
    note: input.note,
    status: "pending",
  });
  return { id: String(doc._id) };
}

export interface TopupRequestView {
  id: string;
  memberId: string;
  memberName: string;
  dept: string;
  amount: number;
  method: string;
  code?: string;
  note?: string;
  status: TopupStatus;
  reviewNote?: string;
  at: Date;
  reviewedAt?: Date;
}

interface PopulatedMember {
  _id: Types.ObjectId;
  name: string;
  departmentId: { name: string } | null;
}

/** 後台「儲值審核」用：全部申請，附申請人姓名/部門，最新的在前面。 */
export async function listTopupRequests(): Promise<TopupRequestView[]> {
  await connectMongo();
  const docs = await TopupRequest.find({})
    .sort({ createdAt: -1 })
    .populate<{ memberId: PopulatedMember | null }>({
      path: "memberId",
      populate: { path: "departmentId" },
    });

  return docs.map((d) => ({
    id: String(d._id),
    memberId: d.memberId ? String(d.memberId._id) : "",
    memberName: d.memberId?.name ?? "（已刪除會員）",
    dept: d.memberId?.departmentId?.name ?? "",
    amount: d.amount,
    method: d.method,
    code: d.code,
    note: d.note,
    status: d.status,
    reviewNote: d.reviewNote,
    at: d.createdAt,
    reviewedAt: d.reviewedAt,
  }));
}

/** 前台「儲值申請進度」用：單一會員自己的申請紀錄。 */
export async function listTopupRequestsForMember(memberId: string): Promise<TopupRequestView[]> {
  await connectMongo();
  if (!Types.ObjectId.isValid(memberId)) return [];
  const docs = await TopupRequest.find({ memberId: new Types.ObjectId(memberId) }).sort({ createdAt: -1 });
  return docs.map((d) => ({
    id: String(d._id),
    memberId,
    memberName: "",
    dept: "",
    amount: d.amount,
    method: d.method,
    code: d.code,
    note: d.note,
    status: d.status,
    reviewNote: d.reviewNote,
    at: d.createdAt,
    reviewedAt: d.reviewedAt,
  }));
}

/** 核准：寫入一筆 wallet_ledger 儲值入帳（同步加到 member.balance），再把申請標記為已核准。 */
export async function approveTopupRequest(id: string, by = "管理員"): Promise<{ id: string }> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的申請 id");
  const doc = await TopupRequest.findById(id);
  if (!doc) throw new Error("找不到這筆申請，可能已被刪除。");
  if (doc.status !== "pending") throw new Error("這筆申請已經處理過了。");

  await createLedgerEntry({
    memberId: String(doc.memberId),
    type: "topup",
    amount: doc.amount,
    detail: `儲值入帳．${doc.method}`,
    referenceType: "topup_request",
    referenceId: String(doc._id),
    by,
  });

  doc.status = "approved";
  doc.reviewedBy = by;
  doc.reviewedAt = new Date();
  await doc.save();
  return { id };
}

/** 前台會員自己撤回申請用：只能刪自己的、而且只能是還沒審核的（pending），
 *  避免誤刪已經核准入帳／已退件、留有審核紀錄的申請。 */
export async function deleteOwnPendingTopupRequest(memberId: string, id: string): Promise<{ id: string }> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的申請 id");
  const doc = await TopupRequest.findById(id);
  if (!doc) throw new Error("找不到這筆申請，可能已被刪除。");
  if (String(doc.memberId) !== memberId) throw new Error("無法刪除其他人的申請。");
  if (doc.status !== "pending") throw new Error("這筆申請已經處理過了，無法刪除。");

  await TopupRequest.deleteOne({ _id: id });
  return { id };
}

/** 刪除一筆申請紀錄。已核准的申請不能直接刪除——對應的 wallet_ledger 儲值紀錄與會員餘額
 *  不會跟著被復原，會變成「申請單消失了但錢還在」的斷帳；要刪除已核准的申請，
 *  得先呼叫 revokeApprovedTopupRequest 把餘額沖銷、狀態退回 pending，才能刪除。 */
export async function deleteTopupRequest(id: string): Promise<{ id: string }> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的申請 id");
  const doc = await TopupRequest.findById(id);
  if (!doc) throw new Error("找不到這筆申請，可能已被刪除。");
  if (doc.status === "approved") {
    throw new Error("已核准的申請請先撤銷核准，才能刪除。");
  }
  await TopupRequest.deleteOne({ _id: id });
  return { id };
}

/** 撤銷一筆已核准的申請（誤按核准時用）：寫一筆等額反向的 wallet_ledger 分錄把餘額扣回去，
 *  並把狀態退回 pending、清掉原本的核准紀錄，讓管理員可以重新正確地核准或退件。
 *  只能對 status === "approved" 的申請執行。 */
export async function revokeApprovedTopupRequest(id: string, by = "管理員"): Promise<{ id: string }> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的申請 id");
  const doc = await TopupRequest.findById(id);
  if (!doc) throw new Error("找不到這筆申請，可能已被刪除。");
  if (doc.status !== "approved") throw new Error("只有已核准的申請可以撤銷核准。");

  await createLedgerEntry({
    memberId: String(doc.memberId),
    type: "topup_reversal",
    amount: -doc.amount,
    detail: `撤銷儲值核准．${doc.method}`,
    referenceType: "topup_request",
    referenceId: String(doc._id),
    by,
  });

  doc.status = "pending";
  doc.reviewedBy = undefined;
  doc.reviewedAt = undefined;
  await doc.save();
  return { id };
}

export async function rejectTopupRequest(
  id: string,
  reviewNote?: string,
  by = "管理員",
): Promise<{ id: string }> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的申請 id");
  const doc = await TopupRequest.findById(id);
  if (!doc) throw new Error("找不到這筆申請，可能已被刪除。");
  if (doc.status !== "pending") throw new Error("這筆申請已經處理過了。");

  doc.status = "rejected";
  doc.reviewedBy = by;
  doc.reviewedAt = new Date();
  if (reviewNote) doc.reviewNote = reviewNote;
  await doc.save();
  return { id };
}
