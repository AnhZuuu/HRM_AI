import React, { useState, useEffect } from "react";

interface VerificationFormProps {
  onClose: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const VerificationForm: React.FC<VerificationFormProps> = ({ onClose, onChange }) => {
  const [formData, setFormData] = useState({
    email: "",
    verificationCode: ""
  });

  const [isEmailValid, setIsEmailValid] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updated = {
      ...formData,
      [name === "code" ? "verificationCode" : name]: value
    };
    setFormData(updated);
    onChange(e);

    // Simple email validation
    const isValidEmail = /\S+@\S+\.\S+/.test(updated.email);
    setIsEmailValid(isValidEmail);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const query = new URLSearchParams({
        email: formData.email,
        verificationCode: formData.verificationCode
      });

      const response = await fetch(`${API_VERIFY_EMAIL}?${query.toString()}`, {
        method: "GET"
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Verification failed");
      }

      alert("Verification successful!");
      onClose();
    } catch (error: any) {
      alert("Verification error: " + error.message);
      console.error("Verification failed:", error);
    }
  };

  const handleResendCode = async () => {
  try {
    const response = await fetch(API_RESET_VERIFICATION, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email: formData.email })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Không gửi được mã xác nhận");
    }

    // show the message returned from backend
    if (result?.message) {
      // alert(result.message + " Email đã được xác minh");
      alert(result.message );
    } else {
      alert("Yêu cầu đã được xử lý!");
    }

  } catch (error: any) {
    alert("Lỗi gửi lại mã: " + error.message);
    console.error("Resend error:", error);
  }
};


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-red-500 text-lg font-bold">×</button>
        <h2 className="text-xl font-bold mb-4 text-center">Xác minh tài khoản</h2>
        <form className="space-y-4" onSubmit={handleVerify}>
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="w-full p-2 border rounded"
            value={formData.email}
            onChange={handleInputChange}
            required
          />

          {/* Conditional resend button */}
          {isEmailValid && (
            <button
              type="button"
              onClick={handleResendCode}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Gửi lại mã xác minh
            </button>
          )}

          <input
            name="code"
            placeholder="Verification Code"
            className="w-full p-2 border rounded"
            value={formData.verificationCode}
            onChange={handleInputChange}
            required
          />
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700">
            Xác minh
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerificationForm;
