import React, { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/auth";
import { useAuth } from "@/hooks/useAuth";
import { useAppStore } from "@/stores/useAppStore";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Sparkles,
  Zap,
  TrendingUp,
  CreditCard,
  FileText,
  Users,
} from "lucide-react";

// --- Types ---
type Status = "idle" | "loading" | "success" | "error";

// --- Components ---

function BackgroundFX() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      {/* Mesh gradient base */}
      <div className="absolute inset-0 mesh-bg" />

      {/* Grid overlay */}
      <div className="absolute inset-0 grid-overlay" />

      {/* Floating orbs */}
      <div
        className="orb"
        style={{
          width: 420,
          height: 420,
          background: "radial-gradient(circle, #7c3aed, transparent 70%)",
          top: "-80px",
          left: "-100px",
          animationDelay: "0s",
        }}
      />
      <div
        className="orb"
        style={{
          width: 380,
          height: 380,
          background: "radial-gradient(circle, #ec4899, transparent 70%)",
          bottom: "-120px",
          right: "-80px",
          animationDelay: "-4s",
        }}
      />
      <div
        className="orb"
        style={{
          width: 320,
          height: 320,
          background: "radial-gradient(circle, #10b981, transparent 70%)",
          top: "40%",
          left: "55%",
          animationDelay: "-8s",
        }}
      />

      {/* Floating particles */}
      {Array.from({ length: 28 }).map((_, i) => {
        const size = Math.random() * 3 + 1;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const dur = 6 + Math.random() * 10;
        const delay = Math.random() * -10;
        return (
          <motion.span
            key={i}
            className="absolute rounded-full bg-white/70"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              top: `${top}%`,
              boxShadow: "0 0 8px rgba(255,255,255,0.7)",
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.9, 0.2],
            }}
            transition={{
              duration: dur,
              delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
    </div>
  );
}

// --- Main Page Component ---

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isInitializing } = useAuth();
  const setCurrentCompanyId = useAppStore((state) => state.setCurrentCompanyId);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("admin");
  const [name, setName] = useState("Administrator");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, isInitializing, navigate]);

  useEffect(() => {
    const checkSetup = async () => {
      const hasUsers = await authService.hasUsers();
      setNeedsSetup(!hasUsers);
      if (!hasUsers) {
        setEmail("admin@example.com");
      } else {
        setUsername("");
      }
    };
    checkSetup();
  }, []);

  const updatePassword = (v: string) => {
    setPassword(v);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username || !password || (needsSetup && (!email || !name))) {
      setStatus("error");
      setMessage("Please fill in all fields");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      if (needsSetup) {
        const response = await authService.setupInitialAdmin({
          username,
          password,
          name,
          email,
        });
        setStatus("success");
        setMessage(`Setup complete! Welcome, ${response.username}.`);
        toast.success(`Welcome, ${response.username}!`);

        const companyIds = response.company_ids || [];
        if (companyIds.length > 0) {
          const targetCompanyId = response.default_company_id || companyIds[0];
          setCurrentCompanyId(targetCompanyId);
          setTimeout(() => navigate(`/app/${targetCompanyId}/dashboard`), 1000);
        } else {
          setTimeout(() => navigate("/no-company"), 1000);
        }
      } else {
        const response = await authService.login(username, password);
        setStatus("success");
        setMessage(`Welcome back, ${response.username}. Redirecting...`);
        toast.success(`Welcome, ${response.username}! Redirecting...`);

        const companyIds = response.company_ids || [];
        if (companyIds.length > 0) {
          // If there's a default company or multiple companies, pick one and go to dashboard
          // Use default_company_id if provided, otherwise first one
          const targetCompanyId = response.default_company_id || companyIds[0];
          setCurrentCompanyId(targetCompanyId);
          setTimeout(() => {
            navigate(`/app/${targetCompanyId}/dashboard`);
          }, 1000);
        } else {
          // No companies assigned yet
          setTimeout(() => {
            navigate("/no-company");
          }, 1000);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Action failed. Please try again.";
      setStatus("error");
      setMessage(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#0a0c10] overflow-hidden">
      <BackgroundFX />

      <div className="relative z-10 w-full flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="glow-border">
            <div className="glass rounded-3xl p-8 sm:p-10">
              {/* Logo section */}
              <div className="flex items-center gap-2.5 mb-6">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">
                  TFC ERP
                </span>
              </div>

              {/* Admin badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 border border-violet-500/30 text-xs text-violet-200 mb-5"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin-only access
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-3xl font-bold text-white tracking-tight"
              >
                {needsSetup ? "Create Admin Account" : "Welcome back"}
              </motion.h2>

              {/* Dev-only reset button */}
              {!needsSetup && process.env.NODE_ENV === "development" && (
                <button
                  onClick={async () => {
                    if (confirm("Reset database and start setup? (DEV ONLY)")) {
                      try {
                        // We use a temporary hack: just delete the DB or call a reset command
                        // For now, let's just force the setup view
                        setNeedsSetup(true);
                        toast.info("Switched to setup mode (Development)");
                      } catch (e) {
                        toast.error("Failed to reset");
                      }
                    }
                  }}
                  className="mt-2 text-[10px] text-violet-400/50 hover:text-violet-400 transition-colors uppercase tracking-widest"
                >
                  [ Force Setup Mode ]
                </button>
              )}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-white/55 mt-1.5"
              >
                {needsSetup
                  ? "Initialize your ERP system by creating the first administrator."
                  : "Sign in to your company workspace to manage billing."}
              </motion.p>

              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                {/* Name - only for setup */}
                {needsSetup && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.32 }}
                  >
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">
                      Full Name
                    </label>
                    <div className="input-shine flex items-center gap-3 rounded-xl px-4 h-12 bg-[#0d1117]/60">
                      <Users className="h-4.5 w-4.5 text-white/50" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none border-none focus:ring-0"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Username */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">
                    Username
                  </label>
                  <div className="input-shine flex items-center gap-3 rounded-xl px-4 h-12 bg-[#0d1117]/60">
                    <Mail className="h-4.5 w-4.5 text-white/50" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin"
                      className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none border-none focus:ring-0"
                      autoComplete="username"
                    />
                  </div>
                </motion.div>

                {/* Email - only for setup */}
                {needsSetup && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.37 }}
                  >
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">
                      Email Address
                    </label>
                    <div className="input-shine flex items-center gap-3 rounded-xl px-4 h-12 bg-[#0d1117]/60">
                      <Mail className="h-4.5 w-4.5 text-white/50" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@example.com"
                        className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none border-none focus:ring-0"
                        autoComplete="email"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Password */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-white/60">
                      Password
                    </label>
                    <a
                      href="#"
                      className="text-sm text-violet-300 hover:text-violet-200 transition-colors"
                    >
                      Forgot?
                    </a>
                  </div>
                  <div className="input-shine flex items-center gap-3 rounded-2xl px-4 h-14 bg-[#0d1117]/60">
                    <Lock className="h-5 w-5 text-white/40" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => updatePassword(e.target.value)}
                      placeholder="••••••••••"
                      className="flex-1 bg-transparent text-base text-white placeholder-white/20 outline-none border-none focus:ring-0"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="text-white/30 hover:text-white/70 transition-colors"
                    >
                      {showPass ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </motion.div>

                {/* Status message */}
                <AnimatePresence mode="wait">
                  {status === "error" && message && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }}
                      exit={{ opacity: 0 }}
                      transition={{ x: { duration: 0.4 } }}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-200"
                    >
                      {message}
                    </motion.div>
                  )}
                  {status === "success" && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-200"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {message}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={status === "loading" || status === "success"}
                  className="btn-shimmer w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-3 disabled:opacity-80 disabled:cursor-not-allowed shadow-xl shadow-violet-500/25"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : status === "success" ? (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      {needsSetup ? "Setup Complete" : "Authenticated"}
                    </>
                  ) : (
                    <>
                      {needsSetup ? "Complete Setup" : "Sign in to dashboard"}
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Footer section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-10 flex items-center justify-between text-[11px] text-white/40 px-2"
              >
                <span>© 2026 TFC ERP Inc.</span>
                <div className="flex items-center gap-4">
                  <a href="#" className="hover:text-white/70 transition">
                    Privacy
                  </a>
                  <a href="#" className="hover:text-white/70 transition">
                    Security
                  </a>
                  <a href="#" className="hover:text-white/70 transition">
                    Status
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
