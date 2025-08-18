interface InterviewSchedule {
  id: string;
  cvApplicantId: string;
  cvApplicant: CVApplicant | null;
  startTime: string;        
  endTime: string | null;  
  status: string | null;
  round: number | null;
  interviewTypeId: string;
  interviewTypeName?: string | null;
  notes: string | null;
  outcome?: InterviewOutcome[] | string;
  interviewers : string;
};