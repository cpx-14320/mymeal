"use server";

import { revalidatePath } from "next/cache";
import {
  createDailyTask,
  updateDailyTask,
  deleteDailyTask,
  createExpRule,
  updateExpRule,
  deleteExpRule,
  createMemberLevel,
  updateMemberLevel,
  deleteMemberLevel,
  type DailyTaskPatch,
  type ExpRulePatch,
} from "@/lib/models/gamification";

function refresh() {
  revalidatePath("/admin/tasks");
  revalidatePath("/account");
}

export async function createDailyTaskAction() {
  const task = await createDailyTask();
  refresh();
  return task;
}

export async function updateDailyTaskAction(id: string, patch: DailyTaskPatch) {
  await updateDailyTask(id, patch);
  refresh();
}

export async function deleteDailyTaskAction(id: string) {
  await deleteDailyTask(id);
  refresh();
}

export async function createExpRuleAction() {
  const rule = await createExpRule();
  refresh();
  return rule;
}

export async function updateExpRuleAction(id: string, patch: ExpRulePatch) {
  await updateExpRule(id, patch);
  refresh();
}

export async function deleteExpRuleAction(id: string) {
  await deleteExpRule(id);
  refresh();
}

export async function createMemberLevelAction() {
  const level = await createMemberLevel();
  refresh();
  return level;
}

export async function updateMemberLevelAction(id: string, patch: { name?: string; minExp?: number }) {
  await updateMemberLevel(id, patch);
  refresh();
}

export async function deleteMemberLevelAction(id: string) {
  await deleteMemberLevel(id);
  refresh();
}
