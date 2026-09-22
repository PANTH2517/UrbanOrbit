import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Issue } from "../entities/Issues";
import { Button } from "../Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import AnimatedCounter from "../Components/ui/AnimatedCounter";
import LiveActivityFeed, { LiveBadge } from "../Components/ui/LiveActivityFeed";
import { Plus, MapPin, Thermometer, Activity } from "lucide-react";
import { motion } from "framer-motion";

import UrbanMap from "../Components/map/MapContainer";
import ProblemSelector from "../Components/problems/ProblemSelector";
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
    if (!selectedProblem || selectedProblem === 'urban_heat_islands' || selectedProblem === 'green_inequality') return;
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
  const canReportIssue = selectedProblem && !showThermalMap;
  const totalIssues = issues.length;

  return (
    <div className="p-4 md:p-6 min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              Citizen Dashboard
              <LiveBadge />
            </h1>
            <p className="text-slate-400">
              Interactive map showing real-time urban problems and citizen reports -{" "}
              <span className="text-cyan-300 font-semibold"><AnimatedCounter value={totalIssues} /></span> reports tracked
            </p>
          </div>

          {canReportIssue && (
            <Button size="lg" onClick={() => setShowReportDialog(true)} className="uo-glow-btn">
              <Plus className="w-5 h-5 mr-2" />
              Report Issue
            </Button>
          )}

          {showThermalMap && (
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-400/30 rounded-xl">
              <Thermometer className="w-5 h-5 text-orange-400" />
              <span className="text-orange-300 font-medium">Thermal Data View</span>
            </div>
          )}
        </motion.div>

        {/* Problem Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400" /> Select Problem Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProblemSelector
                selectedProblem={selectedProblem}
                onProblemSelect={setSelectedProblem}
                issueStats={issueStats}
                layout="grid"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Map + Live Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <Card className="overflow-hidden lg:col-span-2">
            <CardContent className="p-0">
              {showThermalMap ? (
                <ThermalHeatMap selectedProblem={selectedProblem} height="600px" />
              ) : (
                <UrbanMap
                  issues={issues}
                  selectedProblem={selectedProblem}
                  onMapClick={handleMapClick}
                  clickMarker={clickMarker}
                  height="600px"
                  showLegend={false}
                />
              )}
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
