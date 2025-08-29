interface Department {
    id: string; 
    departmentName: string;
    code: string;
    description: string | null;
    campaignPositions?: CampaignPosition[] | null;
    employees: Account[] | null;
    campaignPositionModels: CampaignPositionModel[] | null;
}