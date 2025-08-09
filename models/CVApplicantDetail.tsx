interface CVApplicantDetail {
    id: string; 
    cvApplicantId: string;
    cvApplicant: CVApplicant | null;
    type: string;
    key: string;
    value: string;
    groupIndex: number;
}