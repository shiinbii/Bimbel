"use client";

import "@/style/global.css";

import { Suspense, useEffect, useState, type ReactNode } from "react";

import { LicenseInfo } from "@mui/x-license";

import Loading from "@/app/loading";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ContentWrapper from "@/components/layout/containers/content-wrapper";
import Footer from "@/components/layout/containers/footer";
import Header from "@/components/layout/containers/header";
import Main from "@/components/layout/containers/main";
import LeftMenu from "@/components/layout/menu/left-menu";
import MenuBackdrop from "@/components/layout/menu/menu-backdrop";
import RightMenu from "@/components/layout/menu/right-menu";
import { DEFAULTS } from "@/config";

LicenseInfo.setLicenseKey(process.env.NEXT_PUBLIC_MUI_X_LICENSE_KEY || "");

export default function EduDocShell({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      <Header />
      <Main>
        <LeftMenu />
        <ContentWrapper>
          <Breadcrumb />
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </ContentWrapper>
        {!DEFAULTS.rightMenuAlwaysHidden && <RightMenu />}
      </Main>
      <Footer />
      <MenuBackdrop />
    </>
  );
}
