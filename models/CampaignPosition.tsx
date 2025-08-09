interface CampaignPosition {
    id: string; 
    departmentId: string;
    campaignId: string;
    campaign: Campaign | null;  
    department: Department | null;
    createdBy: Account | null;
    totalSlot: number | null;
    description: string;
    embedding: number[];
    campaignPositionDetails: CampaignPositionDetail[];    
    cvApplicants: CVApplicant[];
}