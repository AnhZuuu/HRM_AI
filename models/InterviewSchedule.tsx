interface InterviewSchedule {
  id: string;                        
  cvApplicantId: string;             
  cvApplicant: CVApplicant | null;

  startTime: string;                
  endTime: string | null;          

  createdBy: Account | null;

  status: string | null;
  round: number | null;               

  interviewTypeId: string;          
  interviewType: string | null;
//   interviewType: InterviewTypeDictionary | null;

  notes: string | null;

//   interviewers: Interviewer[];      
  interviewers: string;
}