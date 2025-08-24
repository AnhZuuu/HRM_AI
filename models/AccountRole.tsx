interface AccountRole {
    id : string;
    totalReputation? : number;
    status? : number | null;
    role? : number;
    roleName? : string;
}

// role = 1 -> roleName : HR
// role = 2 -> roleName : Department Manager
// role = 3 -> roleName : Employee
// role = 4 -> roleName : Admin

