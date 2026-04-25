export type Role = "STUDENT" | "TEACHER" | "ADMIN" | "SUPER_ADMIN";

export type TestType = "PRE_TEST" | "EXAM" | "VIDEO_QUIZ";

export type ZoomStatus = "SCHEDULED" | "LIVE" | "ENDED";

export type TxStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  points: number;
  avatar?: string;
  totalEarn?: number;
  totalSpent?: number;
  joinedAt?: string;
}

export interface PointPackage {
  id: string;
  name: string;
  price: number;
  points: number;
  bonus?: number;
  popular?: boolean;
  description: string;
  /** Diisi kalau pkg ini sebenarnya tier purchase (Basic/Popular/Premium). */
  tierId?: string;
}

export type OptionKey = "A" | "B" | "C" | "D";

export interface Question {
  id: string;
  text: string;
  options: { key: OptionKey; text: string }[];
  correct: OptionKey;
  /** Penjelasan utama (mengapa jawaban yang benar adalah benar). */
  explanation: string;
  /** Penjelasan per opsi — mengapa pilihan tertentu salah (atau catatan tambahan untuk yang benar). */
  optionExplanations?: Partial<Record<OptionKey, string>>;
}

export interface Test {
  id: string;
  title: string;
  subject: string;
  type: TestType;
  duration: number; // minutes
  cost: number;
  totalQuestions: number;
  requireVideo: boolean;
  videoUrl?: string;
  passingScore: number;
  description: string;
  questions: Question[];
}

export interface ZoomSession {
  id: string;
  title: string;
  teacher: string;
  teacherAvatar?: string;
  subject: string;
  scheduledAt: string; // ISO
  duration: number; // minutes
  cost: number;
  maxParticipants: number;
  currentParticipants: number;
  status: ZoomStatus;
  description: string;
  meetingUrl: string;
}

export interface Transaction {
  id: string;
  user: string;
  userEmail?: string | null;
  package: string;
  amount: number;
  points: number;
  method: string;
  status: TxStatus;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  user: string;
  avatar?: string;
  message: string;
  time: string;
  isTeacher?: boolean;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  subject: string;
  rating: number;
  students: number;
  sessions: number;
  status: "ACTIVE" | "INACTIVE";
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  points: number;
  completedTests: number;
  joinedAt: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  role: Role;
  target: string;
  ip: string;
  time: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  message: string;
  rating: number;
}
