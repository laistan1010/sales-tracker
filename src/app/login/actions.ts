"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

export async function loginAs(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const userId   = formData.get("userId")   as string;
  const password = formData.get("password") as string | null;
  try {
    await signIn("credentials", { userId, password: password ?? "", redirectTo: "/" });
    return {};
  } catch (e) {
    if (e instanceof AuthError) return { error: "密碼錯誤，請重試。" };
    throw e;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
