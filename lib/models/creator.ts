import { Types, type Model } from "mongoose";
import { connectMongo } from "@/lib/mongoose";
import { Role } from "@/lib/models/role";
import type { AdminNavKey } from "@/components/layout/nav";

/**
 * 品項設定／模板設定／頁面設定的「建立者」共用邏輯：
 * createdBy（姓名字串）維持不變，是建立當下的歷史存證，永遠不會因為後續權限異動而消失；
 * createdByMemberId 是額外存的會員 id，讓畫面能查「這個人現在還有沒有這項權限」，
 * 查不到會員＝帳號已刪除，查得到但角色沒這個權限鍵＝已無此權限，都用小標籤標示、不清空姓名。
 * 帳號單純停用不特別標示——人還在，只是不能登入，跟「還有沒有這項權限」是兩回事。
 * 舊資料沒有 createdByMemberId 的，一律不查、不標籤（見 backfillCreatorMemberIds）。
 */

export type CreatorLabel = "帳號已刪除" | "已無此權限";

export async function getCreatorLabels(
  memberIds: (string | undefined)[],
  key: AdminNavKey,
): Promise<Map<string, CreatorLabel>> {
  await connectMongo();
  const labels = new Map<string, CreatorLabel>();
  const ids = [...new Set(memberIds.filter((id): id is string => !!id && Types.ObjectId.isValid(id)))];
  if (ids.length === 0) return labels;

  const { Member } = await import("@/lib/models/member");
  const members = await Member.find({ _id: { $in: ids } }).select("role");
  const memberById = new Map(members.map((m) => [String(m._id), m]));

  const roleNames = [...new Set(members.map((m) => m.role).filter(Boolean))];
  const roles =
    roleNames.length > 0 ? await Role.find({ name: { $in: roleNames } }).select("name permissions") : [];
  const permsByRoleName = new Map(roles.map((r) => [r.name, r.permissions ?? {}]));

  for (const id of ids) {
    const member = memberById.get(id);
    if (!member) {
      labels.set(id, "帳號已刪除");
      continue;
    }
    const perms = permsByRoleName.get(member.role) ?? {};
    if (!perms[key]) labels.set(id, "已無此權限");
  }
  return labels;
}

/**
 * 幫舊資料（只有 createdBy 姓名字串、沒有 createdByMemberId）補建立者 id：
 * 姓名在會員裡「唯一」對應到一位會員才補上；同名或找不到人就存 null，代表「試過但無法確定」，
 * 不會每次都重新嘗試同一批查無結果的資料（跟找得到人的舊資料一樣，不會再進這支函式的查詢範圍）。
 */
export async function backfillCreatorMemberIds(
  Model: Model<{ createdBy: string; createdByMemberId?: Types.ObjectId | null }>,
) {
  await connectMongo();
  const docs = await Model.find({ createdByMemberId: { $exists: false } }).select("createdBy");
  if (docs.length === 0) return;

  const { Member } = await import("@/lib/models/member");
  const names = [...new Set(docs.map((d) => d.createdBy).filter(Boolean))];
  const members = names.length > 0 ? await Member.find({ name: { $in: names } }).select("name") : [];
  const idsByName = new Map<string, Types.ObjectId[]>();
  for (const m of members) {
    const list = idsByName.get(m.name) ?? [];
    list.push(m._id);
    idsByName.set(m.name, list);
  }

  const ops = docs.map((d) => {
    const matches = idsByName.get(d.createdBy) ?? [];
    return {
      updateOne: {
        filter: { _id: d._id },
        update: { $set: { createdByMemberId: matches.length === 1 ? matches[0] : null } },
      },
    };
  });
  await Model.bulkWrite(ops);
}
