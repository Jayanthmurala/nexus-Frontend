"use client";
import http from "@/lib/http";

export type MeResponse = {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  avatarUrl?: string | null;
  collegeId?: string;
  department?: string;
  year?: number;
  collegeMemberId?: string;
};

export async function getMe() {
  try {
    const res = await http.get<MeResponse>("/v1/auth/me");
    return { ok: true, status: res.status, data: res.data, response: res } as any;
  } catch (err: any) {
    const status = err?.response?.status ?? 0;
    return { ok: false, status, data: null, response: err?.response } as any;
  }
}
