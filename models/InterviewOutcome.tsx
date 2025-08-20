interface InterviewOutcome {
  id: string;                        
  interviewScheduleId: string;        
  interviewSchedule: InterviewSchedule | null;

  createdBy: string | null;
  feedback: string;                  
}