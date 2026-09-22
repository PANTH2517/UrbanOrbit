import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { Input } from "../Components/ui/input";
import { Label } from "../Components/ui/label";
import { Alert, AlertDescription } from "../Components/ui/alert";
import { Badge } from "../Components/ui/badge";
import { Upload, ArrowLeft, AlertCircle, Clock, CheckCircle2, XCircle, KeyRound, Copy, Check, RefreshCw, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { auth } from "../firebase";
import { UploadOfficialDocument } from "../../integrations/Core.jsx";
import { OfficialApplication } from "../entities/OfficialApplication";
import { User } from "../entities/User";
import { createPageUrl } from "../utils";
import StarfieldBackground from "../Components/ui/StarfieldBackground";
import useSmoothScroll from "../Components/useSmoothScroll";
import ClipboardBadge from "../Components/vector/ClipboardBadge";

const SUPER_ADMIN_EMAIL = (import.meta.env.VITE_SUPER_ADMIN_EMAIL || "").toLowerCase();

export default function GovernmentRegister() {
  useSmoothScroll();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState(null);
  const [isSuperAdminEmail, setIsSuperAdminEmail] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ full_name: "", department: "", employee_id: "", phone_number: "" });
  const [file, setFile] = useState(null);
  const [copied, setCopied] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Wait for Firebase Auth to restore any persisted session before
      // deciding whether to redirect - reading auth.currentUser synchronously
      // here would false-positive redirect signed-in users on a page refresh.
      let me;
      try {
        me = await User.me();
      } catch {
        me = null;
      }
      if (cancelled) return;
      if (!me) {
        navigate("/GovernmentLogin");
        return;
      }
      setIsSuperAdminEmail((me.email || "").toLowerCase() === SUPER_ADMIN_EMAIL);
      const existing = await OfficialApplication.getMine();
      if (cancelled) return;
      setApplication(existing);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // Custom claims (roles) only update once the client fetches a fresh ID
  // token - a plain page refresh reuses the cached one until it naturally
  // expires. This forces a fresh token and routes immediately if it now
  // carries a role, instead of leaving an approved official stuck here with
  // no way forward.
  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    setError("");
    try {
      const me = await User.refresh();
      if (me.role === "admin") {
        navigate("/AdminApprovals");
        return;
      }
      if (me.role === "government_official") {
        navigate(createPageUrl("GovernmentDashboard"));
        return;
      }
      setApplication(await OfficialApplication.getMine());
    } catch (err) {
      setError(err.message || "Could not check status. Please try again.");
    }
    setCheckingStatus(false);
  };

  const handleSignOut = async () => {
    await User.logout();
    navigate("/GovernmentLogin");
  };

  const handleCopySeedCommand = async () => {
    const command = `node scripts/admin-cli.js seed-admin ${SUPER_ADMIN_EMAIL}`;
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this command:", command);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.full_name || !form.department || !form.employee_id || !form.phone_number) {
      setError("All fields are required.");
      return;
    }
    if (!file) {
      setError("Please upload a document proving your official authorization (ID card, appointment letter, etc.).");
      return;
    }

    setIsSubmitting(true);
    try {
      const { public_id, resource_type } = await UploadOfficialDocument(file);
      await OfficialApplication.submit({
        ...form,
        document_public_id: public_id,
        document_resource_type: resource_type,
      });
      setApplication(await OfficialApplication.getMine());
    } catch (err) {
      setError(err.message || "Submission failed. Please try again.");
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <StarfieldBackground />
        <div className="relative z-10 animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden text-white px-6 py-12">
      <StarfieldBackground />
      <div className="relative z-10 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card>
            <CardHeader className="text-center pb-6">
              <div className="w-20 h-20 mx-auto mb-2">
                <ClipboardBadge />
              </div>
              <CardTitle className="text-2xl font-bold text-white">Official Verification</CardTitle>
              <p className="text-slate-400">
                UrbanOrbit has no external registry to check officials against, so a
                human super-admin reviews every application before dashboard access
                is granted.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-red-500/20 border-red-500/30">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-100">{error}</AlertDescription>
                </Alert>
              )}

              {isSuperAdminEmail && (
                <Alert className="bg-amber-500/10 border-amber-400/30">
                  <KeyRound className="h-4 w-4 text-amber-300" />
                  <AlertDescription className="text-amber-100 flex flex-col gap-3">
                    <span>
                      This is the designated super-admin account. Run this command from the
                      project root on your own machine to grant yourself admin access (see{" "}
                      <code className="font-mono text-xs">scripts/admin-cli.js</code> for one-time setup):
                    </span>
                    <Button
                      type="button"
                      onClick={handleCopySeedCommand}
                      className="w-fit bg-amber-500 hover:bg-amber-600"
                    >
                      {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      Copy Command
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {application ? (
                <div className="space-y-4">
                  <ApplicationStatus application={application} />
                  <Button
                    type="button"
                    onClick={handleCheckStatus}
                    disabled={checkingStatus}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${checkingStatus ? "animate-spin" : ""}`} />
                    {checkingStatus ? "Checking..." : "Check My Status"}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      value={form.full_name}
                      onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Department *</Label>
                    <Input
                      value={form.department}
                      onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                      placeholder="e.g. Pune Municipal Corporation - Public Works"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Employee ID *</Label>
                    <Input
                      value={form.employee_id}
                      onChange={(e) => setForm((p) => ({ ...p, employee_id: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number *</Label>
                    <Input
                      type="tel"
                      value={form.phone_number}
                      onChange={(e) => setForm((p) => ({ ...p, phone_number: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Upload className="w-4 h-4" /> Authorization Document *
                    </Label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setFile(e.target.files[0] || null)}
                      className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-violet-500 file:to-fuchsia-500 file:text-white hover:file:brightness-110"
                    />
                    <p className="text-xs text-slate-500">
                      ID card, appointment letter, or department authorization - max 10MB.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full !bg-gradient-to-r !from-violet-500 !via-fuchsia-500 !to-pink-500"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </Button>
                </form>
              )}

              <div className="flex items-center justify-center gap-2">
                <Button variant="ghost" onClick={() => navigate(createPageUrl("RoleSelection"))}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Role Selection
                </Button>
                <Button variant="ghost" onClick={handleSignOut} className="text-slate-400 hover:text-red-400">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function ApplicationStatus({ application }) {
  if (application.status === "pending") {
    return (
      <Alert className="bg-amber-500/10 border-amber-400/30">
        <Clock className="h-4 w-4 text-amber-300" />
        <AlertDescription className="text-amber-100">
          Your application is <Badge variant="outline" className="mx-1 bg-transparent text-amber-100 border-amber-300">pending review</Badge>
          by an administrator. You'll get dashboard access as soon as it's approved.
        </AlertDescription>
      </Alert>
    );
  }
  if (application.status === "approved") {
    return (
      <Alert className="bg-green-500/10 border-green-400/30">
        <CheckCircle2 className="h-4 w-4 text-green-300" />
        <AlertDescription className="text-green-100">
          Approved! Click "Check My Status" below to pick up your official access.
        </AlertDescription>
      </Alert>
    );
  }
  return (
    <Alert className="bg-red-500/10 border-red-400/30">
      <XCircle className="h-4 w-4 text-red-300" />
      <AlertDescription className="text-red-100">
        Your application was {application.status}
        {application.rejection_reason ? `: ${application.rejection_reason}` : "."} Contact
        your administrator if you believe this is a mistake.
      </AlertDescription>
    </Alert>
  );
}
