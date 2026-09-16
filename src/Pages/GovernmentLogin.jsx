import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "../Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { Input } from "../Components/ui/input";
import { Label } from "../Components/ui/label";
import { Alert, AlertDescription } from "../Components/ui/alert";
import StarfieldBackground from "../Components/ui/StarfieldBackground";
import { Shield, Lock, Mail, ArrowLeft, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { User } from "../entities/User";

export default function GovernmentLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!formData.email || !formData.password) {
        throw new Error("Email and password are required");
      }
      if (formData.password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      try {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } catch (authErr) {
        if (authErr.code === "auth/user-not-found" || authErr.code === "auth/invalid-credential") {
          // First time here: this account doesn't exist yet, create it and route
          // to the application form - nobody gets dashboard access just by
          // signing up, only after an admin approves them.
          await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        } else {
          throw authErr;
        }
      }

      const me = await User.me();
      if (me.role === "admin") {
        navigate("/AdminApprovals");
      } else if (me.role === "government_official") {
        navigate(createPageUrl("GovernmentDashboard"));
      } else {
        navigate("/GovernmentRegister");
      }
    } catch (err) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Incorrect password for this email.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Check your password.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        setError(err.message || "Login failed. Please check your credentials.");
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden text-white">
      <StarfieldBackground />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-400 to-fuchsia-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(162,89,255,0.35)]">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Government Portal
              </CardTitle>
              <p className="text-slate-400">
                Sign in with your official email. New here? Signing in for the
                first time starts your verification application.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Official Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="you@municipality.gov.in"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 !bg-gradient-to-r !from-violet-500 !via-fuchsia-500 !to-pink-500"
                >
                  {isLoading ? "Please wait..." : "Continue"}
                </Button>
              </form>

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
