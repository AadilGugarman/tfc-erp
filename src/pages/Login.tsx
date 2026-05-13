import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authService } from "@/services/auth";
import { useAppStore } from "@/stores/useAppStore";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export function LoginPage() {
  const navigate = useNavigate();
  const setCurrentCompanyId = useAppStore((state) => state.setCurrentCompanyId);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateForm = (): boolean => {
    let isValid = true;
    setUsernameError("");
    setPasswordError("");

    if (!username.trim()) {
      setUsernameError("Username is required");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 3) {
      setPasswordError("Password must be at least 3 characters");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await authService.login(username, password);

      setSuccess(`✓ Welcome, ${response.username}!`);
      toast.success(`Welcome, ${response.username}! Redirecting...`);

      // Set the current company in the store
      if (response.default_company_id) {
        setCurrentCompanyId(response.default_company_id);
        // Redirect to dashboard with company ID
        setTimeout(() => {
          navigate(`/app/${response.default_company_id}/dashboard`);
        }, 500);
      } else if (response.company_ids && response.company_ids.length > 0) {
        const firstCompanyId = response.company_ids[0];
        setCurrentCompanyId(firstCompanyId);
        // Redirect to dashboard with company ID
        setTimeout(() => {
          navigate(`/app/${firstCompanyId}/dashboard`);
        }, 500);
      } else {
        // No companies assigned
        setError(
          "No companies assigned to your account. Please contact administrator.",
        );
        toast.error("No companies assigned to your account.");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Login failed. Please try again.";

      // User-friendly error messages
      let displayError = errorMessage;
      if (errorMessage.includes("Invalid username or password")) {
        displayError =
          "Invalid username or password. Please check your credentials and try again.";
      } else if (errorMessage.includes("Cannot find module")) {
        displayError = "Application not initialized. Please restart the app.";
      }

      setError(displayError);
      toast.error(displayError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-slate-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4">
      <div className="w-full max-w-[400px]">
        {/* Logo + brand */}
        <div className="flex flex-col items-center mb-10">
          <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/40 mb-6 animate-bounce-subtle">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              className="text-white"
            >
              <path
                d="M12 3C8 3 4 7 4 12s4 9 8 9 8-4 8-9-4-9-8-9z"
                fill="currentColor"
                opacity="0.2"
              />
              <path
                d="M12 3c-1 0-2 .5-3 1.5L12 8l3-3.5C14 3.5 13 3 12 3z"
                fill="currentColor"
              />
              <path
                d="M9 15c.8 1.5 1.7 2.5 3 3 1.3-.5 2.2-1.5 3-3H9z"
                fill="currentColor"
              />
              <path
                d="M4.5 9.5C4.2 10.3 4 11.1 4 12s.2 1.7.5 2.5L9 12 4.5 9.5z"
                fill="currentColor"
                opacity="0.7"
              />
              <path
                d="M19.5 9.5L15 12l4.5 2.5c.3-.8.5-1.6.5-2.5s-.2-1.7-.5-2.5z"
                fill="currentColor"
                opacity="0.7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            TFC
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Talha Fruit Co. — Enterprise ERP
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-8">
          {/* Success Message */}
          {success && (
            <div className="mb-6 flex items-start gap-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4 animate-slide-in">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <div className="text-sm font-medium text-green-700 dark:text-green-300">
                {success}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 animate-shake">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-red-700 dark:text-red-300">
                  Login Failed
                </div>
                <div className="text-sm text-red-600 dark:text-red-400 mt-0.5">
                  {error}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Username
              </label>
              <Input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameError("");
                }}
                disabled={loading}
                className={
                  usernameError ? "ring-red-500 dark:ring-red-400" : ""
                }
                autoFocus
              />
              {usernameError && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {usernameError}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                disabled={loading}
                className={
                  passwordError ? "ring-red-500 dark:ring-red-400" : ""
                }
              />
              {passwordError && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {passwordError}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                </>
              )}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
              <p className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                Demo Credentials
              </p>
              <p className="font-mono bg-slate-100 dark:bg-slate-800 rounded px-3 py-2 mb-1">
                admin / admin123
              </p>
              <p className="text-xs mt-2">
                This is a single-user account for testing
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
          <p>Secure Authentication Powered by JWT</p>
          <p className="mt-1">All connections are encrypted</p>
        </div>
      </div>
    </div>
  );
}
