interface Onboard {
    id: string;
    interviewOutcomeId? : string;
    interviewOutcome? : InterviewOutcome[];
    cvApplicantId? : string;
    cvApplicantModel? : CVApplicant;
    proposedSalary : number;
    salaryType : string;
    proposedStartDate : string;
    status : string;
    createdById? : Account;
    requestOnboardHistories?: RequestOnboardHistory[];
}