interface CampaignPositionModel {
    id: string; 
    departmentId: string;
    campaignId: string;
    departmentName: string;
    totalSlot: number;
    description: string | null;
    campaignPositionDetail:CampaignPositionDetail[] | null;
}