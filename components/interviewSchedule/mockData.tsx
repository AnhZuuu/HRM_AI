// ---------------- Types ----------------
export interface Campaign {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface InterviewType {
  id: string;
  name: string;
}

export interface CVApplicant {
  id: string;
  fileUrl: string;
  fileAlt: string;
  fullName: string;
  email: string | null;
  point: string | null;
  status: string | null;
  createdBy: string | null;
  campaignPositionId: string;
  campaignPosition: CampaignPosition | null;
  cvApplicantDetails: any[];
  interviewSchedules: any[];
}

export interface Account {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
}

export interface CampaignPosition {
  id: string;
  departmentId: string;
  campaignId: string;
  campaign: string | null;
  department: string | null;
  createdBy: string | null;
  totalSlot: number;
  description: string;
  cvApplicants?: CVApplicant[];
}


// Same STORAGE_KEY used in mockRepo.ts
const STORAGE_KEY = "mock_interview_schedules_v1";

/**
 * Sample data for interview schedules (raw, as stored in localStorage).
 * IDs here reference the existing mock data:
 * - campaignId: camp-001 / camp-002
 * - campaignPositionId: pos-001 / pos-002 / pos-003
 * - departmentId: dep-001 / dep-002 / dep-003
 * - cvApplicantId: app-001 / app-002
 * - interviewerIds: emp-001..emp-005 (must belong to departmentId)
 * - interviewTypeId: int-001 / int-002 / int-003
 */

// Campaigns
export const mockCampaigns: Campaign[] = [
  { id: "camp-001", name: "Spring Recruitment 2025" },
  { id: "camp-002", name: "Summer Internship 2025" },
];

// Departments
export const mockDepartments: Department[] = [
  { id: "dep-001", name: "Engineering" },
  { id: "dep-002", name: "Human Resources" },
  { id: "dep-003", name: "Marketing" },
];

// Campaign Positions
export const mockPositions: CampaignPosition[] = [
  {
    id: "pos-001",
    departmentId: "dep-001",
    campaignId: "camp-001",
    campaign: "Spring Recruitment 2025",
    department: "Engineering",
    createdBy: "admin",
    totalSlot: 3,
    description: "Software Engineer",
    cvApplicants: [],
  },
  {
    id: "pos-002",
    departmentId: "dep-002",
    campaignId: "camp-001",
    campaign: "Spring Recruitment 2025",
    department: "Human Resources",
    createdBy: "admin",
    totalSlot: 2,
    description: "HR Specialist",
    cvApplicants: [],
  },
  {
    id: "pos-003",
    departmentId: "dep-003",
    campaignId: "camp-002",
    campaign: "Summer Internship 2025",
    department: "Marketing",
    createdBy: "admin",
    totalSlot: 5,
    description: "Marketing Intern",
    cvApplicants: [],
  },
];

// Applicants
export const mockApplicants: CVApplicant[] = [
  {
    id: "app-001",
    fileUrl: "/cvs/john-smith.pdf",
    fileAlt: "John Smith CV",
    fullName: "John Smith",
    email: "john.smith@example.com",
    point: null,
    status: "Chưa phỏng vấn",
    createdBy: "recruiter1",
    campaignPositionId: "pos-001",
    campaignPosition: null,
    cvApplicantDetails: [],
    interviewSchedules: [],
  },
  {
    id: "app-002",
    fileUrl: "/cvs/jane-doe.pdf",
    fileAlt: "Jane Doe CV",
    fullName: "Jane Doe",
    email: "jane.doe@example.com",
    point: null,
    status: "Chưa phỏng vấn",
    createdBy: "recruiter1",
    campaignPositionId: "pos-002",
    campaignPosition: null,
    cvApplicantDetails: [],
    interviewSchedules: [],
  },
];

// Employees
export const mockEmployees: Record<string, Account[]> = {
  "dep-001": [
    { id: "emp-001", firstName: "Alice", lastName: "Nguyen", username: "alice.nguyen", email: "alice@company.com" },
    { id: "emp-002", firstName: "Bob", lastName: "Tran", username: "bob.tran", email: "bob@company.com" },
  ],
  "dep-002": [
    { id: "emp-003", firstName: "Cathy", lastName: "Le", username: "cathy.le", email: "cathy@company.com" },
    { id: "emp-004", firstName: "David", lastName: "Pham", username: "david.pham", email: "david@company.com" },
  ],
  "dep-003": [
    { id: "emp-005", firstName: "Evelyn", lastName: "Ho", username: "evelyn.ho", email: "evelyn@company.com" },
  ],
};

// Interview Types
export const mockInterviewTypes: InterviewType[] = [
  { id: "int-001", name: "Online Interview" },
  { id: "int-002", name: "In-person Interview" },
  { id: "int-003", name: "Phone Interview" },
];

export const mockInterviewSchedule: InterviewSchedule[] = [
  {
    id: "is-001",
    cvApplicantId: "cv-01",
    cvApplicant: {
      id: "cv-01",
      fullName: "Nguyễn Văn A",
      email: "a@example.com"     
    },
    startTime: "2025-05-11T07:30:00+07:00",
    endTime: "2025-05-11T08:00:00+07:00",
    createdBy: "admin-1",
    status: "Scheduled",
    round: 2,
    interviewTypeId: "type-2",
    interviewType: "Test Quiz",
    notes: "Presentation",
    interviewers: "Mai L., Tùng P.",
  },
  {
    id: "is-002",
    cvApplicantId: "cv-02",
    cvApplicant: {
      id: "cv-02",
      fullName: "Trần B",
      email: "b@example.com"
    },
    startTime: "2025-05-12T09:00:00+07:00",
    endTime: "2025-05-12T10:00:00+07:00",
    createdBy: "admin-1",
    status: "Completed",
    round: 1,
    interviewTypeId: "type-1",
    interviewType: "HR Screening",
    notes: null,
    interviewers: "Lan N.",
  },
];
