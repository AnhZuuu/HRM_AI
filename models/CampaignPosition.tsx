interface CampaignPosition {
    id: string; 
    departmentId: string;
    campaignId: string;
    campaign: string | null;  
    department: string | null;
    createdBy: string | null;
    totalSlot: number;
    description: string;
    // embedding: number[];
    // campaignPositionDetails: CampaignPositionDetail[];    
    cvApplicants?: CVApplicant[];

}