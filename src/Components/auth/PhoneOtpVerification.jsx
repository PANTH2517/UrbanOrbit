import React, { useEffect, useRef, useState } from "react";
import { RecaptchaVerifier, linkWithPhoneNumber } from "firebase/auth";
import { auth } from "../../firebase";
import { User } from "../../entities/User";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle, CheckCircle, Phone, ShieldCheck } from "lucide-react";

/**
 * Links a real, SMS-verified phone number to the signed-in Firebase Auth user.
 * This is UrbanOrbit's citizen identity anchor (see docs/SECURITY.md for why
 * this replaces Aadhaar/UIDAI eKYC, which isn't achievable without a licensed
 * AUA/KUA business registration).
 *
 * Firestore/Storage security rules trust request.auth.token.phone_number, which
 * Firebase itself only sets once this flow completes - never a client-writable
 * field - so this verification can't be spoofed from the browser.
 */
export default function PhoneOtpVerification({ onVerified }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("phone"); // 'phone' | 'otp' | 'done'
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const confirmationRef = useRef(null);
  const recaptchaRef = useRef(null);

  // Create the verifier exactly once and reuse/reset it across retries -
  // instantiating a second RecaptchaVerifier into the same DOM node throws
  // "reCAPTCHA has already been rendered in this element".
  useEffect(() => {
    recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
    });
    return () => {
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
    };
  }, []);

  const resetRecaptcha = async () => {
    try {
      const widgetId = await recaptchaRef.current?.render();
      if (widgetId != null && window.grecaptcha) {
        window.grecaptcha.reset(widgetId);
      }
    } catch {
      // best-effort - a fresh render() on the next submit attempt still works
    }
  };

  const normalizePhone = (value) => {
    const digits = value.replace(/[^\d+]/g, "");
    if (digits.startsWith("+")) return digits;
    return `+91${digits}`; // default to India country code
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
      const confirmation = await linkWithPhoneNumber(auth.currentUser, fullPhone, recaptchaRef.current);
      confirmationRef.current = confirmation;
      setStep("otp");
    } catch (err) {
      if (err.code === "auth/credential-already-in-use" || err.code === "auth/provider-already-linked") {
        setError("This phone number is already linked to an account.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else if (err.code === "auth/invalid-phone-number") {
        setError("That phone number looks invalid. Double-check the digits.");
      } else {
        setError(err.message || "Could not send the verification code.");
      }
      await resetRecaptcha();
    }
    setIsLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code sent to your phone.");
      return;
    }

    setIsLoading(true);
    try {
      await confirmationRef.current.confirm(otp);
      await User.upsertProfile({ phone_number: normalizePhone(phone) });
      await User.refresh();
      setStep("done");
      onVerified?.();
    } catch (err) {
      if (err.code === "auth/invalid-verification-code") {
        setError("That code isn't right. Please try again.");
      } else if (err.code === "auth/code-expired") {
        setError("That code expired. Request a new one.");
        setStep("phone");
      } else {
        setError(err.message || "Verification failed.");
      }
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
      <div id="recaptcha-container" />
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
            <ShieldCheck className="w-4 h-4" /> Enter 6-digit code
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
