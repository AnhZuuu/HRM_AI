// api.ts

const API_BASE_URL = "http://localhost:7064/api/v1";

export const API = {
  BASE_URL: API_BASE_URL,

  AUTH: {
    SIGNIN: `${API_BASE_URL}/authentication/sign-in`,
    SIGNUP: `${API_BASE_URL}/authentication/sign-up`,
    VERIFY_EMAIL: `${API_BASE_URL}/authentication/email/verify`,
    RESET_VERIFICATION: `${API_BASE_URL}/authentication/email/resend-verification`,
  },

  CAMPAIGN: {
    BASE: `${API_BASE_URL}/campaigns`,
    POSITION: `${API_BASE_URL}/campaign-positions`,
  },

  DEPARTMENT: { BASE: `${API_BASE_URL}/departments` 
},
  CV : {
    PARSE: `${API_BASE_URL}/cv/parse`,
    APPLICANT: `${API_BASE_URL}/cvApplicants`
  }
};

export default API;