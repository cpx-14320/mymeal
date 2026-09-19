import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";

/** order_zones collection —— 前台一個專區＝一個頁面（/z/{slug}），可套用多個模板。 */
export interface OrderZoneDocument {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  icon: string;
  templateIds: Types.ObjectId[]; // ref Template，多對多
  active: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const orderZoneSchema = new Schema<OrderZoneDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "" },
    templateIds: { type: [Schema.Types.ObjectId], ref: "Template", required: true, default: [] },
    active: { type: Boolean, required: true, default: true },
    sortOrder: { type: Number, required: true, default: 0 },
  },
  { timestamps: true, collection: "order_zones" },
);

export const OrderZone = models.OrderZone ?? model<OrderZoneDocument>("OrderZone", orderZoneSchema);

export interface OrderZoneInput {
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  templateIds: string[];
  active?: boolean;
}

export interface OrderZoneView {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  templateIds: string[];
  active: boolean;
  sortOrder: number;
}

function toView(d: {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  icon: string;
  templateIds: Types.ObjectId[];
  active: boolean;
  sortOrder: number;
}): OrderZoneView {
  return {
    id: String(d._id),
    name: d.name,
    slug: d.slug,
    description: d.description,
    icon: d.icon,
    templateIds: d.templateIds.map(String),
    active: d.active,
    sortOrder: d.sortOrder,
  };
}

export async function listOrderZones(): Promise<OrderZoneView[]> {
  await connectMongo();
  const docs = await OrderZone.find({}).sort({ sortOrder: 1, createdAt: 1 });
  return docs.map(toView);
}

export async function findOrderZoneById(id: string): Promise<OrderZoneView | null> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = await OrderZone.findById(id);
  return doc ? toView(doc) : null;
}

function buildDoc(input: OrderZoneInput) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description,
    icon: input.icon,
    sortOrder: input.sortOrder,
    templateIds: input.templateIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id)),
    active: input.active ?? true,
  };
}

export async function createOrderZone(input: OrderZoneInput) {
  await connectMongo();
  const existing = await OrderZone.findOne({ slug: input.slug });
  if (existing) throw new Error("這個代稱（slug）已經被使用了。");
  const doc = await OrderZone.create(buildDoc(input));
  return { id: String(doc._id) };
}

export async function updateOrderZone(id: string, input: OrderZoneInput) {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的專區 id");
  const existing = await OrderZone.findOne({ slug: input.slug, _id: { $ne: id } });
  if (existing) throw new Error("這個代稱（slug）已經被使用了。");
  return OrderZone.findByIdAndUpdate(id, { $set: buildDoc(input) }, { returnDocument: "after" });
}

export async function setOrderZonesActive(ids: string[], active: boolean): Promise<number> {
  await connectMongo();
  const objIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objIds.length === 0) return 0;
  const result = await OrderZone.updateMany({ _id: { $in: objIds } }, { $set: { active } });
  return result.modifiedCount;
}

export async function deleteOrderZones(ids: string[]): Promise<number> {
  await connectMongo();
  const objIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objIds.length === 0) return 0;
  const result = await OrderZone.deleteMany({ _id: { $in: objIds } });
  return result.deletedCount;
}
