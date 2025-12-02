import { type NextAuthOptions } from "next-auth";

const hydraInternal = process.env.ORY_HYDRA_INTERNAL_URL || "http://hydra:4444";
const hydraIssuer = hydraInternal.endsWith("/")
  ? hydraInternal
  : hydraInternal + "/";
const hydraPublic = process.env.ORY_HYDRA_PUBLIC_URL || "http://localhost/hydra";

export const authOptions: NextAuthOptions = {
  debug: true,
  providers: [
    {
      id: "hydra",
      name: "ORY Hydra",
      type: "oauth",
      issuer: hydraIssuer,
      jwks_endpoint: `${hydraInternal}/.well-known/jwks.json`,
      clientId: process.env.ORY_HYDRA_CLIENT_ID || "",
      clientSecret: process.env.ORY_HYDRA_CLIENT_SECRET || "",
      authorization: {
        url: `${hydraPublic}/oauth2/auth`,
        params: {
          scope: "openid offline_access profile email",
        },
      },
      token: `${hydraInternal}/oauth2/token`,
      userinfo: `${hydraInternal}/userinfo`,
      checks: ["pkce", "state"],
      profile(profile) {
        return { id: profile.sub as string };
      },
    },
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        if (account.access_token) token.accessToken = account.access_token;
        if (account.id_token) token.idToken = account.id_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.accessToken) session.accessToken = token.accessToken as string;
      if (token.idToken) session.idToken = token.idToken as string;
      return session;
    },
  },
};

