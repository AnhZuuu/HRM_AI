"use client";

import API from "@/api/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ForgotResetCard() {
  const router = useRouter();
  const [step, setStep] = useState<"forgot" | "reset">("forgot");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const resetMessages = () => setMsg(null);

  const [countdown, setCountdown] = useState<number | null>(null);
  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      router.push("/");
      return;
    }

    const timer = setTimeout(() => setCountdown((c) => (c ? c - 1 : 0)), 1000);
    return () => clearTimeout(timer);
  }, [countdown, router]);

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    if (!email) return setMsg({ type: "error", text: "Nhập email của bạn." });

    setLoading(true);
    try {
      const res = await fetch(API.AUTH.FORGOT_PASSWORD, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(
          data?.message || "Xảy ra lỗi khi gửi mã đến email. Vui lòng thử lại."
        );
      }

      setMsg({
        type: "success",
        text: "Mã Token đã được gửi tới email, hãy kiểm tra email của bạn.",
      });
      setStep("reset");
    } catch (err: any) {
      setMsg({
        type: "error",
        text: err.message || "Xảy ra lỗi. Vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  }

  function isValidPassword(pw: string) {
    const regex = /^(?=.*\d).{8,}$/;
    return regex.test(pw);
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();

    if (!email) return setMsg({ type: "error", text: "Chưa nhập Email." });
    if (!token) return setMsg({ type: "error", text: "Chưa nhập mã Token." });
    if (!password)
      return setMsg({ type: "error", text: "Chưa nhập mật khẩu." });
    if (!isValidPassword(password)) {
      return setMsg({
        type: "error",
        text: "Mật khẩu phải dài ít nhất 8 ký tự và chứa ít nhất một số.",
      });
    }
    if (password !== confirmPassword)
      return setMsg({ type: "error", text: "Mật khẩu không khớp." });

    setLoading(true);
    try {
      const res = await fetch(API.AUTH.RESET_PASSWORD, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
          token,
        }),
      });

      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(
          data?.message ||
            "Không thể đặt lại mật khẩu. Vui lòng kiểm tra và thử lại."
        );
      }

      setMsg({
        type: "success",
        text: "Mật khẩu đã được đặt lại. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.",
      });
      setPassword("");
      setConfirmPassword("");
      setToken("");
      setCountdown(5);
    } catch (err: any) {
      setMsg({
        type: "error",
        text: err.message || "Xảy ra lỗi. Vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-center">
        {step === "forgot" ? "Quên mật khẩu" : "Đặt lại mật khẩu mới"}
      </h1>
      <p className="mt-1 text-sm text-gray-500 text-center">
        {step === "forgot"
          ? "Nhập email của bạn để nhận mã Token đặt lại mật khẩu."
          : "Nhập mã Token bạn đã nhận được và mật khẩu mới của bạn."}
      </p>

      {msg && (
        <div
          className={`mt-4 rounded-md p-3 text-sm ${
            msg.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
          {msg.type === "success" && countdown !== null && (
            <span className="block text-gray-600 mt-1">
              Đang chuyển hướng đến đăng nhập sau {countdown} giây{" "}
              {countdown !== 1 ? "s" : ""}...
            </span>
          )}
        </div>
      )}

      {step === "forgot" ? (
        <form onSubmit={handleForgot} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Đang gửi..." : "Gửi mã"}
          </button>

          <div className="text-center text-sm text-gray-500">
            Quay lại trang đăng nhập?{" "}
            <button
              type="button"
              className="text-blue-600 hover:underline"
              onClick={() => router.push("/")}
            >
              Đăng nhập
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleReset} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Token</label>
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="Nhập mã được gửi vào email của bạn"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Mật khẩu mới
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
          </button>

          <div className="text-center text-sm text-gray-500">
            Bạn chưa nhận được mã?{" "}
            <button
              type="button"
              className="text-blue-600 hover:underline"
              onClick={() => setStep("forgot")}
            >
              Gửi lại
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
