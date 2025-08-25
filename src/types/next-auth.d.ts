import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    oauth?: {
      provider: "google" | "github";
      accessToken?: string;
      idToken?: string;
    };
    user: {
      id: string;
      email: string;
      name?: string | null;
      roles?: string[];
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    accessToken?: string;
    roles?: string[];
    displayName?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    oauth?: {
      provider: "google" | "github";
      accessToken?: string;
      idToken?: string;
    };
    user?: {
      id: string;
      email: string;
      name?: string | null;
      roles?: string[];
    };
  }
}
