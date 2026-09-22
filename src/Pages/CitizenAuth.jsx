import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../Components/ui/button";
import { createPageUrl } from "../utils";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { Input } from "../Components/ui/input";
import { Label } from "../Components/ui/label";
import { Alert, AlertDescription } from "../Components/ui/alert";
import { Mail, ArrowLeft, AlertCircle, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { signInWithCustomToken, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import StarfieldBackground from "../Components/ui/StarfieldBackground";

/**
 * Passwordless citizen sign-in: email -> emailed 6-digit code -> signed in
 * (or Google sign-in as a one-click alternative). No name, no password -
 * api/sendOtp.js creates the Firebase Auth user on first use (email only,
 * no password ever set), and api/verifyOtp.js mints a custom token on a
 * correct code that signInWithCustomToken below exchanges for a real
 * session. See docs/SECURITY.md for why this is email rather than
 * phone/SMS (real SMS costs money everywhere; email via Gmail SMTP is
 * genuinely free at this app's volume, at the honest cost of a weaker
 * anti-bot signal than a real phone number).
 *
 * Google sign-in skips the OTP step entirely - api/completeGoogleSignIn.js
 * marks the account verified immediately, since Google's own OAuth already
 * proves the citizen controls that account, at least as strong a signal as
 * our own email OTP.
 */
export default function CitizenAuth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("email"); // 'email' | 'otp'
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const callApi = async (path, body) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      await callApi("/api/sendOtp", { email });
      setStep("otp");
    } catch (err) {
      setError(err.message || "Could not send the verification code.");
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleLoading(true);
    try {
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      const idToken = await credential.user.getIdToken();
      const res = await fetch("/api/completeGoogleSignIn", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      navigate("/CitizenMap");
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") {
        // User backed out - not an error worth showing.
      } else if (err.code === "auth/operation-not-allowed") {
        setError("Google sign-in isn't enabled for this app yet.");
      } else {
        setError(err.message || "Google sign-in failed.");
      }
    }
    setIsGoogleLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code sent to your email.");
      return;
    }

    setIsLoading(true);
    try {
      const { customToken } = await callApi("/api/verifyOtp", { email, otp });
      await signInWithCustomToken(auth, customToken);
      navigate("/CitizenMap");
    } catch (err) {
      setError(err.message || "Verification failed.");
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
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(56,242,255,0.35)]">
                {step === "otp" ? (
                  <ShieldCheck className="w-8 h-8 text-white" />
                ) : (
                  <Mail className="w-8 h-8 text-white" />
                )}
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                {step === "otp" ? "Enter Your Code" : "Welcome, Citizen!"}
              </CardTitle>
              <p className="text-slate-400">
                {step === "otp"
                  ? `We sent a 6-digit code to ${email}`
                  : "Enter your email to report issues in your city - no password needed"}
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {step === "email" && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading || isLoading}
                    className="w-full py-3 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.78-2.4 3.63v3.02h3.89c2.28-2.1 3.56-5.2 3.56-8.84z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.89-3.02c-1.08.72-2.45 1.15-4.04 1.15-3.1 0-5.73-2.1-6.67-4.92H1.3v3.09C3.27 21.3 7.31 24 12 24z" />
                      <path fill="#FBBC05" d="M5.33 14.31A7.2 7.2 0 0 1 4.96 12c0-.8.14-1.58.37-2.31V6.6H1.3A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.3 5.4l4.03-3.09z" />
                      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.27 2.7 1.3 6.6l4.03 3.09c.94-2.82 3.57-4.92 6.67-4.92z" />
                    </svg>
                    {isGoogleLoading ? "Signing in..." : "Continue with Google"}
                  </Button>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <div className="flex-1 h-px bg-white/10" />
                    or
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full py-3">
                      {isLoading ? "Sending code..." : "Send Verification Code"}
                    </Button>
                  </form>
                </>
              )}

              {step === "otp" && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Verification Code *
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
                      placeholder="123456"
                      required
                    />
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full py-3">
                    {isLoading ? "Verifying..." : "Verify & Continue"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => { setStep("email"); setOtp(""); setError(""); }}
                  >
                    Use a different email
                  </Button>
                </form>
              )}

              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => navigate(createPageUrl("RoleSelection"))}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Role Selection
                </Button>
              </div>

              <div className="text-center text-xs text-slate-500 border-t border-white/10 pt-4">
                <p>No password, ever - just a code sent to your email each time you sign in.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
