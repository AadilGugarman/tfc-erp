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
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Sparkles,
  Users,
} from "lucide-react";
import { useDialog } from "@/components/ui/dialogs";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "idle" | "loading" | "success" | "error";

/**
 * localStorage key for the "Remember me" checkbox UI state.
 * This only persists the checkbox preference — NOT any credentials.
 */
const REMEMBER_ME_CHECKBOX_KEY = "tfc-erp-remember-me";

// ─── Background FX ───────────────────────────────────────────────────────────

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
            animate={{ y: [0, -30, 0], opacity: [0.2, 0.9, 0.2] }}
            transition={{ duration: dur, delay, repeat: Infinity, ease: "easeInOut" }}
          />
        );
      })}

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isInitializing } = useAuth();
  const setCurrentCompanyId = useAppStore((state) => state.setCurrentCompanyId);
  const dialog = useDialog();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  /**
   * "Remember me" checkbox state.
   * Persisted in localStorage so the checkbox stays checked across page loads.
   * This is purely a UI preference — no credentials are stored here.
   */
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    return localStorage.getItem(REMEMBER_ME_CHECKBOX_KEY) === "true";
  });

  // Persist checkbox preference whenever it changes
  useEffect(() => {
    localStorage.setItem(REMEMBER_ME_CHECKBOX_KEY, rememberMe ? "true" : "false");
  }, [rememberMe]);

  // Redirect if already authenticated (e.g. session was silently restored)
  useEffect(() => {
    if (isInitializing || needsSetup === null) return;
    if (!isInitializing && isAuthenticated && needsSetup === false) {
      navigate("/");
    }
  }, [isAuthenticated, isInitializing, needsSetup, navigate]);

  // Check whether initial admin setup is required
  useEffect(() => {
    const checkSetup = async () => {
      setIsCheckingSetup(true);
      try {
        const { hasUsers, error } = await authService.getSetupStatus();

        if (!hasUsers) {
          authService.logout();
          setNeedsSetup(true);
          setEmail("");
          setUsername("");
          setName("");
          if (error) {
            toast.warning(
              "Could not verify database — showing setup. Use desktop:dev if this persists.",
            );
          }
        } else {
          setNeedsSetup(false);
          // Pre-fill username from "remember me" if available
          const remembered = authService.getRememberedUsername();
          if (remembered) setUsername(remembered);
        }
      } catch {
        authService.logout();
        setNeedsSetup(true);
        setEmail("");
        toast.error('Setup check failed. Start the app with "npm run desktop:dev".');
      } finally {
        setIsCheckingSetup(false);
      }
    };
    checkSetup();
  }, []);

  const openSetupMode = () => {
    authService.logout();
    setNeedsSetup(true);
    setUsername("");
    setPassword("");
    setEmail("");
    setName("");
    setStatus("idle");
    setMessage("");
  };

  const handleBackToLogin = () => {
    setNeedsSetup(false);
    setUsername("");
    setPassword("");
    setEmail("");
    setName("Administrator");
    setStatus("idle");
    setMessage("");
  };

  const handleResetAndOpenSetup = async () => {
    const confirmed = await dialog.destructive({
      title: "Reset All Users & Company Data?",
      description:
        "This will permanently delete all user accounts and company data, then reopen the initial setup wizard. This is a developer-only action and cannot be undone.",
      confirmLabel: "Reset & Open Setup",
      cancelLabel: "Cancel",
    });
    if (!confirmed) return;

    try {
      await authService.clearUsersForSetup();
      const { hasUsers } = await authService.getSetupStatus();
      if (hasUsers) {
        throw new Error("Reset did not clear all users. Restart the app and try again.");
      }
      openSetupMode();
      toast.success("Setup is ready — create your admin account");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset for setup");
    }
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
        // ── First-run admin setup ──────────────────────────────────────────
        const response = await authService.setupInitialAdmin({
          username,
          password,
          name,
          email,
        });
        setStatus("success");
        setMessage(`Setup complete! Welcome, ${response.username}.`);
        toast.success(`Welcome, ${response.username}!`);

        const companyIds = response.company_ids ?? [];
        if (companyIds.length > 0) {
          const targetCompanyId = response.default_company_id ?? companyIds[0];
          setCurrentCompanyId(targetCompanyId);
          setTimeout(() => navigate(`/app/${targetCompanyId}/dashboard`), 1000);
        } else {
          setTimeout(() => navigate("/no-company"), 1000);
        }
      } else {
        // ── Normal login ──────────────────────────────────────────────────
        // Pass rememberMe to authService — it handles all persistent session
        // storage internally. Passwords are NEVER stored.
        const response = await authService.login(username, password, rememberMe);
        setStatus("success");
        setMessage(`Welcome back, ${response.username}. Redirecting...`);
        toast.success(`Welcome, ${response.username}! Redirecting...`);

        const companyIds = response.company_ids ?? [];
        if (companyIds.length > 0) {
          const targetCompanyId = response.default_company_id ?? companyIds[0];
          setCurrentCompanyId(targetCompanyId);
          setTimeout(() => navigate(`/app/${targetCompanyId}/dashboard`), 1000);
        } else {
          setTimeout(() => navigate("/no-company"), 1000);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Action failed. Please try again.";

      if (
        needsSetup &&
        /already registered|already complete|UNIQUE constraint/i.test(errorMessage)
      ) {
        const usersExist = await authService.hasUsers();
        if (usersExist) {
          setNeedsSetup(false);
          setStatus("error");
          const loginHint =
            "An admin account already exists. Sign in with your username and password.";
          setMessage(loginHint);
          toast.error(loginHint);
          return;
        }
      }

      setStatus("error");
      setMessage(errorMessage);
      toast.error(errorMessage);
    }
  };

  // ── Loading states ────────────────────────────────────────────────────────

  if (isCheckingSetup || needsSetup === null) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center bg-[#0a0c10]">
        <div className="flex flex-col items-center gap-3 text-white/70">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          <p className="text-sm">Checking setup status…</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

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
            <div className="glass rounded-3xl p-8 sm:p-10 select-none cursor-default">

              {/* Logo */}
              <div className="flex items-center gap-2.5 mb-6 select-none">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">
                  ASZ Nexus
                </span>
              </div>

              {/* Admin badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 border border-violet-500/30 text-xs text-violet-200 mb-5 select-none"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin-only access
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-3xl font-bold text-white tracking-tight select-none"
              >
                {needsSetup ? "Create Admin Account" : "Welcome back"}
              </motion.h2>

              {import.meta.env.DEV && !needsSetup && (
                <button
                  type="button"
                  onClick={handleResetAndOpenSetup}
                  className="mt-2 text-[10px] text-violet-400/50 hover:text-violet-400 transition-colors uppercase tracking-widest cursor-pointer select-none"
                >
                  [ Reset &amp; open setup ]
                </button>
              )}

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-white/55 mt-1.5 select-none"
              >
                {needsSetup
                  ? "Initialize your ERP system by creating the first administrator."
                  : "Sign in to your company workspace to manage billing."}
              </motion.p>

              <form onSubmit={handleSubmit} className="mt-7 space-y-4">

                {/* Full Name — setup only */}
                {needsSetup && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.32 }}
                  >
                    <label className="text-xs font-medium text-white/60 mb-1.5 block select-none cursor-default">
                      Full Name
                    </label>
                    <div className="input-shine flex items-center gap-3 rounded-xl px-4 h-12 bg-[#0d1117]/60">
                      <Users className="h-4.5 w-4.5 text-white/50" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none border-none focus:ring-0 select-auto cursor-text"
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
                  <label className="text-xs font-medium text-white/60 mb-1.5 block select-none cursor-default">
                    Username
                  </label>
                  <div className="input-shine flex items-center gap-3 rounded-xl px-4 h-12 bg-[#0d1117]/60">
                    <Mail className="h-4.5 w-4.5 text-white/50" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin"
                      className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none border-none focus:ring-0 select-auto cursor-text"
                      autoComplete="username"
                    />
                  </div>
                </motion.div>

                {/* Email — setup only */}
                {needsSetup && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.37 }}
                  >
                    <label className="text-xs font-medium text-white/60 mb-1.5 block select-none cursor-default">
                      Email Address
                    </label>
                    <div className="input-shine flex items-center gap-3 rounded-xl px-4 h-12 bg-[#0d1117]/60">
                      <Mail className="h-4.5 w-4.5 text-white/50" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@example.com"
                        className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none border-none focus:ring-0 select-auto cursor-text"
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
                    <label className="text-sm font-medium text-white/60 select-none cursor-default">
                      Password
                    </label>
                  </div>
                  <div className="input-shine flex items-center gap-3 rounded-2xl px-4 h-14 bg-[#0d1117]/60">
                    <Lock className="h-5 w-5 text-white/40" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••"
                      className="flex-1 bg-transparent text-base text-white placeholder-white/20 outline-none border-none focus:ring-0 select-auto cursor-text"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      aria-label={showPass ? "Hide password" : "Show password"}
                      className="text-white/30 hover:text-white/70 transition-colors cursor-pointer"
                    >
                      {showPass ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </motion.div>

                {/* Remember Me — login only, never shown during setup */}
                {!needsSetup && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="flex items-center justify-between"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                      <div className="relative flex items-center justify-center">
                        {/* Hidden native checkbox for accessibility */}
                        <input
                          type="checkbox"
                          id="remember-me"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="sr-only"
                          aria-label="Remember me for 30 days"
                        />
                        {/* Custom styled checkbox */}
                        <div
                          role="checkbox"
                          aria-checked={rememberMe}
                          onClick={() => setRememberMe((v) => !v)}
                          style={{ width: 18, height: 18 }}
                          className={[
                            "rounded-[5px] border flex items-center justify-center transition-all duration-150 cursor-pointer",
                            rememberMe
                              ? "bg-violet-500 border-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.4)]"
                              : "bg-white/5 border-white/20 group-hover:border-white/40",
                          ].join(" ")}
                        >
                          {rememberMe && (
                            <svg
                              className="w-2.5 h-2.5 text-white"
                              viewBox="0 0 12 10"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <polyline points="1 5 4.5 8.5 11 1" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors">
                        Remember me
                      </span>
                    </label>

                    {/* Session duration hint */}
                    {rememberMe && (
                      <motion.span
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-[11px] text-violet-300/60 select-none"
                      >
                        Stay signed in for 30 days
                      </motion.span>
                    )}
                  </motion.div>
                )}

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
                      role="alert"
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
                      role="status"
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
                  className="btn-shimmer w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-3 disabled:opacity-80 disabled:cursor-not-allowed shadow-xl shadow-violet-500/25 select-none cursor-pointer"
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

                {/* Back to Login — setup mode only */}
                {needsSetup && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    type="button"
                    onClick={handleBackToLogin}
                    className="w-full mt-4 py-2.5 px-4 text-sm text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-200 rounded-xl flex items-center justify-center gap-2 group cursor-pointer select-none"
                  >
                    <ArrowLeft className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                    <span>Already configured? Sign in</span>
                  </motion.button>
                )}
              </form>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-10 flex items-center justify-between text-[11px] text-white/40 px-2 select-none"
              >
                <span>© 2026 ASZ Nexus</span>
                {!needsSetup && (
                  <div className="flex items-center gap-4">
                    <span className="text-white/30">Secure Session</span>
                    <span className="text-white/30">Encrypted</span>
                  </div>
                )}
              </motion.div>

            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
