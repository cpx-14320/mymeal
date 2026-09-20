import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";

/**
 * group_orders collection —— 開團訂餐：一個 Template 可以同時被多個單位各自開團（同一天也可以）。
 * unitId/hostId 關聯真的 Unit / Member（見 org.ts / member.ts），不是另外存一份部門單位假資料。
 * lines 內嵌逐人品項，name/price 是下單當下的 snapshot（模板/品項之後改了不影響歷史訂單）。
 * 前台實際送出訂單的流程還沒接（見 replaceMemberLines，函式先備著），這裡先讓後台
 * 「團訂管理」「依部門匯出」能對著真資料運作，管理員可用「代開團」建立真的團。
 */
export type GroupOrderStatus = "open" | "closed" | "completed";
export type RiceLevel = "normal" | "half" | "none";

export interface OrderLineSubdoc {
  _id: Types.ObjectId;
  memberId: Types.ObjectId; // ref Member
  memberName: string; // snapshot
  itemId: Types.ObjectId; // ref CatalogItem
  itemName: string; // snapshot
  price: number; // snapshot
  qty: number;
  note?: string;
  rice: RiceLevel;
  paymentMethod: string; // 錢包扣款／餐券／現金／銀行轉帳，跟 note 一樣是這位會員整批點餐共用一個值，逐行重複存
  bankCode: string; // 銀行轉帳時的匯款後5碼；其他付款方式留空
  paid: boolean; // 後台手動標記「錢收到了」，跟下面 walletCharged 無關（現金/轉帳用這個，人工核對）
  walletCharged: boolean; // 錢包扣款這筆是否已經真的扣過款——結單時只扣未扣過的，避免重新開放後再次結單被扣兩次
}

export interface GroupOrderDocument {
  _id: Types.ObjectId;
  name: string;
  templateId: Types.ObjectId; // ref Template
  sectionId?: Types.ObjectId; // 模板裡選定的分類（例如「星期一」）；未選則整個模板都能點，舊資料也是這樣
  sectionName?: string; // snapshot，模板分類之後改名不影響這裡
  unitId: Types.ObjectId; // ref Unit
  hostId: Types.ObjectId; // ref Member
  date: string; // "YYYY/MM/DD"
  deadline: string;
  status: GroupOrderStatus;
  lines: OrderLineSubdoc[];
  createdAt: Date;
  updatedAt: Date;
}

const orderLineSchema = new Schema<OrderLineSubdoc>({
  memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
  memberName: { type: String, required: true },
  itemId: { type: Schema.Types.ObjectId, ref: "CatalogItem", required: true },
  itemName: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true, default: 1 },
  note: { type: String, default: "" },
  rice: { type: String, enum: ["normal", "half", "none"], required: true, default: "normal" },
  paymentMethod: { type: String, default: "" },
  bankCode: { type: String, default: "" },
  paid: { type: Boolean, required: true, default: false },
  walletCharged: { type: Boolean, required: true, default: false },
});

const groupOrderSchema = new Schema<GroupOrderDocument>(
  {
    name: { type: String, required: true, trim: true },
    templateId: { type: Schema.Types.ObjectId, ref: "Template", required: true },
    sectionId: { type: Schema.Types.ObjectId },
    sectionName: { type: String, default: "" },
    unitId: { type: Schema.Types.ObjectId, ref: "Unit", required: true },
    hostId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    date: { type: String, required: true },
    deadline: { type: String, default: "" },
    status: { type: String, enum: ["open", "closed", "completed"], required: true, default: "open" },
    lines: { type: [orderLineSchema], required: true, default: [] },
  },
  { timestamps: true, collection: "group_orders" },
);

export const GroupOrder = models.GroupOrder ?? model<GroupOrderDocument>("GroupOrder", groupOrderSchema);

function orderLineTotals(lines: OrderLineSubdoc[]) {
  return lines.reduce(
    (acc, l) => ({ qty: acc.qty + l.qty, amount: acc.amount + l.price * l.qty }),
    { qty: 0, amount: 0 },
  );
}

export interface GroupOrderListItem {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  sectionId: string;
  sectionName: string;
  unitId: string;
  unitName: string;
  departmentId: string;
  departmentName: string;
  hostId: string;
  hostName: string;
  date: string;
  deadline: string;
  status: GroupOrderStatus;
  qty: number;
  amount: number;
}

interface PopulatedRef {
  _id: Types.ObjectId;
  name: string;
}
interface PopulatedUnit extends PopulatedRef {
  departmentId: PopulatedRef | null;
}

type PopulatedGroupOrderDoc = {
  _id: Types.ObjectId;
  name: string;
  templateId: PopulatedRef | null;
  sectionId?: Types.ObjectId;
  sectionName?: string;
  unitId: PopulatedUnit | null;
  hostId: PopulatedRef | null;
  date: string;
  deadline: string;
  status: GroupOrderStatus;
  lines: OrderLineSubdoc[];
};

function toGroupOrderListItem(d: PopulatedGroupOrderDoc): GroupOrderListItem {
  const totals = orderLineTotals(d.lines);
  return {
    id: String(d._id),
    name: d.name,
    templateId: d.templateId ? String(d.templateId._id) : "",
    templateName: d.templateId?.name ?? "（已刪除模板）",
    sectionId: d.sectionId ? String(d.sectionId) : "",
    sectionName: d.sectionName ?? "",
    unitId: d.unitId ? String(d.unitId._id) : "",
    unitName: d.unitId?.name ?? "（已刪除單位）",
    departmentId: d.unitId?.departmentId ? String(d.unitId.departmentId._id) : "",
    departmentName: d.unitId?.departmentId?.name ?? "",
    hostId: d.hostId ? String(d.hostId._id) : "",
    hostName: d.hostId?.name ?? "（已刪除會員）",
    date: d.date,
    deadline: d.deadline,
    status: d.status,
    qty: totals.qty,
    amount: totals.amount,
  };
}

export async function listGroupOrders(): Promise<GroupOrderListItem[]> {
  await connectMongo();
  await Promise.all([import("@/lib/models/org"), import("@/lib/models/member"), import("@/lib/models/template")]);

  const docs = await GroupOrder.find({})
    .sort({ date: -1, createdAt: -1 })
    .populate<{ templateId: PopulatedRef | null }>("templateId")
    .populate<{ unitId: PopulatedUnit | null }>({ path: "unitId", populate: { path: "departmentId" } })
    .populate<{ hostId: PopulatedRef | null }>("hostId");

  return docs.map((d) => toGroupOrderListItem(d as unknown as PopulatedGroupOrderDoc));
}

/** 給後台總覽儀表板用：只抓某一天（"YYYY/MM/DD"）的團訂。 */
export async function listGroupOrdersByDate(date: string): Promise<GroupOrderListItem[]> {
  await connectMongo();
  await Promise.all([import("@/lib/models/org"), import("@/lib/models/member"), import("@/lib/models/template")]);

  const docs = await GroupOrder.find({ date })
    .sort({ createdAt: 1 })
    .populate<{ templateId: PopulatedRef | null }>("templateId")
    .populate<{ unitId: PopulatedUnit | null }>({ path: "unitId", populate: { path: "departmentId" } })
    .populate<{ hostId: PopulatedRef | null }>("hostId");

  return docs.map((d) => toGroupOrderListItem(d as unknown as PopulatedGroupOrderDoc));
}

export interface GroupOrderDetail extends GroupOrderListItem {
  lines: {
    id: string;
    memberId: string;
    memberName: string;
    itemId: string;
    itemName: string;
    price: number;
    qty: number;
    note: string;
    rice: RiceLevel;
    paymentMethod: string;
    bankCode: string;
    paid: boolean;
  }[];
}

function toGroupOrderDetail(d: PopulatedGroupOrderDoc): GroupOrderDetail {
  const totals = orderLineTotals(d.lines);
  return {
    id: String(d._id),
    name: d.name,
    templateId: d.templateId ? String(d.templateId._id) : "",
    templateName: d.templateId?.name ?? "（已刪除模板）",
    sectionId: d.sectionId ? String(d.sectionId) : "",
    sectionName: d.sectionName ?? "",
    unitId: d.unitId ? String(d.unitId._id) : "",
    unitName: d.unitId?.name ?? "（已刪除單位）",
    departmentId: d.unitId?.departmentId ? String(d.unitId.departmentId._id) : "",
    departmentName: d.unitId?.departmentId?.name ?? "",
    hostId: d.hostId ? String(d.hostId._id) : "",
    hostName: d.hostId?.name ?? "（已刪除會員）",
    date: d.date,
    deadline: d.deadline,
    status: d.status,
    qty: totals.qty,
    amount: totals.amount,
    lines: d.lines.map((l: OrderLineSubdoc) => ({
      id: String(l._id),
      memberId: String(l.memberId),
      memberName: l.memberName,
      itemId: String(l.itemId),
      itemName: l.itemName,
      price: l.price,
      qty: l.qty,
      note: l.note ?? "",
      rice: l.rice,
      paymentMethod: l.paymentMethod ?? "",
      bankCode: l.bankCode ?? "",
      paid: l.paid,
    })),
  };
}

export async function findGroupOrderById(id: string): Promise<GroupOrderDetail | null> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) return null;
  await Promise.all([import("@/lib/models/org"), import("@/lib/models/member"), import("@/lib/models/template")]);

  const d = await GroupOrder.findById(id)
    .populate<{ templateId: PopulatedRef | null }>("templateId")
    .populate<{ unitId: PopulatedUnit | null }>({ path: "unitId", populate: { path: "departmentId" } })
    .populate<{ hostId: PopulatedRef | null }>("hostId");
  if (!d) return null;

  return toGroupOrderDetail(d as unknown as PopulatedGroupOrderDoc);
}

/* ── 依部門彙總（部門負責人視角）用的「單位彙總」頁 ── */

export interface ClusterableTemplate {
  templateId: string;
  templateName: string;
  orders: GroupOrderDetail[];
}

/** 某一天裡有開團的每個模板（不論該模板當天是 1 團還是多團），含完整明細——彙總／匯出頁用。 */
export async function getClusterableTemplatesForDate(date: string): Promise<ClusterableTemplate[]> {
  await connectMongo();
  await Promise.all([import("@/lib/models/org"), import("@/lib/models/member"), import("@/lib/models/template")]);

  const docs = await GroupOrder.find({ date })
    .sort({ createdAt: 1 })
    .populate<{ templateId: PopulatedRef | null }>("templateId")
    .populate<{ unitId: PopulatedUnit | null }>({ path: "unitId", populate: { path: "departmentId" } })
    .populate<{ hostId: PopulatedRef | null }>("hostId");

  const details = docs.map((d) => toGroupOrderDetail(d as unknown as PopulatedGroupOrderDoc));

  const map = new Map<string, ClusterableTemplate>();
  for (const d of details) {
    const existing = map.get(d.templateId);
    if (existing) existing.orders.push(d);
    else map.set(d.templateId, { templateId: d.templateId, templateName: d.templateName, orders: [d] });
  }
  return [...map.values()];
}

export interface CreateGroupOrderInput {
  name: string;
  templateId: string;
  sectionId?: string;
  unitId: string;
  hostId: string;
  date: string;
  deadline?: string;
  status?: GroupOrderStatus;
}

export async function createGroupOrder(input: CreateGroupOrderInput) {
  await connectMongo();
  if (!Types.ObjectId.isValid(input.templateId)) throw new Error("請選擇有效的模板。");
  if (!Types.ObjectId.isValid(input.unitId)) throw new Error("請選擇有效的單位。");
  if (!Types.ObjectId.isValid(input.hostId)) throw new Error("請選擇有效的團主。");
  if (!input.name.trim()) throw new Error("請填寫團名。");
  if (!input.date.trim()) throw new Error("請選擇取餐日期。");

  let sectionName = "";
  if (input.sectionId && Types.ObjectId.isValid(input.sectionId)) {
    const { Template } = await import("@/lib/models/template");
    const tpl = await Template.findById(input.templateId);
    sectionName = tpl?.sections.find((s: { _id: Types.ObjectId }) => String(s._id) === input.sectionId)?.name ?? "";
  }

  const doc = await GroupOrder.create({
    name: input.name,
    templateId: new Types.ObjectId(input.templateId),
    ...(input.sectionId && Types.ObjectId.isValid(input.sectionId)
      ? { sectionId: new Types.ObjectId(input.sectionId), sectionName }
      : {}),
    unitId: new Types.ObjectId(input.unitId),
    hostId: new Types.ObjectId(input.hostId),
    date: input.date,
    deadline: input.deadline ?? "",
    status: input.status ?? "open",
    lines: [],
  });
  return { id: String(doc._id) };
}

export async function setGroupOrdersStatus(ids: string[], status: GroupOrderStatus): Promise<number> {
  await connectMongo();
  const objIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objIds.length === 0) return 0;
  const result = await GroupOrder.updateMany({ _id: { $in: objIds } }, { $set: { status } });
  return result.modifiedCount;
}

/** 團主自己「提前結單／重新開放／調整截止時間」用：一次改狀態＋截止時間（狀態可省略，只改時間）。 */
export async function setGroupOrderStatusAndDeadline(
  id: string,
  patch: { status?: GroupOrderStatus; deadline?: string },
) {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的 id");
  const doc = await GroupOrder.findByIdAndUpdate(id, { $set: patch }, { new: true });
  if (!doc) throw new Error("找不到這個團，可能已被刪除。");
  return { id, status: doc.status, deadline: doc.deadline };
}

/** 結單時用：把選「錢包扣款」但還沒真的扣過款的行，依人彙總金額各扣一次，並標記 walletCharged。
 *  只挑 walletCharged=false 的行，所以同一團重新開放後再結一次單，不會對已扣過的行重複扣款。 */
export async function chargeWalletForGroupOrder(groupOrderId: string): Promise<void> {
  await connectMongo();
  if (!Types.ObjectId.isValid(groupOrderId)) throw new Error("無效的團 id");
  const doc = await GroupOrder.findById(groupOrderId);
  if (!doc) throw new Error("找不到這個團，可能已被刪除。");

  const unchargedLines = doc.lines.filter(
    (l: OrderLineSubdoc) => l.paymentMethod === "錢包扣款" && !l.walletCharged,
  );
  if (unchargedLines.length === 0) return;

  const totalsByMember = new Map<string, number>();
  for (const l of unchargedLines) {
    const key = String(l.memberId);
    totalsByMember.set(key, (totalsByMember.get(key) ?? 0) + l.price * l.qty);
  }

  const { createLedgerEntry } = await import("@/lib/models/wallet");
  for (const [memberId, total] of totalsByMember) {
    if (total <= 0) continue;
    await createLedgerEntry({
      memberId,
      type: "spend",
      amount: -total,
      detail: `開團訂餐扣款．${doc.name}`,
      referenceType: "group_order",
      referenceId: groupOrderId,
    });
  }

  for (const l of unchargedLines) l.walletCharged = true;
  await doc.save();
}

/** 重新開放時用：把已經扣過款的行全部退款＋重設 walletCharged，這樣不管會員在開放期間
 *  改不改訂單、改成什麼，下次結單時 chargeWalletForGroupOrder 都會用當下最新的內容重新算、
 *  重新扣一次——不用另外比對「訂單改了什麼」，用「退款重來」換掉「差異比對」的複雜度。 */
export async function refundWalletForGroupOrder(groupOrderId: string): Promise<void> {
  await connectMongo();
  if (!Types.ObjectId.isValid(groupOrderId)) throw new Error("無效的團 id");
  const doc = await GroupOrder.findById(groupOrderId);
  if (!doc) throw new Error("找不到這個團，可能已被刪除。");

  const chargedLines = doc.lines.filter((l: OrderLineSubdoc) => l.walletCharged);
  if (chargedLines.length === 0) return;

  const totalsByMember = new Map<string, number>();
  for (const l of chargedLines) {
    const key = String(l.memberId);
    totalsByMember.set(key, (totalsByMember.get(key) ?? 0) + l.price * l.qty);
  }

  const { createLedgerEntry } = await import("@/lib/models/wallet");
  for (const [memberId, total] of totalsByMember) {
    if (total <= 0) continue;
    await createLedgerEntry({
      memberId,
      type: "refund",
      amount: total,
      detail: `重新開放退款．${doc.name}`,
      referenceType: "group_order",
      referenceId: groupOrderId,
    });
  }

  for (const l of chargedLines) l.walletCharged = false;
  await doc.save();
}

export async function deleteGroupOrders(ids: string[]): Promise<number> {
  await connectMongo();
  const objIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objIds.length === 0) return 0;
  const result = await GroupOrder.deleteMany({ _id: { $in: objIds } });
  return result.deletedCount;
}

/** 某位會員在這團的點餐內容整批取代（沒有就新增、換掉品項清單就是刪舊建新）——前台確認餐點時用。 */
export async function replaceMemberLines(
  groupOrderId: string,
  memberId: string,
  memberName: string,
  lines: {
    itemId: string;
    itemName: string;
    price: number;
    qty: number;
    note?: string;
    rice: RiceLevel;
    paymentMethod?: string;
    bankCode?: string;
  }[],
) {
  await connectMongo();
  if (!Types.ObjectId.isValid(groupOrderId) || !Types.ObjectId.isValid(memberId)) {
    throw new Error("無效的 id");
  }
  const doc = await GroupOrder.findById(groupOrderId);
  if (!doc) throw new Error("找不到這個團，可能已被刪除。");

  const memberObjId = new Types.ObjectId(memberId);
  doc.lines = doc.lines.filter((l: OrderLineSubdoc) => !l.memberId.equals(memberObjId));
  for (const l of lines) {
    if (l.qty <= 0) continue;
    doc.lines.push({
      memberId: memberObjId,
      memberName,
      itemId: new Types.ObjectId(l.itemId),
      itemName: l.itemName,
      price: l.price,
      qty: l.qty,
      note: l.note ?? "",
      rice: l.rice,
      paymentMethod: l.paymentMethod ?? "",
      bankCode: l.bankCode ?? "",
      paid: false,
      walletCharged: false,
    } as OrderLineSubdoc);
  }
  await doc.save();
  return { id: groupOrderId };
}

/** 「我的訂單」取消單一筆（一道菜）用：這道已經扣過錢包款的話先退款，再把這行從團訂裡移除。
 *  已完成的團不能再取消——那已經是歷史紀錄，不是還在走的訂單。 */
export async function cancelMemberLine(groupOrderId: string, memberId: string, lineId: string) {
  await connectMongo();
  if (
    !Types.ObjectId.isValid(groupOrderId) ||
    !Types.ObjectId.isValid(memberId) ||
    !Types.ObjectId.isValid(lineId)
  ) {
    throw new Error("無效的 id");
  }
  const doc = await GroupOrder.findById(groupOrderId);
  if (!doc) throw new Error("找不到這個團，可能已被刪除。");
  if (doc.status === "completed") throw new Error("這個團已經完成，無法取消訂單。");

  const memberObjId = new Types.ObjectId(memberId);
  const line = doc.lines.find(
    (l: OrderLineSubdoc) => String(l._id) === lineId && l.memberId.equals(memberObjId),
  );
  if (!line) throw new Error("找不到這筆訂單，可能已經被取消過了。");

  if (line.walletCharged) {
    const { createLedgerEntry } = await import("@/lib/models/wallet");
    await createLedgerEntry({
      memberId,
      type: "refund",
      amount: line.price * line.qty,
      detail: `取消訂單退款．${doc.name}．${line.itemName}`,
      referenceType: "group_order",
      referenceId: groupOrderId,
    });
  }

  doc.lines = doc.lines.filter((l: OrderLineSubdoc) => String(l._id) !== lineId);
  await doc.save();
}

export async function toggleLinePaid(groupOrderId: string, lineId: string, paid: boolean) {
  await connectMongo();
  if (!Types.ObjectId.isValid(groupOrderId) || !Types.ObjectId.isValid(lineId)) throw new Error("無效的 id");
  await GroupOrder.updateOne(
    { _id: groupOrderId, "lines._id": lineId },
    { $set: { "lines.$.paid": paid } },
  );
}

/** 一次標記同一個人在這個團裡的所有訂單行——單位彙總頁「點人名切換已付款」用，一個人可能點了不只一筆。 */
export async function setMemberLinesPaid(groupOrderId: string, lineIds: string[], paid: boolean) {
  await connectMongo();
  if (!Types.ObjectId.isValid(groupOrderId)) throw new Error("無效的 id");
  const objIds = lineIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objIds.length === 0) return;
  await GroupOrder.updateOne(
    { _id: groupOrderId },
    { $set: { "lines.$[line].paid": paid } },
    { arrayFilters: [{ "line._id": { $in: objIds } }] },
  );
}

/* ── 依部門彙總（部門負責人視角）── */

export interface DepartmentExportSummary {
  departmentId: string;
  departmentName: string;
  unitCount: number;
  orderCount: number;
  totalQty: number;
  totalAmount: number;
  byUnit: { unitId: string; unitName: string; orderCount: number; qty: number; amount: number }[];
}

export async function departmentExportSummary(departmentId: string): Promise<DepartmentExportSummary | null> {
  await connectMongo();
  if (!Types.ObjectId.isValid(departmentId)) return null;
  const { listDepartments, listUnits } = await import("@/lib/models/org");

  const departments = await listDepartments();
  const dept = departments.find((d) => d.id === departmentId);
  if (!dept) return null;

  const units = await listUnits(departmentId);
  const unitIds = units.map((u) => new Types.ObjectId(u.id));
  const docs = await GroupOrder.find({ unitId: { $in: unitIds } });

  const byUnit = units.map((u) => {
    const orders = docs.filter((d) => String(d.unitId) === u.id);
    const totals = orders.reduce(
      (acc, o) => {
        const t = orderLineTotals(o.lines);
        return { qty: acc.qty + t.qty, amount: acc.amount + t.amount };
      },
      { qty: 0, amount: 0 },
    );
    return { unitId: u.id, unitName: u.name, orderCount: orders.length, qty: totals.qty, amount: totals.amount };
  });

  return {
    departmentId,
    departmentName: dept.name,
    unitCount: byUnit.length,
    orderCount: byUnit.reduce((s, u) => s + u.orderCount, 0),
    totalQty: byUnit.reduce((s, u) => s + u.qty, 0),
    totalAmount: byUnit.reduce((s, u) => s + u.amount, 0),
    byUnit,
  };
}

/* ── 餐點統計（後台「餐點統計」頁用）── */

export interface ItemOrderStat {
  orderCount: number; // 這個品項出現在幾行訂單記錄裡（被訂購次數）
  totalQty: number; // 這個品項總共被點了幾份（總訂購數量）
}

/** 給後台「餐點統計」頁用：一次算出所有品項各自的被訂購次數／總份數，資料來源是所有團訂的 lines。 */
export async function getItemOrderStats(): Promise<Record<string, ItemOrderStat>> {
  await connectMongo();
  const rows = await GroupOrder.aggregate<{ _id: Types.ObjectId; orderCount: number; totalQty: number }>([
    { $unwind: "$lines" },
    { $group: { _id: "$lines.itemId", orderCount: { $sum: 1 }, totalQty: { $sum: "$lines.qty" } } },
  ]);
  return Object.fromEntries(
    rows.map((r) => [String(r._id), { orderCount: r.orderCount, totalQty: r.totalQty }]),
  );
}

/* ── 個人化推薦（你可能喜歡的餐點）── */
// 資料來源就是這個 collection 的 lines——不用另建彙總表，現階段資料量直接現場算就好，
// 之後真的資料量大到查詢變慢，再考慮做成快取。

export interface MemberFrequentItem {
  itemId: string;
  name: string;
  emoji: string;
  price: number;
  orderCount: number; // 這個品項被點過幾次（幾行訂單記錄）
  totalQty: number; // 這個品項總共點了幾份
}

/** 依這位會員過去在所有團訂裡實際點過的品項，統計出點最多次的前 N 個（已下架/被刪除的品項會被排除）。 */
export async function getMemberFrequentItems(memberId: string, limit = 6): Promise<MemberFrequentItem[]> {
  await connectMongo();
  if (!Types.ObjectId.isValid(memberId)) return [];
  const memberObjId = new Types.ObjectId(memberId);

  const rows = await GroupOrder.aggregate<{ _id: Types.ObjectId; orderCount: number; totalQty: number }>([
    { $match: { "lines.memberId": memberObjId } },
    { $unwind: "$lines" },
    { $match: { "lines.memberId": memberObjId } },
    { $group: { _id: "$lines.itemId", orderCount: { $sum: 1 }, totalQty: { $sum: "$lines.qty" } } },
    { $sort: { totalQty: -1, orderCount: -1 } },
    { $limit: limit },
  ]);
  if (rows.length === 0) return [];

  const { CatalogItem } = await import("@/lib/models/catalog-item");
  const itemDocs = await CatalogItem.find({ _id: { $in: rows.map((r) => r._id) }, active: true });
  const itemById = new Map(itemDocs.map((d) => [String(d._id), d]));

  return rows
    .filter((r) => itemById.has(String(r._id)))
    .map((r) => {
      const item = itemById.get(String(r._id))!;
      return {
        itemId: String(r._id),
        name: item.name,
        emoji: item.emoji,
        price: item.price,
        orderCount: r.orderCount,
        totalQty: r.totalQty,
      };
    });
}

/** 這位會員累積訂餐次數（成就系統用）：帳號註冊至今，所有團訂裡屬於他的訂單行數總和。 */
export async function getMemberOrderCount(memberId: string): Promise<number> {
  await connectMongo();
  if (!Types.ObjectId.isValid(memberId)) return 0;
  const memberObjId = new Types.ObjectId(memberId);

  const rows = await GroupOrder.aggregate<{ count: number }>([
    { $match: { "lines.memberId": memberObjId } },
    { $unwind: "$lines" },
    { $match: { "lines.memberId": memberObjId } },
    { $count: "count" },
  ]);
  return rows[0]?.count ?? 0;
}

/* ── 我的訂單（前台）── */

export interface MemberOrderLine {
  lineId: string;
  groupOrderId: string;
  groupOrderName: string;
  templateName: string;
  itemName: string;
  qty: number;
  price: number;
  date: string; // 團訂的取餐日期 "YYYY/MM/DD"
  status: GroupOrderStatus; // 直接沿用團訂狀態——這個 app 沒有另外的逐筆訂單審核流程
}

/** 「我的訂單」頁用：這位會員在所有團訂裡點過的每一行，含團訂本身的狀態／日期，新到舊排序。 */
export async function listMemberOrderLines(memberId: string): Promise<MemberOrderLine[]> {
  await connectMongo();
  if (!Types.ObjectId.isValid(memberId)) return [];
  const memberObjId = new Types.ObjectId(memberId);

  const docs = await GroupOrder.find({ "lines.memberId": memberObjId })
    .sort({ date: -1, createdAt: -1 })
    .populate<{ templateId: PopulatedRef | null }>("templateId");

  const rows: MemberOrderLine[] = [];
  for (const d of docs) {
    const templateName = (d.templateId as unknown as PopulatedRef | null)?.name ?? "（已刪除模板）";
    for (const l of d.lines as OrderLineSubdoc[]) {
      if (!l.memberId.equals(memberObjId)) continue;
      rows.push({
        lineId: String(l._id),
        groupOrderId: String(d._id),
        groupOrderName: d.name,
        templateName,
        itemName: l.itemName,
        qty: l.qty,
        price: l.price,
        date: d.date,
        status: d.status,
      });
    }
  }
  return rows;
}
