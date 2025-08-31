
"use client"
import API from "@/api/api";
import { toast } from "react-toastify";

import React, { useEffect, useMemo, useRef, useState } from "react";

interface VerificationFormProps {
  onClose: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const VerificationForm: React.FC<VerificationFormProps> = ({ onClose, onChange }) => {
  const [formData, setFormData] = useState({ email: "", verificationCode: "" });
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0); 
  const dialogRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  const canResend = useMemo(
    () => isEmailValid && resendTimer === 0 && !resendLoading,
    [isEmailValid, resendTimer, resendLoading]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    setTimeout(() => emailRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    let value = e.target.value;

    const updated = {
      ...formData,
      [name === "code" ? "verificationCode" : name]: value,
    };
    setFormData(updated);
    onChange(e);

    setIsEmailValid(/\S+@\S+\.\S+/.test(updated.email));
    setMsg(null);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!isEmailValid) {
      setMsg({ type: "error", text: "Email không hợp lệ. Vui lòng kiểm tra lại." });
      toast.warning("Email không hợp lệ. Vui lòng kiểm tra lại.");
      return;
    }
    if (!formData.verificationCode) {
      setMsg({ type: "error", text: "Mã xác minh không hợp lệ. Vui lòng kiểm tra lại." });
      toast.warning("Mã xác minh không hợp lệ. Vui lòng kiểm tra lại.");
      return;
    }

    try {
      setLoading(true);

      const query = new URLSearchParams({
        email: formData.email.trim(),
        verificationCode: formData.verificationCode.trim(),
      });

      const response = await fetch(`${API.AUTH.VERIFY_EMAIL}?${query.toString()}`, {
        method: "GET",
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Verification failed");
      }


      setMsg({ type: "success", text: "Xác minh thành công. Cảm ơn bạn!" });
      toast.success("Xác minh thành công. Cảm ơn bạn!");

      setTimeout(() => onClose(), 1200);
    } catch (error: any) {
      setMsg({ type: "error", text: error?.message || "Xác minh thất bại. Vui lòng thử lại." });
      toast.error("Xác minh thất bại. Vui lòng thử lại.");
      console.error("Verification failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {

    setMsg(null);

    if (!isEmailValid) {
      setMsg({ type: "error", text: "Vui lòng nhập email hợp lệ để gửi lại mã." });
      return;
    }

    try {
      setResendLoading(true);

      const response = await fetch(API.AUTH.RESET_VERIFICATION, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email.trim() }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Không gửi được mã xác nhận");
      }

      setMsg({
        type: "success",
        text: result?.message || "Đã gửi lại mã xác minh. Vui lòng kiểm tra hộp thư.",
      });

      setResendTimer(60);
      setTimeout(() => codeRef.current?.focus(), 0);
    } catch (error: any) {
      setMsg({ type: "error", text: error?.message || "Không thể gửi lại mã. Vui lòng thử lại." });
      console.error("Resend error:", error);
    } finally {
      setResendLoading(false);
    }
  };

  function stopClickPropagation(e: React.MouseEvent) {
    e.stopPropagation();
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        onClick={stopClickPropagation}
        className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm relative"
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 h-9 w-9 rounded-full hover:bg-gray-100"
          aria-label="Đóng"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold mb-1 text-center">Xác minh tài khoản</h2>
        <p className="text-sm text-gray-500 mb-4 text-center">
          Nhập email và mã xác minh được gửi đến hộp thư của bạn.
        </p>

        {msg && (
          <div
            className={`mb-4 rounded-md p-3 text-sm ${
              msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {msg.text}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleVerify}>

          <div>
            <input
              ref={emailRef}
              name="email"
              type="email"
              placeholder="you@example.com"
              className="w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300"
              value={formData.email}
              onChange={handleInputChange}
              required
              aria-invalid={!isEmailValid}
            />
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-gray-500">Chỉ khi email hợp lệ mới gửi lại mã.</p>

              {isEmailValid && (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={!canResend}
                  className="text-xs font-medium rounded-md px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendLoading ? "Đang gửi…" : resendTimer > 0 ? `Gửi lại (${resendTimer}s)` : "Gửi lại mã"}
                </button>
              )}
            </div>
          </div>

          <div>
            <input
              ref={codeRef}
              name="code" 
              placeholder="Mã xác minh"
              className="w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300 tracking-widest"
              value={formData.verificationCode}
              onChange={handleInputChange}
              required
              maxLength={10}
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Đang xác minh…" : "Xác minh"}

          </button>
        </form>
      </div>
    </div>
  );
};

export default VerificationForm;
