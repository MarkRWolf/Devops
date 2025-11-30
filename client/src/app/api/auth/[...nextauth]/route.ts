import NextAuth, { type NextAuthOptions, Session } from "next-auth";

const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "ory-hydra",
      name: "ORY Hydra",
      type: "oauth",
      clientId: process.env.ORY_HYDRA_CLIENT_ID || "",
      clientSecret: process.env.ORY_HYDRA_CLIENT_SECRET || "",
      authorization: "http://localhost/hydra/oauth2/auth",
      token: "http://hydra:4444/oauth2/token",
      userinfo: "http://hydra:4444/userinfo",
      profile(profile) {
        return {
          id: profile.sub,
        };
      },
    },
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.accessToken) {
        (session as Session).accessToken = token.accessToken as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

