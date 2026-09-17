export type Role = 'ADMIN' | 'LECTURER' | 'STUDENT';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  indexNumber: string | null;
}

export interface ResultRecord {
  id: string;
  studentId: string;
  studentName: string;
  indexNumber: string | null;
  moduleId: string;
  moduleCode: string;
  moduleName: string;
  credits: string;
  level: number;
  semester: number;
  attempt: number;
  grade: string;
  marks: string | null;
  examinationYear: number;
  status: 'DRAFT' | 'PUBLISHED' | 'WITHHELD';
}

export interface ResultSummary {
  cumulativeGpa: number;
  completedCredits: number;
  modulesCompleted: number;
  modulesAttempted: number;
  semesterGpa: Array<{ period: string; gpa: number }>;
}
