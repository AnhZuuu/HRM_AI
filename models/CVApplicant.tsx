interface CVApplicant {
    id: string; 
    fileUrl: string;
    fileAlt: string;
    fullName: string;
    email: string | null;
    point: string | null;
    status: string | null
    createdBy: string | null;
    campaignPositionId: string;
    campaignPosition: CampaignPosition | null;
    cvApplicantDetails: CVApplicantDetail[];
    interviewSchedules: InterviewSchedule[];
}