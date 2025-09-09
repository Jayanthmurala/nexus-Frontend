import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
      authorization: { params: { scope: "read:user user:email" } },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        accessToken: { label: "Access Token", type: "text" },
        user: { label: "User JSON", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.accessToken || !credentials?.user) return null;
        try {
          const user = JSON.parse(credentials.user as string);
          return { ...user, accessToken: credentials.accessToken as string } as any;
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile, trigger, session }) {
      // Credentials flow: we pass accessToken + user JSON into signIn
      if (user && (user as any).accessToken) {
        const u = user as any;
        (token as any).accessToken = u.accessToken;
        (token as any).user = {
          id: u.id,
          email: u.email,
          name: u.displayName ?? u.name ?? null,
          roles: u.roles ?? [],
          collegeId: u.collegeId,
          department: u.department,
          year: u.year,
          collegeMemberId: u.collegeMemberId,
          avatarUrl: u.avatarUrl,
        };
        // Clear any previously stashed oauth metadata
        (token as any).oauth = undefined;
      } else if (user && account) {
        // OAuth flow: we only have provider identity. No backend access token yet.
        const id = (user as any).id || (profile as any)?.sub || (token as any).sub || "";
        (token as any).user = {
          id,
          email: (user as any).email,
          name: (user as any).name ?? null,
          roles: [],
        };
        // Stash provider token(s) to allow client-side exchange with backend
        (token as any).oauth = {
          provider: account.provider,
          accessToken: (account as any).access_token,
          idToken: (account as any).id_token,
        };
      }
      if (trigger === "update" && (session as any)?.accessToken) {
        (token as any).accessToken = (session as any).accessToken;
      }
      return token as any;
    },
    async session({ session, token }) {
      (session as any).accessToken = (token as any).accessToken;
      (session as any).user = (token as any).user || session.user;
      (session as any).oauth = (token as any).oauth;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
