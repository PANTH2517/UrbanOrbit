import React, { useState } from "react";
import { auth } from "../../firebase";
import { User } from "../../entities/User";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle, CheckCircle, Mail, ShieldCheck } from "lucide-react";

/**
 * Verifies the signed-in Firebase Auth user can actually receive mail at
 * the email address they signed up with - UrbanOrbit's citizen identity
 * anchor (see docs/SECURITY.md). This is deliberately not phone/SMS
 * verification: real SMS costs money everywhere (Firebase Phone Auth
 * requires the Blaze billing plan; dedicated SMS APIs charge directly),
 * which this project avoids, so verification goes through email instead -
 * a genuinely free path, at the honest cost of a weaker anti-bot signal
 * than a real phone number (email addresses are free and instant to create
 * in bulk).
 *
 * On a correct code, api/verifyOtp.js sets contact_verified as a custom
 * claim via the Admin SDK - the same trust pattern already used for role -
 * which firestore.rules then trusts and a citizen can never forge by
 * editing their own Firestore profile document.
 */
export default function EmailOtpVerification({ onVerified }) {
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("idle"); // 'idle' | 'sent' | 'done'
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const email = auth.currentUser?.email;

  const callApi = async (path, body) => {
    const idToken = await auth.currentUser.getIdToken();
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  };

  const handleSendOtp = async () => {
    setError("");
    setIsLoading(true);
    try {
      await callApi("/api/sendOtp", {});
      setStep("sent");
    } catch (err) {
      setError(err.message || "Could not send the verification code.");
    }
    setIsLoading(false);
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
      await callApi("/api/verifyOtp", { otp });
      await User.refresh();
      setStep("done");
      onVerified?.();
    } catch (err) {
      setError(err.message || "Verification failed.");
    }
    setIsLoading(false);
  };

  if (step === "done") {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Email verified.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {step === "idle" && (
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Mail className="w-4 h-4" /> Verify {email}
          </Label>
          <p className="text-xs text-slate-500">
            We'll send a 6-digit code to your email to keep reports trustworthy.
          </p>
          <Button onClick={handleSendOtp} disabled={isLoading} className="w-full">
            {isLoading ? "Sending code..." : "Send Verification Code"}
          </Button>
        </div>
      )}

      {step === "sent" && (
        <form onSubmit={handleVerifyOtp} className="space-y-3">
          <Label htmlFor="otp" className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Enter the code sent to {email}
          </Label>
          <Input
            id="otp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            required
          />
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Verifying..." : "Verify Code"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={handleSendOtp}
            disabled={isLoading}
          >
            Resend Code
          </Button>
        </form>
      )}
    </div>
  );
}
