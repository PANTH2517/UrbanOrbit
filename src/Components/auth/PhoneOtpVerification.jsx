import React, { useState } from "react";
import { auth } from "../../firebase";
import { User } from "../../entities/User";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle, CheckCircle, Phone, ShieldCheck } from "lucide-react";

/**
 * Verifies a real phone number for the signed-in Firebase Auth user via
 * 2Factor.in (api/sendOtp.js / api/verifyOtp.js) - UrbanOrbit's citizen
 * identity anchor (see docs/SECURITY.md). This intentionally isn't Firebase
 * Phone Auth: sending real SMS through Firebase requires the Blaze billing
 * plan (auth/billing-not-enabled otherwise), which this project avoids
 * everywhere else, so phone verification goes through a 2Factor.in instead.
 *
 * On a correct code, api/verifyOtp.js sets phone_verified/phone_number as
 * custom claims via the Admin SDK - the same trust pattern already used for
 * role - which firestore.rules then trusts and a citizen can never forge by
 * editing their own Firestore profile document.
 */
export default function PhoneOtpVerification({ onVerified }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("phone"); // 'phone' | 'otp' | 'done'
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const normalizePhone = (value) => {
    const digits = value.replace(/[^\d+]/g, "");
    if (digits.startsWith("+")) return digits;
    return `+91${digits}`; // default to India country code
  };

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

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");

    const fullPhone = normalizePhone(phone);
    if (!/^\+\d{10,15}$/.test(fullPhone)) {
      setError("Enter a valid phone number, e.g. 9876543210 or +919876543210");
      return;
    }

    setIsLoading(true);
    try {
      await callApi("/api/sendOtp", { phone: fullPhone });
      setStep("otp");
    } catch (err) {
      setError(err.message || "Could not send the verification code.");
    }
    setIsLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\d{4,6}$/.test(otp)) {
      setError("Enter the code sent to your phone.");
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
          Phone number verified.
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

      {step === "phone" && (
        <form onSubmit={handleSendOtp} className="space-y-3">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="w-4 h-4" /> Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="9876543210"
            required
          />
          <p className="text-xs text-slate-500">
            We verify every citizen report with a real SMS code to keep reports
            trustworthy. Your number is never shown publicly.
          </p>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Sending code..." : "Send Verification Code"}
          </Button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-3">
          <Label htmlFor="otp" className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Enter code
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
            onClick={() => {
              setStep("phone");
              setOtp("");
              setError("");
            }}
          >
            Use a different number
          </Button>
        </form>
      )}
    </div>
  );
}
