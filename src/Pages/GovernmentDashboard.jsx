import React, { useState, useEffect } from "react";
import { Issue } from "../entities/Issues";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import AnimatedCounter from "../Components/ui/AnimatedCounter";
import LiveActivityFeed, { LiveBadge } from "../Components/ui/LiveActivityFeed";
import { AlertCircle, CheckCircle2, Clock, TrendingUp, Activity, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../Components/ui/select";

import UrbanMap from "../Components/map/MapContainer";
import ThermalHeatMap from "../Components/map/ThermalHeatMap";
import { problemTypes } from "../Components/problems/ProblemSelector";
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

  // Heat Islands / Green Spaces aren't citizen-reported categories - they're
  // real NASA satellite proxies (see ThermalHeatMap.jsx). Without this, an
  // official selecting them here just sees an empty map with zero markers,
  // unlike CitizenMap.jsx which already shows the satellite overlay.
  const showThermalMap = selectedProblem === "urban_heat_islands" || selectedProblem === "green_inequality";
  const selectedMeta = problemTypes.find((p) => p.id === selectedProblem);
  const totalIssues = issues.length;

  return (
    <div className="p-4 md:p-6 text-white h-full flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex flex-col flex-1 min-h-0">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-3"
        >
          <h1 className="text-2xl md:text-3xl font-bold mb-1 flex items-center gap-3">
            Government <span className="uo-gradient-text">Dashboard</span>
            <LiveBadge />
          </h1>
          <p className="text-sm text-slate-400">
            Monitor and manage urban issues across {getActiveCity().name}
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4"
        >
          {STAT_CARDS.map((card) => (
            <Card key={card.key} className={card.glow}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-400">{card.label}</p>
                    <p className="text-2xl font-bold text-white">
                      <AnimatedCounter value={stats[card.key]} />
                    </p>
                  </div>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Compact problem-type filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="flex flex-wrap items-center gap-3 mb-4"
        >
          <div className="flex items-center gap-2 text-sm text-slate-400 shrink-0">
            <MapPin className="w-4 h-4 text-cyan-400" /> Filter:
          </div>
          <Select value={selectedProblem || "all"} onValueChange={(v) => setSelectedProblem(v === "all" ? null : v)}>
            <SelectTrigger className="w-64">
              <SelectValue>
                <span className="flex items-center gap-2">
                  <span>{selectedMeta?.icon || "🌍"}</span>
                  {selectedMeta?.label || "All Problems"}
                  <span className="text-slate-500">
                    ({selectedMeta ? issueStats[selectedMeta.id] || 0 : totalIssues})
                  </span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🌍 All Problems ({totalIssues})</SelectItem>
              {problemTypes.map((problem) => (
                <SelectItem key={problem.id} value={problem.id}>
                  {problem.icon} {problem.label} ({issueStats[problem.id] || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Map + Live Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0"
        >
          <Card className="overflow-hidden lg:col-span-2 flex flex-col">
            <CardHeader>
              <CardTitle>Issues Map Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0">
              {showThermalMap ? (
                <ThermalHeatMap selectedProblem={selectedProblem} height="100%" />
              ) : (
                <UrbanMap
                  issues={issues}
                  selectedProblem={selectedProblem}
                  height="100%"
                />
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-1 flex flex-col min-h-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" /> Live Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-y-auto">
              <LiveActivityFeed />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
