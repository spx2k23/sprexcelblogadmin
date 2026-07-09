import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { supabase } from "../integrations/supabase/client";
import { 
  Mail, 
  Lock, 
  LogIn, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Sparkles,
  Shield,
  Eye,
  EyeOff,
  ArrowRight
} from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const navigate = useNavigate();

  // Clear error when user types
  useEffect(() => {
    if (error) setError("");
  }, [email, password]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();

      setLoading(false);

      if (!roleRow) {
        setError("This account doesn't have admin access.");
        await supabase.auth.signOut();
        return;
      }

      // Success - redirect to admin
      navigate("/admin/blog");
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 px-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-2xl bg-gradient-to-r from-indigo-100/10 via-transparent to-emerald-100/10 blur-2xl pointer-events-none" />
      
      {/* Floating icons decoration */}
      <div className="absolute top-20 left-20 opacity-10 animate-float">
        <Shield className="h-16 w-16 text-indigo-600" />
      </div>
      <div className="absolute bottom-20 right-20 opacity-10 animate-float-delayed">
        <Sparkles className="h-16 w-16 text-emerald-600" />
      </div>

      <Card className="w-full max-w-md relative overflow-hidden border-0 shadow-2xl shadow-indigo-500/10">
        {/* Gradient header bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
        
        <CardContent className="p-8">
          {/* Logo/Brand */}
          <div className="flex items-center justify-center mb-6">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 flex items-center justify-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Admin access only
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-indigo-500" />
                Email Address
              </Label>
              <div className="relative">
                <Input 
                  id="email" 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder="admin@example.com"
                  className={`pl-10 h-11 rounded-xl border-slate-200/50 focus:border-indigo-300 focus:ring-indigo-200/50 transition-all duration-200 bg-white/50 backdrop-blur-sm placeholder:text-slate-400 ${
                    emailFocused ? 'ring-2 ring-indigo-100 border-indigo-300' : ''
                  }`}
                />
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${
                  emailFocused ? 'text-indigo-500' : 'text-slate-400'
                }`} />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-indigo-500" />
                Password
              </Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="Enter your password"
                  className={`pl-10 pr-12 h-11 rounded-xl border-slate-200/50 focus:border-indigo-300 focus:ring-indigo-200/50 transition-all duration-200 bg-white/50 backdrop-blur-sm placeholder:text-slate-400 ${
                    passwordFocused ? 'ring-2 ring-indigo-100 border-indigo-300' : ''
                  }`}
                />
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${
                  passwordFocused ? 'text-indigo-500' : 'text-slate-400'
                }`} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100/50 animate-shake">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-600">{error}</p>
                  {error.includes("Invalid login credentials") && (
                    <p className="text-xs text-red-400 mt-0.5">
                      Please check your email and password and try again.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] font-medium text-base"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2.5">
                  <LogIn className="h-4 w-4" />
                  Sign In
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </Button>

            {/* Footer */}
            <div className="pt-4 text-center">
              <p className="text-xs text-slate-400">
                Secure admin access • Protected by Supabase
              </p>
              {!loading && !error && (
                <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>SSL Encrypted</span>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(20px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};

export default Login;