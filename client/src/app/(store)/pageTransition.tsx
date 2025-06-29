"use client";
import { ViewTransitions } from "next-view-transitions";

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return <ViewTransitions>{children}</ViewTransitions>;
};

export default PageTransition;
