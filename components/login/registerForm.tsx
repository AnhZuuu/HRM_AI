// components/RegisterForm.tsx
import React from "react";

interface RegisterFormProps {
  onClose: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onClose, onChange, onSubmit }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-red-500 text-lg font-bold">×</button>
        <h2 className="text-xl font-bold mb-4 text-center">Đăng Ký</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <input name="firstName" placeholder="First Name" className="w-full p-2 border rounded" onChange={onChange} required />
          <input name="lastName" placeholder="Last Name" className="w-full p-2 border rounded" onChange={onChange} required />
          <input name="username" placeholder="Username" className="w-full p-2 border rounded" onChange={onChange} required />
          <input name="email" type="email" placeholder="Email" className="w-full p-2 border rounded" onChange={onChange} required />
          <input name="password" type="password" placeholder="Password (8-28 chars)" className="w-full p-2 border rounded" onChange={onChange} required />
          <input name="confirmPassword" type="password" placeholder="Confirm Password" className="w-full p-2 border rounded" onChange={onChange} required />
          <select name="gender" className="w-full p-2 border rounded" onChange={onChange} required>
            <option value="">Select Gender</option>
            <option value="0">Male</option>
            <option value="1">Female</option>
            <option value="2">Other</option>
          </select>
          <div className="relative max-w-full">
            <input name="dateOfBirth" type="date" className="ps-10 p-2.5 border border-gray-300 rounded-lg w-full" onChange={onChange} required />
          </div>
          <input name="phoneNumber" placeholder="Phone Number" className="w-full p-2 border rounded" onChange={onChange} required />
          <input name="address" placeholder="Address" className="w-full p-2 border rounded" onChange={onChange} required />
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700">Đăng Ký</button>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
