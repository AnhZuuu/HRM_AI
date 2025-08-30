interface RequestOnboardHistory {
    id: string;
    requestOnboardId : string;
    requestOnboard? : Onboard[];
    oldStatus?: string;
    changedByUser?: string;
    note?: string;
}