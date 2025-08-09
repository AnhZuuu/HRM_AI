import React from "react";

interface RegisterFormProps {
  onClose: () => void;
  formData: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    gender: string | number;
    dateOfBirth: string;
    phoneNumber: string;
    address: string;
    roles: number[];
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onClose, onChange, formData }) => {
  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validations
    if (formData.password.length < 8 || formData.password.length > 28) {
      return alert("Password must be 8–28 characters");
    }
    if (formData.password !== formData.confirmPassword) {
      return alert("Passwords do not match");
    }
    if (!/^\d{10}$/.test(formData.phoneNumber)) {
      return alert("Phone number must be exactly 10 digits");
    }

    try {
      const requestBody = {
        ...formData,
        gender: Number(formData.gender), // Ensure gender is a number
      };

      const response = await fetch("http://localhost:7064/api/v1/authentication/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      console.log("TEXTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT");
      console.log(result);

      if (!response.ok) {
        throw new Error(result.message || "Registration failed");
      }

      alert("Registration successful!");
      onClose();
    } catch (error: any) {
      alert("Registration error: " + error.message);
      console.error("Sign-up error:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-red-500 text-lg font-bold">×</button>
        <h2 className="text-xl font-bold mb-4 text-center">Đăng Ký</h2>
        <form onSubmit={handleRegisterSubmit} className="space-y-3">
          <input name="firstName" placeholder="First Name" className="w-full p-2 border rounded" onChange={onChange} value={formData.firstName} required />
          <input name="lastName" placeholder="Last Name" className="w-full p-2 border rounded" onChange={onChange} value={formData.lastName} required />
          <input name="username" placeholder="Username" className="w-full p-2 border rounded" onChange={onChange} value={formData.username} required />
          <input name="email" type="email" placeholder="Email" className="w-full p-2 border rounded" onChange={onChange} value={formData.email} required />
          <input name="password" type="password" placeholder="Password (8-28 chars)" className="w-full p-2 border rounded" onChange={onChange} value={formData.password} required />
          <input name="confirmPassword" type="password" placeholder="Confirm Password" className="w-full p-2 border rounded" onChange={onChange} value={formData.confirmPassword} required />
          <select name="gender" className="w-full p-2 border rounded" onChange={onChange} value={formData.gender} required>
            <option value="">Select Gender</option>
            <option value="0">Male</option>
            <option value="1">Female</option>
            <option value="2">Other</option>
          </select>
          <div className="relative max-w-full">
            <input name="dateOfBirth" type="date" className="ps-10 p-2.5 border border-gray-300 rounded-lg w-full" onChange={onChange} value={formData.dateOfBirth} required />
          </div>
          <input name="phoneNumber" placeholder="Phone Number" className="w-full p-2 border rounded" onChange={onChange} value={formData.phoneNumber} required />
          <input name="address" placeholder="Address" className="w-full p-2 border rounded" onChange={onChange} value={formData.address} required />
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700">Đăng Ký</button>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
