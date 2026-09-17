import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { Input } from "../Components/ui/input";
import { Label } from "../Components/ui/label";
import { Alert, AlertDescription } from "../Components/ui/alert";
import StarfieldBackground from "../Components/ui/StarfieldBackground";
import { KeyRound, Lock, Mail, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { User } from "../entities/User";

// Deliberately unlinked from RoleSelection/GovernmentLogin - reachable only
// by URL. Unlike GovernmentLogin.jsx, this NEVER creates an account on a
// failed sign-in and NEVER routes anyone into the officialApplications flow -
// it only signs in an account that already carries the admin custom claim
// (granted via scripts/admin-cli.js seed-admin), and immediately signs back
// out if it doesn't. This is a second entry point, not a second way to
// become an admin.
export default function AdminLogin() {
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

      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const me = await User.me();

      if (me.role !== "admin") {
        await signOut(auth);
        throw new Error("This account does not have admin access.");
      }

      navigate("/AdminApprovals");
    } catch (err) {
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found"
      ) {
        // Deliberately generic - don't reveal whether the email exists.
        setError("Invalid email or password.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        setError(err.message || "Login failed.");
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
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(251,191,36,0.35)]">
                <KeyRound className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">Admin Access</CardTitle>
              <p className="text-slate-400">Restricted to the platform administrator.</p>
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
                    <Mail className="w-4 h-4" /> Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
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
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 !bg-gradient-to-r !from-amber-500 !to-orange-600"
                >
                  {isLoading ? "Please wait..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
