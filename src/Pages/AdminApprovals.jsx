import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { Button } from "../Components/ui/button";
import { Badge } from "../Components/ui/badge";
import { Alert, AlertDescription } from "../Components/ui/alert";
import { FileText, ShieldAlert, ScrollText, Terminal, Copy, Check, CheckCircle2, XCircle, ChevronDown, Building2, IdCard, Phone, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { OfficialApplication } from "../entities/OfficialApplication";
import { auth, db } from "../firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { useToast } from "../Components/ui/Toast";
import AllClearBadge from "../Components/vector/AllClearBadge";

export default function AdminApprovals() {
  const { showToast } = useToast();
  const [applications, setApplications] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);
  const [actingUid, setActingUid] = useState(null);
  const [showCliFor, setShowCliFor] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [apps, logSnap] = await Promise.all([
        OfficialApplication.listAll(),
        getDocs(query(collection(db, "auditLog"), orderBy("created_at", "desc"), limit(25))),
      ]);
      setApplications(apps);
      setAuditLog(logSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      setActionError(err.message || "Failed to load applications.");
    }
    setIsLoading(false);
  };

  const handleViewDocument = async (application) => {
    if (!application?.document_public_id) return;
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch("/api/getDocumentUrl", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          publicId: application.document_public_id,
          resourceType: application.document_resource_type || "image",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setActionError("Could not open document: " + (err.message || "unknown error"));
    }
  };

  const handleReview = async (uid, action) => {
    let reason;
    if (action === "reject") {
      reason = window.prompt("Rejection reason (optional):") || "";
    }
    setActingUid(uid);
    setActionError("");
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch("/api/reviewApplication", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ uid, action, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      showToast(action === "approve" ? "Official approved." : "Application rejected.", "success");
      await loadData();
    } catch (err) {
      setActionError(err.message || "Action failed.");
      showToast(err.message || "Action failed.", "error");
    }
    setActingUid(null);
  };

  const copyCommand = async (key, command) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      window.prompt("Copy this command:", command);
    }
  };

  const pending = applications.filter((a) => a.status === "pending");
  const reviewed = applications.filter((a) => a.status !== "pending");

  return (
    <div className="p-4 md:p-6 min-h-screen text-white">
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-violet-400" /> Admin <span className="uo-gradient-text">Approvals</span>
          </h1>
          <p className="text-slate-400">Review government official applications and audit privileged actions.</p>
        </motion.div>

        {actionError && (
          <Alert variant="destructive">
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Pending Applications ({pending.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && <p className="text-slate-500 text-sm">Loading...</p>}
            {!isLoading && pending.length === 0 && (
              <div className="py-4 text-center">
                <AllClearBadge />
                <p className="text-slate-500 text-sm mt-2">No applications waiting for review.</p>
              </div>
            )}
            {pending.map((app) => (
              <div key={app.id} className="border border-white/10 rounded-lg p-4 bg-white/[0.02] space-y-3">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <p className="font-semibold text-white text-lg">{app.full_name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                      <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {app.email}</span>
                      <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {app.department}</span>
                      <span className="flex items-center gap-1.5"><IdCard className="w-3.5 h-3.5" /> ID: {app.employee_id}</span>
                      <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {app.phone_number}</span>
                    </div>
                    <p className="text-xs text-slate-600 font-mono">uid: {app.uid}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleViewDocument(app)} className="shrink-0">
                    <FileText className="w-4 h-4 mr-2" /> View Document
                  </Button>
                </div>

                <div className="flex gap-2 flex-wrap pt-2 border-t border-white/10">
                  <Button
                    size="sm"
                    onClick={() => handleReview(app.uid, "approve")}
                    disabled={actingUid === app.uid}
                    className="!bg-gradient-to-r !from-emerald-500 !to-teal-500"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {actingUid === app.uid ? "Approving..." : "Approve"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReview(app.uid, "reject")}
                    disabled={actingUid === app.uid}
                    className="!border-red-400/30 !text-red-300 hover:!bg-red-500/10"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {actingUid === app.uid ? "Rejecting..." : "Reject"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowCliFor(showCliFor === app.uid ? null : app.uid)}
                    className="text-slate-500 ml-auto"
                  >
                    <Terminal className="w-3.5 h-3.5 mr-2" />
                    CLI alternative
                    <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform ${showCliFor === app.uid ? "rotate-180" : ""}`} />
                  </Button>
                </div>

                {showCliFor === app.uid && (
                  <div className="flex gap-2 flex-wrap pt-2 border-t border-white/10">
                    <p className="text-xs text-slate-500 w-full">
                      Same result, run from the project root on a machine with{" "}
                      <code className="font-mono text-cyan-300">serviceAccountKey.json</code> instead:
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyCommand(`${app.uid}-approve`, `node scripts/admin-cli.js approve ${app.uid}`)}
                      className="!border-emerald-400/30 !text-emerald-300 hover:!bg-emerald-500/10"
                    >
                      {copiedKey === `${app.uid}-approve` ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      Copy Approve Command
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyCommand(`${app.uid}-reject`, `node scripts/admin-cli.js reject ${app.uid} "reason"`)}
                      className="!border-red-400/30 !text-red-300 hover:!bg-red-500/10"
                    >
                      {copiedKey === `${app.uid}-reject` ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      Copy Reject Command
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reviewed Applications ({reviewed.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviewed.map((app) => (
              <div key={app.id} className="flex items-center justify-between text-sm border-b border-white/10 pb-2 text-slate-300">
                <span>{app.full_name} ({app.email})</span>
                <Badge variant={app.status === "approved" ? "default" : "destructive"}>{app.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="w-5 h-5" /> Audit Log
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {auditLog.length === 0 && <p className="text-slate-500 text-sm">No audited actions yet.</p>}
            {auditLog.map((entry) => (
              <div key={entry.id} className="text-xs md:text-sm text-slate-300 border-b border-white/10 pb-2 flex flex-wrap gap-x-2">
                <span className="font-mono text-slate-500">
                  {entry.created_at?.toDate ? entry.created_at.toDate().toLocaleString() : "..."}
                </span>
                <span className="font-semibold text-cyan-300">{entry.action}</span>
                <span className="text-slate-500">by {entry.actor_email || entry.actor_uid}</span>
                {entry.target && <span className="text-slate-500">-&gt; {entry.target}</span>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
