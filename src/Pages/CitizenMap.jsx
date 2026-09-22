import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Issue } from "../entities/Issues";
import { Button } from "../Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import AnimatedCounter from "../Components/ui/AnimatedCounter";
import LiveActivityFeed, { LiveBadge } from "../Components/ui/LiveActivityFeed";
import { Plus, MapPin, Thermometer, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../Components/ui/select";

import UrbanMap from "../Components/map/MapContainer";
import { problemTypes } from "../Components/problems/ProblemSelector";
import ReportIssueDialog from "../Components/citizen/ReportIssueDialog";
import ThermalHeatMap from "../Components/map/ThermalHeatMap";
import { useToast } from "../Components/ui/Toast";

export default function CitizenMap() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [issues, setIssues] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [clickMarker, setClickMarker] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [issueStats, setIssueStats] = useState({});

  // Load issues on mount
  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    setIsLoading(true);
    try {
      const fetchedIssues = (await Issue.list('-created_date')) || [];
      setIssues(fetchedIssues);

      // Calculate stats
      const stats = {};
      fetchedIssues.forEach(issue => {
        stats[issue.problem_type] = (stats[issue.problem_type] || 0) + 1;
      });
      setIssueStats(stats);
    } catch (err) {
      console.error("Failed to load issues", err);
      setIssues([]);
      setIssueStats({});
    }
    setIsLoading(false);
  };

  const handleMapClick = (e) => {
    if (selectedProblem === 'urban_heat_islands' || selectedProblem === 'green_inequality') return;
    const { lat, lng } = e.latlng;
    setClickMarker({ lat, lng });
    setShowReportDialog(true);
  };

  const handleReportSubmit = async (reportData) => {
    try {
      await Issue.create(reportData);
      setShowReportDialog(false);
      setClickMarker(null);
      loadIssues();
    } catch (err) {
      console.error("Failed to report issue", err);
      if (err.code === "permission-denied" || err.message?.includes("sign in")) {
        showToast("Please sign in before reporting an issue.", "warning");
        navigate("/CitizenAuth");
      } else {
        showToast("Failed to submit report. Please try again.", "error");
      }
    }
  };

  const handleCloseReport = () => {
    setShowReportDialog(false);
    setClickMarker(null);
  };

  const showThermalMap = selectedProblem === 'urban_heat_islands' || selectedProblem === 'green_inequality';
  // Reporting is available whenever a real, reportable view is showing -
  // including "All Problems" (selectedProblem === null), not just when a
  // specific category is picked. ReportIssueDialog has its own Problem Type
  // dropdown, so nothing upstream needs a category pre-selected to report.
  // Only the two satellite-data-only views (Heat Islands, Green Spaces)
  // aren't real citizen-report categories, so those are excluded.
  const canReportIssue = !showThermalMap;
  const totalIssues = issues.length;

  const selectedMeta = problemTypes.find((p) => p.id === selectedProblem);

  return (
    <div className="p-4 md:p-6 text-white h-full flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex flex-col flex-1 min-h-0">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-3"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1 flex items-center gap-3">
              Citizen Dashboard
              <LiveBadge />
            </h1>
            <p className="text-sm text-slate-400">
              Interactive map showing real-time urban problems and citizen reports -{" "}
              <span className="text-cyan-300 font-semibold"><AnimatedCounter value={totalIssues} /></span> reports tracked
            </p>
          </div>

          {canReportIssue && (
            <Button onClick={() => setShowReportDialog(true)} className="uo-glow-btn">
              <Plus className="w-5 h-5 mr-2" />
              Report Issue
            </Button>
          )}
        </motion.div>

        {/* Compact problem-type filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
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

          {showThermalMap && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-400/30 rounded-xl text-sm">
              <Thermometer className="w-4 h-4 text-orange-400" />
              <span className="text-orange-300 font-medium">Thermal Data View</span>
            </div>
          )}
        </motion.div>

        {/* Map + Live Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0"
        >
          <Card className="overflow-hidden lg:col-span-2 flex flex-col">
            <CardContent className="p-0 flex-1 min-h-0">
              {showThermalMap ? (
                <ThermalHeatMap selectedProblem={selectedProblem} height="100%" />
              ) : (
                <UrbanMap
                  issues={issues}
                  selectedProblem={selectedProblem}
                  onMapClick={handleMapClick}
                  clickMarker={clickMarker}
                  height="100%"
                  showLegend={false}
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

        {/* Report Dialog - clickMarker may be null here (opened via the
            "Report Issue" button rather than a map click); ReportIssueDialog
            already handles that by offering "Use My Current Location". */}
        {canReportIssue && showReportDialog && (
          <ReportIssueDialog
            isOpen={showReportDialog}
            onClose={handleCloseReport}
            onSubmit={handleReportSubmit}
            clickMarker={clickMarker}
          />
        )}
      </div>
    </div>
  );
}
