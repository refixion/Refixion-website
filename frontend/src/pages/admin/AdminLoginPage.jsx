import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api, formatApiErrorDetail } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { Loader2 } from "lucide-react";
import { LogoFull } from "../../components/site/Logo";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const nav = useNavigate();

  if (user && user.role === "admin") return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await login(email, password);
      nav("/admin");
    } catch (e) {
      setErr(formatApiErrorDetail(e.response?.data?.detail) || "Inloggen mislukt");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white flex items-center">
      <div className="container-page py-20">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center gap-2 justify-center mb-10">
            <LogoFull height={32} />
          </div>
          <h1 className="text-3xl tracking-tight font-semibold text-[#111111] text-center">Inloggen.</h1>
          <p className="mt-3 text-[14px] text-[#666666] text-center">Toegang tot het beheerpaneel.</p>
          <form onSubmit={submit} className="mt-10 space-y-4">
            <div>
              <label className="text-[12px] uppercase tracking-wider text-[#666666] block mb-2">E-mail</label>
              <input data-testid="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-2xl border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-[#111111]" />
            </div>
            <div>
              <label className="text-[12px] uppercase tracking-wider text-[#666666] block mb-2">Wachtwoord</label>
              <input data-testid="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-2xl border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-[#111111]" />
            </div>
            {err && <div data-testid="admin-error" className="text-[13px] text-[#DC2626]">{err}</div>}
            <motion.button data-testid="admin-login-btn" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#111111] text-white px-6 py-3 text-[14px] font-medium hover:bg-[#333] disabled:opacity-70">
              {loading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />} Inloggen
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}
