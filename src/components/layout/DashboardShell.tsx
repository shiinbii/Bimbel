"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardShell({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-72">
        <Navbar subtitle={title} />
        <motion.main
          key={title}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="px-4 sm:px-6 lg:px-8 py-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
