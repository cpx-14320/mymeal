import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";

/**
 * audit_logs collection —— 後台操作紀錄，append-only（只新增，沒有更新/刪除函式）。
 * 目前涵蓋錢包手動調整、儲值審核、會員停權/復權/刪除、組別權限異動；
 * 之後有新的高風險操作要記錄，比照現有呼叫點在對應的 server action 裡加一行
 * createAuditLog() 即可，不用動這個檔案。
 */
export interface AuditLogDocument {
  _id: Types.ObjectId;
  actor: string; // 操作者姓名（來自 session；預覽模式無登入時記「管理員」）
  action: string; // 動作描述，例如「核准儲值申請」
  target?: string; // 操作對象描述，例如會員姓名、申請編號
  risk: boolean; // 是否為高風險操作（金流／權限／帳號狀態變更）
  createdAt: Date;
}

const auditLogSchema = new Schema<AuditLogDocument>(
  {
    actor: { type: String, required: true, trim: true },
    action: { type: String, required: true, trim: true },
    target: { type: String, trim: true },
    risk: { type: Boolean, required: true, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "audit_logs" },
);
auditLogSchema.index({ createdAt: -1 });

export const AuditLog = models.AuditLog ?? model<AuditLogDocument>("AuditLog", auditLogSchema);

export interface CreateAuditLogInput {
  actor: string;
  action: string;
  target?: string;
  risk?: boolean;
}

/** 寫入一筆稽核紀錄。刻意不對外拋出錯誤——稽核紀錄寫失敗不該擋住原本的後台操作，
 *  只在 server console 留一筆錯誤方便事後排查。 */
export async function createAuditLog(input: CreateAuditLogInput): Promise<void> {
  try {
    await connectMongo();
    await AuditLog.create({
      actor: input.actor,
      action: input.action,
      target: input.target,
      risk: input.risk ?? false,
    });
  } catch (err) {
    console.error("[audit-log] 寫入失敗", err);
  }
}

export interface AuditLogRow {
  id: string;
  at: Date;
  actor: string;
  action: string;
  target: string;
  risk: boolean;
}

/** 後台「稽核紀錄」列表用：最新的在前面。 */
export async function listAuditLogs(limit = 300): Promise<AuditLogRow[]> {
  await connectMongo();
  const docs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(limit);
  return docs.map((d) => ({
    id: String(d._id),
    at: d.createdAt,
    actor: d.actor,
    action: d.action,
    target: d.target ?? "",
    risk: d.risk,
  }));
}
