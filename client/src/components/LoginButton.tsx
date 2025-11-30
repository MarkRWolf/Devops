"use client";

import { signIn } from "next-auth/react";

const LoginButton = () => {
  const handleLogin = () => {
    signIn("ory-hydra", { callbackUrl: "/dashboard", redirect: false });
  };

  return (
    <button 
     className={`capitalize transition-transform duration-200 hover:-translate-y-0.5`}
     onClick={handleLogin}>
      Dashboard
    </button>
  );
}

export default LoginButton;
