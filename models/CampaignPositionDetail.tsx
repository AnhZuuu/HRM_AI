interface CampaignPositionDetail {
    id: string; 
    campaignPositionId: string;
    campaignPosition: CampaignPosition | null;
    type: string;
    key: string;
    value: string;
    groupIndex: number;
}