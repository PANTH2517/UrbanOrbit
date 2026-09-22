import React, { useState, useEffect } from "react";
import { Issue } from "../entities/Issues";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { Button } from "../Components/ui/button";
import { Input } from "../Components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../Components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../Components/ui/table";
import { Search, Eye, Sparkles, Filter, Trash2 } from "lucide-react";
import { problemTypes } from "../Components/problems/ProblemSelector";
import { motion } from "framer-motion";
import RecommendationDialog from "../Components/government/RecommendationDialog";
import { User } from "../entities/User";
import { useToast } from "../Components/ui/Toast";
import AllClearBadge from "../Components/vector/AllClearBadge";

export default function ManageIssues() {
  const { showToast } = useToast();
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [problemFilter, setProblemFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { loadIssues(); }, []);
  useEffect(() => { filterIssues(); }, [issues, searchTerm, statusFilter, problemFilter]);
  useEffect(() => {
    // Delete is admin-only (firestore.rules: allow delete: if isAdmin()) -
    // this just decides whether to show the button; the rule is what
    // actually enforces it either way.
    return User.onChange((user) => setIsAdmin(user?.role === "admin"));
  }, []);

  const loadIssues = async () => {
    setIsLoading(true);
    const fetchedIssues = await Issue.list('-created_date');
    setIssues(fetchedIssues);
    setIsLoading(false);
  };

  const filterIssues = () => {
    let filtered = [...issues];

    if (searchTerm) {
      filtered = filtered.filter(issue =>
        issue.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') filtered = filtered.filter(issue => issue.status === statusFilter);
    if (problemFilter !== 'all') filtered = filtered.filter(issue => issue.problem_type === problemFilter);

    setFilteredIssues(filtered);
  };

  const updateIssueStatus = async (issueId, newStatus) => {
    await Issue.update(issueId, { status: newStatus });
    loadIssues();
  };

  const updateIssuePriority = async (issueId, newPriority) => {
    await Issue.update(issueId, { priority: newPriority });
    loadIssues();
  };

  const handleOpenRecommendation = (issue) => { setSelectedIssue(issue); setIsDialogOpen(true); };
  const handleCloseRecommendation = () => { setSelectedIssue(null); setIsDialogOpen(false); };

  const handleDelete = async (issue) => {
    if (!window.confirm(`Permanently delete "${issue.title}"? This can't be undone.`)) return;
    setDeletingId(issue.id);
    try {
      await Issue.delete(issue.id);
      showToast("Issue deleted.", "success");
      loadIssues();
    } catch (err) {
      showToast(err.message || "Failed to delete issue.", "error");
    }
    setDeletingId(null);
  };

  const getStatusBadge = (status) => ({
    pending: 'bg-red-500/15 text-red-300 border border-red-400/30',
    in_progress: 'bg-amber-500/15 text-amber-300 border border-amber-400/30',
    completed: 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'
  }[status] || 'bg-white/10 text-slate-300 border border-white/15');

  const getPriorityBadge = (priority) => ({
    low: 'bg-blue-500/15 text-blue-300 border border-blue-400/30',
    medium: 'bg-amber-500/15 text-amber-300 border border-amber-400/30',
    high: 'bg-orange-500/15 text-orange-300 border border-orange-400/30',
    urgent: 'bg-red-500/15 text-red-300 border border-red-400/30'
  }[priority] || 'bg-white/10 text-slate-300 border border-white/15');

  return (
    <div className="p-4 md:p-6 min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Manage Issues</h1>
          <p className="text-slate-400">Review, update status, and get AI-powered recommendations for urban issues</p>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Filter className="w-5 h-5 text-cyan-400" />Filter Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <Input placeholder="Search issues..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={problemFilter} onValueChange={setProblemFilter}>
                  <SelectTrigger><SelectValue placeholder="All Problems" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Problems</SelectItem>
                    {problemTypes.map(problem => (
                      <SelectItem key={problem.id} value={problem.id}>
                        <span className="flex items-center gap-1">{problem.icon} {problem.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="text-sm text-slate-400 flex items-center">
                  Showing {filteredIssues.length} of {issues.length} issues
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Issues Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}>
          <Card>
            <CardContent className="p-0">
              {!isLoading && filteredIssues.length === 0 ? (
                <div className="py-12 text-center">
                  <AllClearBadge />
                  <p className="text-slate-500 text-sm mt-2">No issues match your filters.</p>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-white/10">
                      <TableHead>Issue</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIssues.map(issue => (
                      <TableRow key={issue.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-white">{issue.title}</p>
                            {issue.description && <p className="text-sm text-slate-500 truncate max-w-xs">{issue.description}</p>}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{problemTypes.find(p => p.id === issue.problem_type)?.icon}</span>
                            <span className="text-sm text-slate-300">{problemTypes.find(p => p.id === issue.problem_type)?.label}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Select value={issue.status || 'pending'} onValueChange={val => updateIssueStatus(issue.id, val)}>
                            <SelectTrigger className="w-32">
                              <SelectValue>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(issue.status)}`}>
                                  {issue?.status ? issue.status.replace('_', ' ') : 'pending'}
                                </span>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>

                        <TableCell>
                          <Select value={issue.priority || 'medium'} onValueChange={val => updateIssuePriority(issue.id, val)}>
                            <SelectTrigger className="w-24">
                              <SelectValue>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityBadge(issue.priority || 'medium')}`}>
                                  {issue.priority ? issue.priority.replace('_', ' ') : 'medium'}
                                </span>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>

                        <TableCell>
                          <div className="text-sm text-slate-400">{issue.address || `${issue.latitude?.toFixed(4)}, ${issue.longitude?.toFixed(4)}`}</div>
                        </TableCell>

                        <TableCell>
                          <div className="text-sm text-slate-400">{issue.created_date ? new Date(issue.created_date).toLocaleDateString() : ''}</div>
                        </TableCell>

                        <TableCell>
                          <div className="flex gap-2 items-center flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenRecommendation(issue)}
                              className="hover:border-violet-400/50 hover:text-violet-300"
                            >
                              <Sparkles className="w-4 h-4 mr-2" /> AI Recommend
                            </Button>
                            {issue.image_url && (
                              <Button size="icon" variant="ghost" onClick={() => window.open(issue.image_url, '_blank')} title="View Photo">
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            {isAdmin && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDelete(issue)}
                                disabled={deletingId === issue.id}
                                title="Delete Issue (admin only)"
                                className="hover:bg-red-500/10 hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Recommendation Dialog */}
        <RecommendationDialog issue={selectedIssue} isOpen={isDialogOpen} onClose={handleCloseRecommendation} />
      </div>
    </div>
  );
}
