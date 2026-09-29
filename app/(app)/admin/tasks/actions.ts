"use server";

import { revalidatePath } from "next/cache";
import {
  createDailyTask,
  updateDailyTask,
  deleteDailyTask,
  deleteDailyTasks,
  createExpRule,
  updateExpRule,
  deleteExpRule,
  deleteExpRules,
  createMemberLevel,
  updateMemberLevel,
  deleteMemberLevel,
  deleteMemberLevels,
  type DailyTaskPatch,
  type ExpRulePatch,
} from "@/lib/models/gamification";
import { requireAdminPermission } from "@/lib/admin-guard";

function refresh() {
  revalidatePath("/admin/tasks");
  revalidatePath("/account");
}

export async function createDailyTaskAction() {
  await requireAdminPermission("gamification");
  const task = await createDailyTask();
  refresh();
  return task;
}

export async function updateDailyTaskAction(id: string, patch: DailyTaskPatch) {
  await requireAdminPermission("gamification");
  await updateDailyTask(id, patch);
  refresh();
}

export async function deleteDailyTaskAction(id: string) {
  await requireAdminPermission("gamification");
  await deleteDailyTask(id);
  refresh();
}

export async function deleteDailyTasksAction(ids: string[]) {
  await requireAdminPermission("gamification");
  await deleteDailyTasks(ids);
  refresh();
}

export async function createExpRuleAction() {
  await requireAdminPermission("gamification");
  const rule = await createExpRule();
  refresh();
  return rule;
}

export async function updateExpRuleAction(id: string, patch: ExpRulePatch) {
  await requireAdminPermission("gamification");
  await updateExpRule(id, patch);
  refresh();
}

export async function deleteExpRuleAction(id: string) {
  await requireAdminPermission("gamification");
  await deleteExpRule(id);
  refresh();
}

export async function deleteExpRulesAction(ids: string[]) {
  await requireAdminPermission("gamification");
  await deleteExpRules(ids);
  refresh();
}

export async function createMemberLevelAction() {
  await requireAdminPermission("gamification");
  const level = await createMemberLevel();
  refresh();
  return level;
}

export async function updateMemberLevelAction(id: string, patch: { name?: string; minExp?: number }) {
  await requireAdminPermission("gamification");
  await updateMemberLevel(id, patch);
  refresh();
}

export async function deleteMemberLevelAction(id: string) {
  await requireAdminPermission("gamification");
  await deleteMemberLevel(id);
  refresh();
}

export async function deleteMemberLevelsAction(ids: string[]) {
  await requireAdminPermission("gamification");
  await deleteMemberLevels(ids);
  refresh();
}
