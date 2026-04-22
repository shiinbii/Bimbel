import type { MenuItem } from "@/types";

export const teacherMenu: { items: MenuItem[]; bottomItems: MenuItem[] } = {
  items: [
    {
      id: "teacher-dashboard",
      icon: "NiHome",
      label: "Dashboard",
      href: "/teacher/dashboard",
    },
    {
      id: "teacher-tests",
      icon: "NiDocumentCheck",
      label: "Kelola Soal",
      href: "/teacher/tests",
    },
    {
      id: "teacher-sessions",
      icon: "NiCalendar",
      label: "Jadwal Sesi",
      href: "/teacher/sessions",
    },
    {
      id: "teacher-private-zoom",
      icon: "NiCrown",
      label: "Sesi Privat 1-on-1",
      href: "/teacher/private-zoom",
    },
    {
      id: "teacher-students",
      icon: "NiGraduation",
      label: "Siswa",
      href: "/teacher/students",
    },
  ],
  bottomItems: [
    {
      id: "teacher-profile",
      icon: "NiUser",
      label: "Profil",
      href: "/profile",
    },
    {
      id: "teacher-settings",
      icon: "NiSettings",
      label: "Pengaturan",
      href: "/account-settings",
    },
  ],
};
