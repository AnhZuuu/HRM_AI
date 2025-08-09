interface CampaignPosition {
    id: string; 
    departmentId: string;
    campaignId: string;
    campaign: Campaign | null;
    department: string;
    createdBy: string | null;
    // department: Department | null;
    // createdBy: Account | null;
    totalSlot: number | null;
    description: string;
    embedding: number[];
    campaignPositionDetails: CampaignPositionDetail[];
    cvApplicants: string;
    // cvApplicants: CVApplicant[];
}