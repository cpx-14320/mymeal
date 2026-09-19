import type { Metadata } from "next";
import { RegisterForm } from "./register-form";
import { listDepartments, listUnits } from "@/lib/models/org";

export const metadata: Metadata = { title: "申請帳號" };

export default async function RegisterPage() {
  const [departments, units] = await Promise.all([listDepartments(), listUnits()]);
  return <RegisterForm departments={departments} units={units} />;
}
