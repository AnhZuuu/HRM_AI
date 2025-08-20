interface Account {
  id: string;                 
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  hashedPassword: string;

  gender: string | null;              
  dateOfBirth: string | null;  
  phoneNumber: string | null;
  image: string | null;

  emailConfirmed: boolean;
  phoneNumberConfirmed: boolean;
  status: string | null;          

  verificationCode: string | null;
  verificationCodeExpiryTime: string | null; 
  resetPasswordToken: string | null;

  departmentId: string;           
  department: Department | null;
}