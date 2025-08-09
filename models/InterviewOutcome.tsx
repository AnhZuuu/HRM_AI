interface InterviewOutcome {
  id: string;                        
  interviewScheduleId: string;        
  interviewSchedule: InterviewSchedule | null;

  createdBy: Account | null;
  feedback: string;                  
}