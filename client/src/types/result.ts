export interface ResultData {
  studentName: string;
  fatherName: string;
  motherName: string;
  roll: string;
  registration: string;
  institution: string;
  group: string;
  session: string;
  gpa: string;
  grade: string;
  result: string;
  subjects: Array<{
    name: string;
    marks: string;
    grade: string;
    gpa: string;
  }>;
}

export interface SearchFormData {
  board: string;
  exam: string;
  roll: string;
  registration: string;
  eiin?: string;
  captcha: string;
  sessionToken: string;
}

export interface SystemStats {
  responseTime: string;
  successRate: string;
  activeUsers: number;
}

export interface ResultSearchResponse {
  success: boolean;
  requestId?: number;
  message: string;
}

export interface ResultStatusResponse {
  success: boolean;
  status: 'pending' | 'success' | 'failed';
  resultData?: ResultData;
  errorMessage?: string;
  retryCount?: number;
}

export interface CaptchaResponse {
  success: boolean;
  captcha: string;
  sessionToken: string;
}
