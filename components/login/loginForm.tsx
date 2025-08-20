import React, { useState } from "react";
import { FaEnvelope, FaLock } from "react-icons/fa";
import RegisterForm from "./registerForm";
import VerificationForm from "./verificationForm";
import API from "@/api/api";

const LoginPage = () => {
  // React.useEffect(() => {
  //   const handleVisibilityChange = () => {
  //     if (document.hidden) {
  //       // console.log("Tab out detected. Simulating SignalR by refreshing page.");
  //       window.location.reload();
  //     }
  //   };
  //   document.addEventListener("visibilitychange", handleVisibilityChange);
  //   return () => {
  //     document.removeEventListener("visibilitychange", handleVisibilityChange);
  //   };
  // }, []);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });

  const [showRegister, setShowRegister] = useState(false);
  const [showVerify, setShowVerify] = useState(false);

  const [registerData, setRegisterData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
    dateOfBirth: "",
    phoneNumber: "",
    address: "",
    roles: [1]
  });

  const [verifyData, setVerifyData] = useState({
    email: "",
    code: ""
  });

  const handleLoginInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleRegisterInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setRegisterData(prev => ({ ...prev, [name]: val }));
  };

  const handleVerifyInputChange = (e: any) => {
    const { name, value } = e.target;
    setVerifyData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    try {
      console.log("check run");

      const response = await fetch(API.AUTH.SIGNIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });
      console.log("check body", response);
      if (!response.ok) {
        console.log("check run2");

        throw new Error("Invalid credentials or server error");

      }
      console.log("check run3");

      const data = await response.json();
      console.log(data);
      // const { accessToken, refreshToken, refreshTokenExpires } = data;

      // Save to localStorage
      localStorage.setItem("accessToken", data.data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("refreshTokenExpires", data.refreshTokenExpires);
      localStorage.setItem("email", data.data.email);
      localStorage.setItem("name", data.data.name);

      console.log("Saved test token:", localStorage.getItem("accessToken"));

      // Navigate to dashboard
      window.location.href = "/dashboard";
    } catch (error: any) {
      alert("Login failed: " + error.message);
      console.error("Login error:", error);
    }
  };

  // const handleRegisterSubmit = (e: any) => {
  //   e.preventDefault();
  //   if (registerData.password.length < 8 || registerData.password.length > 28) {
  //     return alert("Password must be 8-28 characters long");
  //   }
  //   if (registerData.password !== registerData.confirmPassword) {
  //     return alert("Passwords do not match");
  //   }
  //   if (!/^\d{10}$/.test(registerData.phoneNumber)) {
  //     return alert("Phone number must be exactly 10 digits");
  //   }
  //   console.log("Register submitted:", registerData);
  //   setShowRegister(false);
  // };

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4 relative">
      {/* Register Popup */}
      {showRegister && (
        <RegisterForm
          onClose={() => setShowRegister(false)}
          onChange={handleRegisterInputChange}
          formData={registerData}
        />
      )}

      {/* Verify Popup */}
      {showVerify && (
        <VerificationForm
          onClose={() => setShowVerify(false)}
          onChange={handleVerifyInputChange}
        />
      )}

      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="px-8 py-6 bg-indigo-600">
          <h2 className="text-2xl font-bold text-center text-white">HR Management System</h2>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="text" name="email" value={formData.email} onChange={handleLoginInputChange} placeholder="Tên đăng nhập" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600" required />
            </div>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="password" name="password" value={formData.password} onChange={handleLoginInputChange} placeholder="Mật khẩu" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600" required />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" name="rememberMe" checked={formData.rememberMe} onChange={handleLoginInputChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                <span className="ml-2 text-sm text-gray-600">Ghi nhớ</span>
              </label>
              <button type="button" className="text-sm text-indigo-600 hover:text-indigo-500">Quên mật khẩu?</button>
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700">Đăng nhập</button>
          </form>

          <div className="mt-4 space-y-1">
            <div className="text-sm text-gray-600 cursor-pointer" onClick={() => setShowRegister(true)}>Đăng ký tạm thời</div>
            <div className="text-sm text-gray-600 cursor-pointer" onClick={() => setShowVerify(true)}>Xác minh tài khoản</div>
          </div>
        </div>
      </div>

      {/* Simple animation keyframe */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};



export default LoginPage;
