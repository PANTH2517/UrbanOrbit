import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../Components/ui/button";
import { createPageUrl } from "../utils";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { Input } from "../Components/ui/input";
import { Label } from "../Components/ui/label";
import { Alert, AlertDescription } from "../Components/ui/alert";
import { User as UserIcon, ArrowLeft, AlertCircle, Mail, Lock, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase";
import StarfieldBackground from "../Components/ui/StarfieldBackground";

/** Plain email + password citizen sign-in - a Register tab and a Login tab,
 * plus "Forgot password" via Firebase's own built-in password-reset email
 * (sendPasswordResetEmail - no custom email infrastructure needed for that,
 * Firebase sends it directly). No phone/email OTP step. */
export default function CitizenAuth() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login"); // 'login' | 'register'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const switchTab = (next) => {
    setTab(next);
    setError("");
    setInfo("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/CitizenMap");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Try logging in instead.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError(err.message || "Could not create your account.");
      }
    }
    setIsLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/CitizenMap");
    } catch (err) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Incorrect email or password.");
      } else if (err.code === "auth/user-not-found") {
        setError("No account with this email. Try registering instead.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        setError(err.message || "Login failed.");
      }
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async () => {
    setError("");
    setInfo("");

    if (!email) {
      setError("Enter your email above first, then click \"Forgot password\".");
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo("Password reset email sent - check your inbox.");
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("No account with this email.");
      } else {
        setError(err.message || "Could not send the reset email.");
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden text-white">
      <StarfieldBackground />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(56,242,255,0.35)]">
                <UserIcon className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">Citizen Access</CardTitle>
              <p className="text-slate-400">Report issues in your city</p>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
                <button
                  type="button"
                  onClick={() => switchTab("login")}
                  className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                    tab === "login" ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => switchTab("register")}
                  className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                    tab === "register" ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Register
                </button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {info && (
                <Alert className="bg-emerald-500/10 border-emerald-400/30">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <AlertDescription className="text-emerald-100">{info}</AlertDescription>
                </Alert>
              )}

              {tab === "login" && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Email Address *
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); setInfo(""); }}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" /> Password *
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); setInfo(""); }}
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full py-3">
                    {isLoading ? "Please wait..." : "Log In"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-slate-400"
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                  >
                    Forgot password?
                  </Button>
                </form>
              )}

              {tab === "register" && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Email Address *
                    </Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); setInfo(""); }}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" /> Password *
                    </Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); setInfo(""); }}
                      placeholder="At least 6 characters"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" /> Confirm Password *
                    </Label>
                    <Input
                      id="register-confirm"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(""); setInfo(""); }}
                      placeholder="Re-enter your password"
                      required
                    />
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full py-3">
                    {isLoading ? "Creating account..." : "Register"}
                  </Button>
                </form>
              )}

              <div className="text-center">
                <Button variant="ghost" onClick={() => navigate(createPageUrl("RoleSelection"))}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Role Selection
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
