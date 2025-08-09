interface Campaign {
    id : string;
    name : string;
    startTime : string;
    endTime : string;
    description : string;
    createdBy : string | null;
    campaignPosition?: CampaignPosition[];
}