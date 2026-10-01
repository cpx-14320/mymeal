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
  email: string; // 登入帳號，4-20 碼英數字、第一碼限英文字母、不分大小寫（欄位名沿用 email，但不要求信箱格式，見 parseMemberForm）
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
  avatarUrl?: string; // 會員自行上傳的大頭貼，見 setMemberAvatar
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

const memberSchema = new Schema<MemberDocument>(
  {
    account: { type: String, required: true, unique: true, trim: true, lowercase: true },
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
    avatarUrl: { type: String },
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

export interface ParsedMemberForm {
  email: string;
  password: string;
  name: string;
  employeeId: string;
  dept: string;
  unit: string;
  inviteCode: string; // 原始輸入，兩邊各自決定怎麼用（前台的邀請碼可以換管理員角色，後台不行）
  referredByCode?: string;
  referredByName?: string;
}

export type ParsedMemberFormResult = { ok: false; error: string } | { ok: true; fields: ParsedMemberForm };

// 帳號：4-20 碼，第一碼限英文字母，其餘英數混合，不分大小寫（schema 的 lowercase:true 存檔時會轉小寫）。
const ACCOUNT_RE = /^[A-Za-z][A-Za-z0-9]{3,19}$/;
// 員工編號：4-20 碼英數混合，不限首碼。
const EMPLOYEE_ID_RE = /^[A-Za-z0-9]{4,20}$/;
// 姓名：2-20 碼中英文，字間允許單一空白（複姓/英文名），不允許數字、符號、emoji、連續或前後空白。
const NAME_RE = /^[A-Za-z一-龥]+(?: [A-Za-z一-龥]+)*$/;
// 密碼：8-20 碼，只能是英數字加常見符號；英文與數字兩者都要有，大小寫、符號是否使用不強制。
const PASSWORD_SYMBOLS = "!@#$%^&*()_+=-";
const PASSWORD_CHARSET_RE = /^[A-Za-z0-9!@#$%^&*()_+=-]{8,20}$/;

/**
 * /register 跟後台新增會員共用的表單解析：必填檢查、帳號／員工編號／姓名格式、密碼長度與
 * 組成／兩次輸入一致、部門單位是否真的存在、邀請碼是否對到某位會員的專屬碼（推薦人）。兩邊
 * 欄位順序/名稱刻意做成一致（見 register-form.tsx／member-create-form.tsx），改驗證規則只
 * 要改這裡，不用兩邊同步改。後台「編輯會員」(admin/members/[id]/actions.ts) 刻意不走這個函式，
 * 舊帳號不受這裡新增的格式規則影響。
 */
export async function parseMemberForm(formData: FormData): Promise<ParsedMemberFormResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const employeeId = String(formData.get("employeeId") ?? "").trim();
  const dept = String(formData.get("dept") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const inviteCode = String(formData.get("inviteCode") ?? "").trim();

  if (!email || !password || !name || !employeeId || !dept || !unit) {
    return { ok: false, error: "請填寫所有必填欄位。" };
  }
  if (!ACCOUNT_RE.test(email)) {
    return { ok: false, error: "帳號需為 4-20 碼英數字，且第一碼須為英文字母。" };
  }
  if (!EMPLOYEE_ID_RE.test(employeeId)) {
    return { ok: false, error: "員工編號需為 4-20 碼英數字。" };
  }
  if (name.length < 2 || name.length > 20 || !NAME_RE.test(name)) {
    return { ok: false, error: "姓名需為 2-20 個中文或英文字，不可包含數字或符號。" };
  }
  if (!PASSWORD_CHARSET_RE.test(password)) {
    return {
      ok: false,
      error: `密碼需為 8-20 碼，只能包含英文字母、數字與常見符號（${PASSWORD_SYMBOLS}）。`,
    };
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return { ok: false, error: "密碼需同時包含英文字母與數字。" };
  }
  if (password.toLowerCase() === email.toLowerCase()) {
    return { ok: false, error: "密碼不可與帳號相同。" };
  }
  if (password !== confirmPassword) {
    return { ok: false, error: "兩次輸入的密碼不一致。" };
  }
  if (inviteCode && (inviteCode.length < 4 || inviteCode.length > 20)) {
    return { ok: false, error: "邀請碼需為 4-20 碼。" };
  }

  const departments = await listDepartments();
  const matchedDept = departments.find((d) => d.name === dept);
  if (!matchedDept) {
    return { ok: false, error: "請選擇有效的部門。" };
  }
  const units = await listUnits(matchedDept.id);
  if (!units.some((u) => u.name === unit)) {
    return { ok: false, error: "請選擇有效的單位。" };
  }

  const referrer = inviteCode ? await findMemberByCode(inviteCode.toUpperCase()) : null;

  return {
    ok: true,
    fields: {
      email,
      password,
      name,
      employeeId,
      dept,
      unit,
      inviteCode,
      referredByCode: referrer?.memberCode,
      referredByName: referrer?.name,
    },
  };
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
  avatarUrl?: string;
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
    avatarUrl: doc.avatarUrl,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    lastLoginAt: doc.lastLoginAt,
  };
}

/** Header 頭像用：只需要 avatarUrl 這一個欄位，不用像 findMemberById 一樣多 populate 部門/單位。 */
export async function getMemberAvatarUrl(memberId: string): Promise<string | undefined> {
  await connectMongo();
  if (!Types.ObjectId.isValid(memberId)) return undefined;
  const doc = await Member.findById(memberId).select("avatarUrl");
  return doc?.avatarUrl;
}

/** 會員自行在會員中心上傳大頭貼後寫入；檔名固定用會員自己的 _id 命名並 allowOverwrite，
 *  見 app/(app)/account/actions.ts 的 uploadAvatarAction，同一人重新上傳一律覆蓋舊檔。 */
export async function setMemberAvatar(memberId: string, avatarUrl: string): Promise<void> {
  await connectMongo();
  if (!Types.ObjectId.isValid(memberId)) throw new Error("無效的會員 id");
  await Member.findByIdAndUpdate(memberId, { $set: { avatarUrl } });
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

/**
 * 刪除會員本體。真的刪除（不是停權）——呼叫端（見 admin/members/actions.ts 的
 * deleteMembersAction）要先清掉這位會員自己的收藏／評論／意見回饋／團訂點餐紀錄；
 * 錢包流水帳／儲值申請刻意不動，那兩份是 append-only 的財務紀錄，本來就設計成
 * 會員被刪也留著、用「（已刪除會員）」顯示，不因為這裡刪會員就跟著消失。
 */
export async function deleteMembers(ids: string[]): Promise<number> {
  await connectMongo();
  const objIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objIds.length === 0) return 0;
  const result = await Member.deleteMany({ _id: { $in: objIds } });
  return result.deletedCount;
}

/** 稽核紀錄用：把一批 id 換成姓名，方便寫「操作對象」欄位；忽略格式不對或找不到的 id。 */
export async function findMemberNames(ids: string[]): Promise<string[]> {
  await connectMongo();
  const objIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objIds.length === 0) return [];
  const docs = await Member.find({ _id: { $in: objIds } }, { name: 1 });
  return docs.map((d) => d.name);
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
  // 帳號不分大小寫，查詢前先轉小寫比對（存檔時 schema 也會自動轉小寫，見 memberSchema 的 email/account 欄位）。
  const found = await Member.findOne({ email: email.toLowerCase() }).select("+passwordHash");
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

export type ChangePasswordResult = { ok: true } | { ok: false; error: string };

/** 會員登入後自行改密碼：驗證目前密碼正確、新密碼格式符合規則、新密碼不可與帳號或目前密碼相同才覆蓋。 */
export async function changeMemberPassword(
  memberId: string,
  oldPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> {
  await connectMongo();
  if (!Types.ObjectId.isValid(memberId)) return { ok: false, error: "無效的會員 id" };

  const found = await Member.findById(memberId).select("+passwordHash");
  if (!found) return { ok: false, error: "找不到會員資料。" };

  const valid = await bcrypt.compare(oldPassword, found.passwordHash);
  if (!valid) return { ok: false, error: "目前密碼不正確。" };

  if (!PASSWORD_CHARSET_RE.test(newPassword)) {
    return {
      ok: false,
      error: `新密碼需為 8-20 碼，只能包含英文字母、數字與常見符號（${PASSWORD_SYMBOLS}）。`,
    };
  }
  if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
    return { ok: false, error: "新密碼需同時包含英文字母與數字。" };
  }
  if (newPassword.toLowerCase() === found.account.toLowerCase()) {
    return { ok: false, error: "新密碼不可與帳號相同。" };
  }
  if (newPassword === oldPassword) {
    return { ok: false, error: "新密碼不可與目前密碼相同。" };
  }

  found.passwordHash = await bcrypt.hash(newPassword, 10);
  await found.save();
  return { ok: true };
}
