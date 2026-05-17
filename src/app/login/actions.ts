"use server";

import { signIn, signOut } from "@/auth";

export async function loginAs(formData: FormData) {
  const userId = formData.get("userId") as string;
  await signIn("credentials", { userId, redirectTo: "/" });
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
