interface Department {
    id: string; 
    departmentName: string;
    code: string;
    description: string | null;
    campaignPositions: CampaignPosition[];
    employees: Account[];
}