import { Suspense } from "react";

import Loading from "@/app/loading";

export default function AuthGroupLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}
