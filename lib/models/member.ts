import bcrypt from "bcryptjs";
import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";
import { listDepartments, listUnits } from "@/lib/models/org";

export type MemberStatus = "pending" | "active" | "suspended";

/**
 * member collection —— 真實使用者資料，目前只處理註冊／登入需要的欄位
 * （角色/錢包/遊戏化等其他會員功能之後再擴充，這裡先不加）。
 * email / account / employeeId 三個欄位建了唯一索引，密碼一律只存 bcrypt hash
 * （passwordHash 設 select: false，一般查詢預設不會撈出來，避免不小心外流）。
 * dept / unit 存的是 department / unit collection 的 ObjectId（見 org.ts），
 * 對外的函式（listMembers / findMemberById）會把這兩個 id 轉回名稱字串再回傳，
 * 讓既有的表單/表格程式碼不用跟著改。
 */
export interface MemberDocument {
  _id: Types.ObjectId;
  account: string; // 登入帳號，目前用 email 的帳號部分
  email: string; // 公司 Email，登入用
  passwordHash: string; // bcrypt hash，絕不存明文密碼
  name: string;
  employeeId: string; // 員工編號
  departmentId: Types.ObjectId; // 部門（關聯 department._id）
  unitId: Types.ObjectId; // 單位（關聯 unit._id）
  memberCode: string; // 註冊時系統配發的個人專屬碼：2 碼英文＋6 碼數字，隨機產生
  role: string; // 權限／角色，註冊時一律預設「一般使用者」（填對管理員邀請碼則例外），後續由管理員調整
  referredByCode?: string; // 註冊時輸入的邀請碼若對到某位會員的專屬碼，記下那組碼（推薦人）
  referredByName?: string; // 推薦人當下的姓名快照，避免之後推薦人改名要多查一次
  status: MemberStatus; // 註冊後直接是 active，不需審核；suspended：停權不可登入；pending 保留給未來若需要審核流程時用
  balance: number; // 錢包餘額快取；異動一律透過 wallet_ledger 的 createLedgerEntry 寫入，不直接改這個欄位
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

const memberSchema = new Schema<MemberDocument>(
  {
    account: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    employeeId: { type: String, required: true, unique: true, trim: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    unitId: { type: Schema.Types.ObjectId, ref: "Unit", required: true },
    memberCode: { type: String, required: true, unique: true },
    role: { type: String, required: true, default: "一般使用者" },
    referredByCode: { type: String },
    referredByName: { type: String },
    status: {
      type: String,
      enum: ["pending", "active", "suspended"],
      required: true,
      default: "active",
    },
    lastLoginAt: { type: Date },
    balance: { type: Number, required: true, default: 0 },
  },
  { timestamps: true, collection: "member" },
);

export const Member = models.Member ?? model<MemberDocument>("Member", memberSchema);

/** /register 表單送出時實際收到的欄位（dept/unit 是名稱字串，內部再解析成 id）。 */
export interface NewMemberInput {
  email: string;
  password: string; // 明文，只在伺服器端用來產生 hash，不落地儲存
  name: string;
  employeeId: string;
  dept: string;
  unit: string;
  role?: string; // 不傳就用預設「一般使用者」；填對管理員邀請碼時由呼叫端帶入「超級管理員」
  referredByCode?: string; // 邀請碼對到某位會員的專屬碼時帶入
  referredByName?: string;
  status?: MemberStatus; // 不傳就預設 active；後台新增會員時可由管理員指定
}

/** 部門/單位名稱字串轉成 department/unit 的 ObjectId；名稱對不到任何一筆就丟錯。 */
async function resolveDeptUnit(
  deptName: string,
  unitName: string,
): Promise<{ departmentId: Types.ObjectId; unitId: Types.ObjectId }> {
  const departments = await listDepartments();
  const dept = departments.find((d) => d.name === deptName);
  if (!dept) throw new Error("請選擇有效的部門。");

  const units = await listUnits(dept.id);
  const unit = units.find((u) => u.name === unitName);
  if (!unit) throw new Error("請選擇有效的單位。");

  return { departmentId: new Types.ObjectId(dept.id), unitId: new Types.ObjectId(unit.id) };
}

const MEMBER_CODE_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function generateMemberCode(): string {
  const letters = Array.from(
    { length: 2 },
    () => MEMBER_CODE_LETTERS[Math.floor(Math.random() * MEMBER_CODE_LETTERS.length)],
  ).join("");
  const digits = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
  return `${letters}${digits}`;
}

/** 隨機抽一組沒被用過的專屬碼；撞號機率極低，抽到就重試，抽太多次還是撞號就直接報錯。 */
async function generateUniqueMemberCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = generateMemberCode();
    const existing = await Member.findOne({ memberCode: code });
    if (!existing) return code;
  }
  throw new Error("專屬碼產生失敗，請稍後再試。");
}

/** 建立新使用者：hash 密碼、配發專屬碼、解析部門單位、補系統欄位，寫入 member；email/account/employeeId 重複會因唯一索引擲出錯誤。 */
export async function createMember(input: NewMemberInput) {
  await connectMongo();
  const passwordHash = await bcrypt.hash(input.password, 10);
  const memberCode = await generateUniqueMemberCode();
  const { departmentId, unitId } = await resolveDeptUnit(input.dept, input.unit);

  return Member.create({
    account: input.email.split("@")[0],
    email: input.email,
    passwordHash,
    name: input.name,
    employeeId: input.employeeId,
    departmentId,
    unitId,
    memberCode,
    role: input.role ?? "一般使用者", // 註冊一律先給一般使用者，權限之後由管理員調整
    ...(input.referredByCode ? { referredByCode: input.referredByCode } : {}),
    ...(input.referredByName ? { referredByName: input.referredByName } : {}),
    status: input.status ?? "active", // 註冊後不需要審核，直接可用；後台建立可指定其他狀態
  });
}

/** 依專屬碼查會員：註冊時判斷輸入的邀請碼是不是某位會員的專屬碼（推薦碼）用。 */
export async function findMemberByCode(code: string) {
  await connectMongo();
  return Member.findOne({ memberCode: code });
}

interface PopulatedOrgRef {
  _id: Types.ObjectId;
  name: string;
}

/** 給會員洞察詳細頁／編輯頁用：部門單位已解析成名稱字串，欄位形狀跟 MemberListItem 一致。 */
export interface MemberDetail {
  _id: Types.ObjectId;
  account: string;
  email: string;
  name: string;
  employeeId: string;
  dept: string;
  unit: string;
  unitId: string;
  memberCode: string;
  role: string;
  referredByCode?: string;
  referredByName?: string;
  status: MemberStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

/** 依 _id 查單一會員（給會員洞察詳細頁/編輯頁用）；id 格式不對或查無資料回傳 null。 */
export async function findMemberById(id: string): Promise<MemberDetail | null> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = await Member.findById(id).populate<{
    departmentId: PopulatedOrgRef;
    unitId: PopulatedOrgRef;
  }>(["departmentId", "unitId"]);
  if (!doc) return null;

  return {
    _id: doc._id,
    account: doc.account,
    email: doc.email,
    name: doc.name,
    employeeId: doc.employeeId,
    dept: doc.departmentId?.name ?? "",
    unit: doc.unitId?.name ?? "",
    unitId: doc.unitId?._id ? String(doc.unitId._id) : "",
    memberCode: doc.memberCode,
    role: doc.role,
    referredByCode: doc.referredByCode,
    referredByName: doc.referredByName,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    lastLoginAt: doc.lastLoginAt,
  };
}

export interface MemberListItem {
  id: string;
  account: string;
  email: string;
  name: string;
  employeeId: string;
  dept: string;
  unit: string;
  memberCode: string;
  role?: string;
  referredByCode?: string;
  referredByName?: string;
  status: MemberStatus;
  createdAt: Date;
  lastLoginAt?: Date;
}

/** 後台會員列表用：真實會員資料，最新建立的排前面，拿掉 passwordHash，部門單位解析成名稱字串。 */
export async function listMembers(): Promise<MemberListItem[]> {
  await connectMongo();
  const docs = await Member.find({})
    .sort({ createdAt: -1 })
    .populate<{ departmentId: PopulatedOrgRef; unitId: PopulatedOrgRef }>(["departmentId", "unitId"]);

  return docs.map((d) => ({
    id: String(d._id),
    account: d.account,
    email: d.email,
    name: d.name,
    employeeId: d.employeeId,
    dept: d.departmentId?.name ?? "",
    unit: d.unitId?.name ?? "",
    memberCode: d.memberCode,
    role: d.role,
    referredByCode: d.referredByCode,
    referredByName: d.referredByName,
    createdAt: d.createdAt,
    status: d.status,
    lastLoginAt: d.lastLoginAt,
  }));
}

export interface UpdateMemberInput {
  name: string;
  email: string;
  employeeId: string;
  dept: string;
  unit: string;
  role: string;
  status: MemberStatus;
  password?: string; // 明文，只有管理員填了新密碼才會帶入；留空就不動 passwordHash
}

/** 後台編輯會員用：更新基本資料／部門單位／權限／狀態；填了 password 才順便重設密碼。 */
export async function updateMember(id: string, input: UpdateMemberInput) {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的會員 id");
  const { departmentId, unitId } = await resolveDeptUnit(input.dept, input.unit);
  const account = input.email.split("@")[0];
  const passwordHash = input.password ? await bcrypt.hash(input.password, 10) : undefined;

  return Member.findByIdAndUpdate(
    id,
    {
      $set: {
        name: input.name,
        email: input.email,
        account,
        employeeId: input.employeeId,
        departmentId,
        unitId,
        role: input.role,
        status: input.status,
        ...(passwordHash ? { passwordHash } : {}),
      },
    },
    { returnDocument: "after" },
  );
}

/** 後台會員列表用：批次改狀態（啟用／停用），回傳實際改到的筆數。 */
export async function setMembersStatus(ids: string[], status: MemberStatus): Promise<number> {
  await connectMongo();
  const objIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objIds.length === 0) return 0;
  const result = await Member.updateMany({ _id: { $in: objIds } }, { $set: { status } });
  return result.modifiedCount;
}

/** 後台刪除會員用：直接刪除該筆 member 文件。 */
export async function deleteMember(id: string) {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的會員 id");
  const result = await Member.deleteOne({ _id: new Types.ObjectId(id) });
  return result.deletedCount > 0;
}

/** 後台會員列表「刪除選取」用：一次刪多筆，忽略格式不對的 id，回傳實際刪除的筆數。 */
export async function deleteMembers(ids: string[]): Promise<number> {
  await connectMongo();
  const objIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objIds.length === 0) return 0;
  const result = await Member.deleteMany({ _id: { $in: objIds } });
  return result.deletedCount;
}

export interface LoginMember {
  _id: Types.ObjectId;
  account: string;
  email: string;
  name: string;
  role: string;
  status: MemberStatus;
}

export type LoginResult =
  | { ok: true; member: LoginMember }
  | { ok: false; reason: "not_found" | "wrong_password" | "pending" | "suspended" };

/** 登入驗證：查 email、比對密碼、檢查帳號狀態，成功的話更新 lastLoginAt。 */
export async function verifyLogin(email: string, password: string): Promise<LoginResult> {
  await connectMongo();
  const found = await Member.findOne({ email }).select("+passwordHash");
  if (!found) return { ok: false, reason: "not_found" };

  const valid = await bcrypt.compare(password, found.passwordHash);
  if (!valid) return { ok: false, reason: "wrong_password" };

  if (found.status === "pending") return { ok: false, reason: "pending" };
  if (found.status === "suspended") return { ok: false, reason: "suspended" };

  found.lastLoginAt = new Date();
  await found.save();

  return {
    ok: true,
    member: {
      _id: found._id,
      account: found.account,
      email: found.email,
      name: found.name,
      role: found.role,
      status: found.status,
    },
  };
}
