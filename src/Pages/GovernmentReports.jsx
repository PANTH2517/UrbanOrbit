import React, { useState, useEffect } from "react";
import { Issue } from "../entities/Issues";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { Button } from "../Components/ui/button";
import { Badge } from "../Components/ui/badge.jsx";
import AnimatedCounter from "../Components/ui/AnimatedCounter";
import { Download, FileText, BarChart3, TrendingUp, Calendar, Clock } from "lucide-react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { problemTypes } from "../Components/problems/ProblemSelector";
import { InvokeLLM } from "../../integrations/Core.jsx";
import { getActiveCity } from "../config/cities";
import { buildDailyTrend, buildResolutionTimeByCategory } from "../lib/reportAnalytics";

const CHART_TOOLTIP_STYLE = {
  background: "rgba(10,14,31,0.95)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "8px",
  color: "#e2e8f0",
  fontSize: "12px",
};

export default function GovernmentReports() {
  const [issues, setIssues] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const fetchedIssues = await Issue.list('-created_date');
    setIssues(fetchedIssues);

    // Calculate analytics
    const problemStats = {};
    const statusStats = { pending: 0, in_progress: 0, completed: 0 };
    const priorityStats = { low: 0, medium: 0, high: 0, urgent: 0 };

    fetchedIssues.forEach(issue => {
      problemStats[issue.problem_type] = (problemStats[issue.problem_type] || 0) + 1;
      statusStats[issue.status] = (statusStats[issue.status] || 0) + 1;
      priorityStats[issue.priority || 'medium'] = (priorityStats[issue.priority || 'medium'] || 0) + 1;
    });

    setAnalytics({ problemStats, statusStats, priorityStats });
    setIsLoading(false);
  };

  const getRecommendationForIssue = async (issue) => {
    const prompt = `
      Provide a one-sentence, practical recommendation for this urban issue in ${getActiveCity().name}, India.
      Issue: ${issue.title} (${issue.problem_type.replace(/_/g, ' ')}).
      Description: ${issue.description}.
      Focus on a single, actionable step.
    `;
    try {
      const result = await InvokeLLM({ prompt });
      // Sanitize result by removing quotes and newlines
      return result.replace(/["\n]/g, '').trim();
    } catch {
      return "N/A";
    }
  };

  const exportToCSV = async (type = 'all') => { // Renamed from exportToPDF to exportToCSV for clarity
    setIsExporting(true);
    setExportProgress(0);

    try {
      const filteredIssues = type === 'all'
        ? issues
        : issues.filter(issue => issue.problem_type === type);

      const headers = ['Issue ID', 'Title', 'Type', 'Status', 'Priority', 'Date', 'Location', 'Description', 'AI Recommendation'].join(',');

      const rows = [headers];
      for (let i = 0; i < filteredIssues.length; i++) {
        const issue = filteredIssues[i];
        const recommendation = await getRecommendationForIssue(issue);
        const row = [
          issue.id,
          `"${issue.title}"`,
          issue.problem_type,
          issue.status,
          issue.priority || 'medium',
          new Date(issue.created_date).toLocaleDateString(),
          `"${issue.address || `${issue.latitude}, ${issue.longitude}`}"`,
          `"${(issue.description || '').replace(/"/g, '""')}"`,
          `"${(recommendation || 'N/A').replace(/"/g, '""')}"`
        ].join(',');
        rows.push(row);
        setExportProgress(Math.round(((i + 1) / filteredIssues.length) * 100));
      }

      const csvContent = rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `urban-issues-report-${type}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error exporting CSV report:', error);
    }

    setIsExporting(false);
  };

  const exportToPDFFormat = async (type = 'all') => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const filteredIssues = type === 'all'
        ? issues
        : issues.filter(issue => issue.problem_type === type);

      let pdfContent = `URBAN ISSUES REPORT - ${type.toUpperCase().replace(/_/g, ' ')}\nGenerated on: ${new Date().toLocaleDateString()}\n\n`;

      if (filteredIssues.length === 0) {
        pdfContent += "No issues found for this category.\n";
      }

      for (let i = 0; i < filteredIssues.length; i++) {
        const issue = filteredIssues[i];
        const recommendation = await getRecommendationForIssue(issue);

        pdfContent += `ISSUE #${issue.id}\n`;
        pdfContent += `Title: ${issue.title}\n`;
        pdfContent += `Type: ${issue.problem_type.replace(/_/g, ' ')}\n`;
        pdfContent += `Location: ${issue.address || `${issue.latitude}, ${issue.longitude}`}\n`;
        pdfContent += `Status: ${issue.status}\n`;
        pdfContent += `Priority: ${issue.priority || 'medium'}\n`;
        pdfContent += `Date Reported: ${new Date(issue.created_date).toLocaleDateString()}\n`;
        pdfContent += `Description: ${issue.description || 'N/A'}\n`;
        pdfContent += `AI Recommendation: ${recommendation || 'N/A'}\n`;
        pdfContent += `\n${'='.repeat(50)}\n\n`;

        setExportProgress(Math.round(((i + 1) / filteredIssues.length) * 100));
      }

      const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `urban-issues-report-${type}-${new Date().toISOString().split('T')[0]}.txt`); // Changed extension to .txt as it's plain text
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error exporting PDF report:', error);
    }

    setIsExporting(false);
  };

  const getCompletionRate = () => {
    if (issues.length === 0) return 0;
    return Math.round((analytics.statusStats?.completed || 0) / issues.length * 100);
  };

  const dailyTrend = buildDailyTrend(issues);
  const resolutionByCategory = buildResolutionTimeByCategory(issues);
  const overallAvgResolutionDays = resolutionByCategory.length
    ? Math.round((resolutionByCategory.reduce((sum, r) => sum + r.avgDays, 0) / resolutionByCategory.length) * 10) / 10
    : null;

  return (
    <div className="p-4 md:p-6 min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Reports & <span className="uo-gradient-text">Analytics</span>
            </h1>
            <p className="text-slate-400">
              Generate comprehensive reports and export data for analysis
            </p>
          </div>
          <div className="relative flex space-x-3">
            <Button onClick={() => exportToCSV('all')} disabled={isExporting} className="!bg-gradient-to-r !from-emerald-500 !to-teal-500">
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Exporting... ({exportProgress}%)
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </>
              )}
            </Button>
            <Button onClick={() => exportToPDFFormat('all')} disabled={isExporting}>
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Exporting... ({exportProgress}%)
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Overview Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Total Issues</p>
                  <p className="text-3xl font-bold text-white"><AnimatedCounter value={issues.length} /></p>
                </div>
                <FileText className="w-8 h-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Completion Rate</p>
                  <p className="text-3xl font-bold text-emerald-400"><AnimatedCounter value={getCompletionRate()} />%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Active Issues</p>
                  <p className="text-3xl font-bold text-amber-400">
                    <AnimatedCounter value={(analytics.statusStats?.pending || 0) + (analytics.statusStats?.in_progress || 0)} />
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">This Month</p>
                  <p className="text-3xl font-bold text-violet-400">
                    <AnimatedCounter value={issues.filter(i => new Date(i.created_date).getMonth() === new Date().getMonth()).length} />
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-violet-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Trend & Resolution Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 min-w-0"
        >
          <Card className="lg:col-span-2 min-w-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" /> Reports Over Time (Last 14 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="min-w-0 w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="reportsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38f2ff" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#38f2ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} width={24} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelStyle={{ color: "#94a3b8" }} />
                  <Area type="monotone" dataKey="reports" name="Reports" stroke="#38f2ff" strokeWidth={2} fill="url(#reportsGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 h-full flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Avg Resolution Time</p>
                  <p className="text-3xl font-bold text-white">
                    {overallAvgResolutionDays != null ? (
                      <>
                        <AnimatedCounter value={overallAvgResolutionDays} /> <span className="text-lg text-slate-400">days</span>
                      </>
                    ) : (
                      <span className="text-lg text-slate-500">No data yet</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Across resolved issues, from report to completion</p>
                </div>
                <Clock className="w-8 h-8 text-violet-400 shrink-0" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {resolutionByCategory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
          >
            <Card className="mb-8 min-w-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-violet-400" /> Average Resolution Time by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="min-w-0" style={{ width: "100%", height: `${Math.max(180, resolutionByCategory.length * 42)}px` }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resolutionByCategory} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} unit="d" />
                    <YAxis dataKey="label" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={140} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v) => [`${v} days`, "Avg. resolution time"]} />
                    <Bar dataKey="avgDays" name="Avg. days to resolve" fill="#a259ff" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Problem-wise Reports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Problem-wise Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {problemTypes.map((problem) => {
                  const count = analytics.problemStats?.[problem.id] || 0;
                  const completedCount = issues.filter(i =>
                    i.problem_type === problem.id && i.status === 'completed'
                  ).length;
                  const completionRate = count > 0 ? Math.round(completedCount / count * 100) : 0;

                  return (
                    <Card key={problem.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{problem.icon}</span>
                            <span className="font-medium text-sm text-white">{problem.label}</span>
                          </div>
                          <Badge variant="secondary">{count}</Badge>
                        </div>

                        <div className="space-y-2 text-sm text-slate-400">
                          <div className="flex justify-between">
                            <span>Completion Rate:</span>
                            <span className="font-medium text-slate-200">{completionRate}%</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${completionRate}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => exportToCSV(problem.id)}
                            disabled={isExporting || count === 0}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            CSV
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => exportToPDFFormat(problem.id)}
                            disabled={isExporting || count === 0}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Status Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-300">
                      <div className="w-3 h-3 bg-red-400 rounded-full shadow-[0_0_8px_rgba(248,113,113,0.6)]"></div>
                      Pending
                    </span>
                    <Badge className="bg-red-500/15 text-red-300 border border-red-400/30">
                      {analytics.statusStats?.pending || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-300">
                      <div className="w-3 h-3 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]"></div>
                      In Progress
                    </span>
                    <Badge className="bg-amber-500/15 text-amber-300 border border-amber-400/30">
                      {analytics.statusStats?.in_progress || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-300">
                      <div className="w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>
                      Completed
                    </span>
                    <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                      {analytics.statusStats?.completed || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-300">
                      <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                      Urgent
                    </span>
                    <Badge className="bg-red-500/15 text-red-300 border border-red-400/30">
                      {analytics.priorityStats?.urgent || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-300">
                      <div className="w-3 h-3 bg-orange-400 rounded-full shadow-[0_0_8px_rgba(251,146,60,0.6)]"></div>
                      High
                    </span>
                    <Badge className="bg-orange-500/15 text-orange-300 border border-orange-400/30">
                      {analytics.priorityStats?.high || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-300">
                      <div className="w-3 h-3 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]"></div>
                      Medium
                    </span>
                    <Badge className="bg-amber-500/15 text-amber-300 border border-amber-400/30">
                      {analytics.priorityStats?.medium || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-300">
                      <div className="w-3 h-3 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.6)]"></div>
                      Low
                    </span>
                    <Badge className="bg-blue-500/15 text-blue-300 border border-blue-400/30">
                      {analytics.priorityStats?.low || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
