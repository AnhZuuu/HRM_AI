interface Campaign {
    id : string;
    name : string;
    startTime : string | null;
    endTime : string | null;
    description : string;
    createdBy : string | null;
    createdByName: string | null;
    campaignPosition?: CampaignPosition[];
}

