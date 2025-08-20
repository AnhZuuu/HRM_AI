interface Account {
  id: string;                 
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  // hashedPassword: string;

  gender: number;              
  dateOfBirth: string | null;  
  phoneNumber: string | null;
  image: string | null;

  emailConfirmed: boolean;
  phoneNumberConfirmed: boolean;
  // status: string | null;          

  // verificationCode: string | null;
  // verificationCodeExpiryTime: string | null; 
  // resetPasswordToken: string | null;

  departmentId: string | null;           
  // department: Department | null;
  accountRoles : AccountRole[] | null;
  isDeleted : boolean;
  creationDate : string;
  modificationDate : string;
}