// components/VerificationForm.tsx
import React from "react";

interface VerificationFormProps {
  onClose: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const VerificationForm: React.FC<VerificationFormProps> = ({ onClose, onChange }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-red-500 text-lg font-bold">×</button>
        <h2 className="text-xl font-bold mb-4 text-center">Xác minh tài khoản</h2>
        <form className="space-y-4">
          <input name="email" type="email" placeholder="Email" className="w-full p-2 border rounded" onChange={onChange} required />
          <input name="code" placeholder="Verification Code" className="w-full p-2 border rounded" onChange={onChange} required />
          <button type="submit" onClick={onClose} className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700">Xác minh</button>
        </form>
      </div>
    </div>
  );
};

export default VerificationForm;
 