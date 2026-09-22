import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../Components/ui/button";
import { createPageUrl } from "../utils";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { Input } from "../Components/ui/input";
import { Label } from "../Components/ui/label";
import { Alert, AlertDescription } from "../Components/ui/alert";
import { User as UserIcon, ArrowLeft, AlertCircle, Mail, Lock, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase";
import { User } from "../entities/User";
import EmailOtpVerification from "../Components/auth/EmailOtpVerification";
import StarfieldBackground from "../Components/ui/StarfieldBackground";

export default function CitizenAuth() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ full_name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState("credentials"); // 'credentials' | 'verify'

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!formData.full_name || !formData.email || !formData.password) {
        throw new Error("All fields are required");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error("Please enter a valid email address");
      }

      if (formData.password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      let firebaseUser;
      try {
        const credential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        firebaseUser = credential.user;
        await updateProfile(firebaseUser, { displayName: formData.full_name });
        await User.upsertProfile({ full_name: formData.full_name, email: formData.email });
      } catch (authErr) {
        if (authErr.code === "auth/email-already-in-use") {
          const credential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
          firebaseUser = credential.user;
        } else {
          throw authErr;
        }
      }

      // Verification status lives in a custom claim (see User.jsx) - always
      // re-check it fresh rather than assuming an unverified state, so a
      // returning already-verified citizen isn't sent through this again.
      const me = await User.refresh();
      if (me.contact_verified) {
        navigate("/CitizenMap");
      } else {
        setStep("verify");
      }
    } catch (err) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Incorrect password for this email.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        setError(err.message || "Something went wrong. Please try again.");
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
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(56,242,255,0.35)]">
                {step === "verify" ? (
                  <ShieldCheck className="w-8 h-8 text-white" />
                ) : (
                  <UserIcon className="w-8 h-8 text-white" />
                )}
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                {step === "verify" ? "Verify Your Email" : "Welcome, Citizen!"}
              </CardTitle>
              <p className="text-slate-400">
                {step === "verify"
                  ? "One more step - confirm your email so your reports carry real weight."
                  : "Create an UrbanOrbit account to report issues in your city"}
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {step === "credentials" && (
                <>
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => handleInputChange("full_name", e.target.value)}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Password *
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        placeholder="At least 6 characters"
                        required
                      />
                      <p className="text-xs text-slate-500">
                        New here? This creates your account. Already registered? Just
                        enter your password to sign in.
                      </p>
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full py-3">
                      {isLoading ? "Please wait..." : "Continue"}
                    </Button>
                  </form>
                </>
              )}

              {step === "verify" && (
                <EmailOtpVerification onVerified={() => navigate("/CitizenMap")} />
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
                <p>We never see or store your real password in plain text -</p>
                <p>Firebase Authentication handles it securely on our behalf.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
