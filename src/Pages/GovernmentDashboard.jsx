import React, { useState, useEffect } from "react";
import { Issue } from "../entities/Issues";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import AnimatedCounter from "../Components/ui/AnimatedCounter";
import LiveActivityFeed, { LiveBadge } from "../Components/ui/LiveActivityFeed";
import { AlertCircle, CheckCircle2, Clock, TrendingUp, Activity } from "lucide-react";
import { motion } from "framer-motion";

import UrbanMap from "../Components/map/MapContainer";
import ProblemSelector from "../Components/problems/ProblemSelector";
import { getActiveCity } from "../config/cities";

const STAT_CARDS = [
  { key: "total", label: "Total Issues", icon: AlertCircle, color: "text-cyan-400", glow: "shadow-[0_0_20px_rgba(56,242,255,0.15)]" },
  { key: "pending", label: "Pending", icon: Clock, color: "text-red-400", glow: "shadow-[0_0_20px_rgba(248,113,113,0.15)]" },
  { key: "inProgress", label: "In Progress", icon: TrendingUp, color: "text-amber-400", glow: "shadow-[0_0_20px_rgba(251,191,36,0.15)]" },
  { key: "completed", label: "Completed", icon: CheckCircle2, color: "text-emerald-400", glow: "shadow-[0_0_20px_rgba(52,211,153,0.15)]" },
];

export default function GovernmentDashboard() {
  const [issues, setIssues] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    setIsLoading(true);

    const fetchedIssues = await Issue.getAllIssues();
    setIssues(fetchedIssues);

    const newStats = {
      total: fetchedIssues.length,
      pending: fetchedIssues.filter(i => i.status === "pending").length,
      inProgress: fetchedIssues.filter(i => i.status === "in_progress").length,
      completed: fetchedIssues.filter(i => i.status === "completed").length,
    };
    setStats(newStats);

    setIsLoading(false);
  };

  // Build stats for ProblemSelector
  const issueStats = {};
  issues.forEach(issue => {
    issueStats[issue.problem_type] = (issueStats[issue.problem_type] || 0) + 1;
  });

  return (
    <div className="p-4 md:p-6 min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
            Government <span className="uo-gradient-text">Dashboard</span>
            <LiveBadge />
          </h1>
          <p className="text-slate-400">
            Monitor and manage urban issues across {getActiveCity().name}
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          {STAT_CARDS.map((card) => (
            <Card key={card.key} className={card.glow}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">{card.label}</p>
                    <p className="text-3xl font-bold text-white">
                      <AnimatedCounter value={stats[card.key]} />
                    </p>
                  </div>
                  <card.icon className={`w-8 h-8 ${card.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Problem Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter by Problem Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ProblemSelector
                selectedProblem={selectedProblem}
                onProblemSelect={setSelectedProblem}
                issueStats={issueStats}
                layout="tabs"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Map + Live Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <Card className="overflow-hidden lg:col-span-2">
            <CardHeader>
              <CardTitle>Issues Map Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <UrbanMap
                issues={issues}
                selectedProblem={selectedProblem}
                height="600px"
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" /> Live Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              <LiveActivityFeed />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
