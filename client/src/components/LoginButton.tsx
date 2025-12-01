import { signIn } from "next-auth/react";

export function LoginButton() {
  return (
    <button onClick={() => signIn("ory-hydra")}>
      Sign in with ORY Hydra
    </button>
  );
}

