import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { Button } from "../Components/ui/button";
import { Badge } from "../Components/ui/badge";
import { Alert, AlertDescription } from "../Components/ui/alert";
import { FileText, ShieldAlert, ScrollText, Terminal, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { OfficialApplication } from "../entities/OfficialApplication";
import { auth, db } from "../firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

export default function AdminApprovals() {
  const [applications, setApplications] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);

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

        <Alert>
          <Terminal className="h-4 w-4 text-cyan-400" />
          <AlertDescription className="text-slate-300">
            Approving/rejecting runs as a command on your own machine (no billing
            account needed) - copy a command below and run it from the project
            root, e.g. <code className="font-mono text-xs text-cyan-300">node scripts/admin-cli.js approve &lt;uid&gt;</code>.
            See <code className="font-mono text-xs text-cyan-300">scripts/admin-cli.js</code> for setup.
          </AlertDescription>
        </Alert>

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
              <p className="text-slate-500 text-sm">No applications waiting for review.</p>
            )}
            {pending.map((app) => (
              <div key={app.id} className="border border-white/10 rounded-lg p-4 flex flex-col md:flex-row md:items-start justify-between gap-4 bg-white/[0.02]">
                <div>
                  <p className="font-semibold text-white">{app.full_name}</p>
                  <p className="text-sm text-slate-400">{app.email} - {app.department}</p>
                  <p className="text-xs text-slate-500">Employee ID: {app.employee_id} - Phone: {app.phone_number}</p>
                  <p className="text-xs text-slate-600 font-mono mt-1">uid: {app.uid}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => handleViewDocument(app)}>
                    <FileText className="w-4 h-4 mr-2" /> Document
                  </Button>
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
              </div>
            ))}
            {pending.length > 0 && (
              <Button size="sm" variant="ghost" onClick={loadData}>
                Refresh after running a command
              </Button>
            )}
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
