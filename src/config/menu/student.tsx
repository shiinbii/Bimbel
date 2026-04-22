import type { MenuItem } from "@/types";

export const studentMenu: { items: MenuItem[]; bottomItems: MenuItem[] } = {
  items: [
    {
      id: "student-dashboard",
      icon: "NiHome",
      label: "Dashboard",
      href: "/student/dashboard",
    },
    {
      id: "student-quiz",
      icon: "NiDocumentCheck",
      label: "Soal & Quiz",
      href: "/student/quiz",
    },
    {
      id: "student-zoom",
      icon: "NiCamera",
      label: "Sesi Zoom",
      href: "/student/zoom",
    },
    {
      id: "student-private-zoom",
      icon: "NiCrown",
      label: "Sesi Privat",
      href: "/student/private-zoom",
    },
    {
      id: "student-quiz-history",
      icon: "NiDocumentFull",
      label: "Riwayat Soal",
      href: "/student/quiz-history",
    },
    {
      id: "student-history",
      icon: "NiArrowHistory",
      label: "Riwayat Poin",
      href: "/student/history",
    },
  ],
  bottomItems: [
    {
      id: "student-profile",
      icon: "NiUser",
      label: "Profil",
      href: "/profile",
    },
  ],
};
