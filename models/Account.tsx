interface Account {
  id: string;                 
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  // hashedPassword: string;

  gender: number;              
  dateOfBirth?: string;  
  phoneNumber?: string;
  image?: string;

  emailConfirmed: boolean;
  phoneNumberConfirmed?: boolean;
  // status: string | null;          

  // verificationCode: string | null;
  // verificationCodeExpiryTime: string | null; 
  // resetPasswordToken: string | null;

  departmentId?: string;           
  departmentName?: string;
  accountRoles : AccountRole[] | null;
  isDeleted : boolean;
  creationDate : string;
  modificationDate : string;
}