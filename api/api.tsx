

//const API_BASE_URL = "http://localhost:7064/api/v1";
//old
// const API_BASE_URL = "https://hrm-ai-dwf8gxeqfvfgdvdy.malaysiawest-01.azurewebsites.net/api/v1";
//new
// const API_BASE_URL = "https://hrm-ai-sep490-escte3g9f3dnfvgh.malaysiawest-01.azurewebsites.net/api/v1";

//current
const API_BASE_URL= "https://hrmaisep490v2.azurewebsites.net/api/v1"

export const API = {
  BASE_URL: API_BASE_URL,

  AUTH: {
    SIGNIN: `${API_BASE_URL}/authentication/sign-in`,
    SIGNUP: `${API_BASE_URL}/authentication/sign-up`,
    VERIFY_EMAIL: `${API_BASE_URL}/authentication/email/verify`,
    RESET_VERIFICATION: `${API_BASE_URL}/authentication/email/resend-verification`,   
    CHANGE_PASSWORD: `${API_BASE_URL}/authentication/password/change`,
    FORGOT_PASSWORD: `${API_BASE_URL}/authentication/password/forgot`,
    RESET_PASSWORD: `${API_BASE_URL}/authentication/password/reset`
  },
  ACCOUNT: {
    BASE: `${API_BASE_URL}/accounts`,
    ADD_TO_DEPARTMENT: `${API_BASE_URL}/accounts/add-to-department`,
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
  },
  INTERVIEW : {
    TYPE :`${API_BASE_URL}/interview-types`,
    SCHEDULE :`${API_BASE_URL}/interview-schedules`,
    OUTCOME :`${API_BASE_URL}/interview-outcomes`,
    PROCESS :`${API_BASE_URL}/interview-processes`,
    STAGE :`${API_BASE_URL}/interview-stages`,
  },
  MAIL : {
    BASE: `${API_BASE_URL}/emails`,
  },
  ONBOARD : {
    BASE: `${API_BASE_URL}/request-onboards`
  },
  DASHBOARD : {
    COLUMN_CANDIDATE : `${API_BASE_URL}/dashboard/candidates-by-department/column`,
    PIE_STATUS_CANDIDATE :`${API_BASE_URL}/dashboard/candidate-status/pie`
  }
};

export default API;
