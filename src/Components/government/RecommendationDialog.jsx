import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "../ui/dialog.jsx";
import { Button } from "../ui/button";
import { InvokeLLM } from "../../../integrations/Core.jsx";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { AlertCircle, Lightbulb, Clock, IndianRupee, Rocket, RefreshCw, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getActiveCity } from "../../config/cities";

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center space-y-4 p-12">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Sparkles className="w-6 h-6 text-cyan-300 animate-pulse" />
      </div>
    </div>
    <div className="text-center">
      <p className="text-white font-semibold text-lg">AI Analysis in Progress</p>
      <p className="text-slate-400 text-sm mt-1">Our urban planning AI is analyzing the issue and generating recommendations...</p>
    </div>
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
    </div>
  </div>
);

const RecommendationDisplay = ({ recommendation }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    className="space-y-6"
  >
    {/* Main Recommendation */}
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1, duration: 0.5 }}
    >
      <Card className="!bg-gradient-to-br !from-cyan-500/10 !to-violet-500/10 !border-cyan-400/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-[0_0_16px_rgba(56,242,255,0.4)]">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <span>AI-Generated Recommendation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-200 leading-relaxed text-base">{recommendation.recommendation}</p>
        </CardContent>
      </Card>
    </motion.div>

    {/* Timeline and Budget */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Card className="!border-amber-400/20 !bg-amber-500/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-sm font-semibold text-amber-300">
              <div className="p-1.5 bg-amber-500 rounded-md">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <span>Estimated Timeline</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-amber-200">{recommendation.estimated_time}</p>
            <p className="text-xs text-amber-400/80 mt-1">Expected completion timeframe</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card className="!border-emerald-400/20 !bg-emerald-500/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-sm font-semibold text-emerald-300">
              <div className="p-1.5 bg-emerald-500 rounded-md">
                <IndianRupee className="w-4 h-4 text-white" />
              </div>
              <span>Estimated Budget</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-emerald-200">{recommendation.estimated_budget}</p>
            <p className="text-xs text-emerald-400/80 mt-1">Approximate cost estimate</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>

    {/* Action Steps */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <AlertCircle className="w-5 h-5 text-emerald-400" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-cyan-400" />
              <span>Assign responsible team/department</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400" />
              <span>Update issue status to "In Progress"</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-emerald-400" />
              <span>Set target completion date based on timeline</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  </motion.div>
);

export default function RecommendationDialog({ issue, isOpen, onClose }) {
  const [recommendation, setRecommendation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && issue) {
      generateRecommendation();
    } else {
      // Reset state when dialog is closed
      setRecommendation(null);
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen, issue]);

  const generateRecommendation = async () => {
    setIsLoading(true);
    setError(null);
    setRecommendation(null);

    try {
      const city = getActiveCity();
      // Create a detailed prompt for better AI responses
      const prompt = `You are an expert urban planning consultant specializing in ${city.name}, India's infrastructure challenges.

Issue Analysis:
- Title: "${issue.title}"
- Category: "${issue.problem_type.replace(/_/g, ' ')}"
- Description: "${issue.description || 'No additional description provided.'}"
- Location: "${issue.address || `Coordinates: ${issue.latitude}, ${issue.longitude}`}"
- Current Status: "${issue.status}"
- Priority Level: "${issue.priority || 'medium'}"

Provide a practical, implementable solution that considers:
1. Local government capabilities and resources
2. ${city.municipalBody} procedures
3. Community impact and stakeholder involvement
4. Sustainable and cost-effective approaches
5. Realistic timelines for Indian bureaucratic processes

Return your response as a JSON object with exactly three fields: recommendation (detailed solution in 2-3 sentences), estimated_time (realistic timeframe), and estimated_budget (in INR with range).`;

      const response_json_schema = {
        type: "object",
        properties: {
          recommendation: { 
            type: "string", 
            description: "Detailed actionable recommendation for resolving the urban issue"
          },
          estimated_time: { 
            type: "string", 
            description: "Realistic timeframe for implementation (e.g., '2-4 weeks', '6 months')"
          },
          estimated_budget: { 
            type: "string", 
            description: "Budget estimate in Indian Rupees with range (e.g., '₹2,50,000 - ₹5,00,000')"
          }
        },
        required: ["recommendation", "estimated_time", "estimated_budget"]
      };

      console.log("Generating AI recommendation for issue:", issue.title);
      
      const result = await InvokeLLM({
        prompt: prompt,
        response_json_schema: response_json_schema
      });

      console.log("AI recommendation result:", result);
      
      if (result && typeof result === 'object' && result.recommendation && result.estimated_time && result.estimated_budget) {
        setRecommendation(result);
      } else {
        throw new Error("AI service returned incomplete data. Please try again.");
      }

    } catch (err) {
      console.error("AI recommendation error:", err);
      
      if (err.status === 402) {
        setError({
          title: "AI Service - Payment Required",
          message: "The AI recommendation service is unavailable due to a billing issue with this application's account. Please contact the application owner to resolve this.",
        });
      } else if (err.status === 429) {
        setError({
          title: "Too Many Requests",
          message: err.message || "You've hit the AI recommendation rate limit. Please wait a minute and try again.",
        });
      } else if (err.status === 403) {
        setError({
          title: "Access Denied",
          message: err.message || "Your account isn't authorized to use AI recommendations.",
        });
      } else if (err.status >= 500) {
        setError({
          title: "AI Service Unavailable",
          message: err.message || "The AI service is temporarily unavailable. Please try again in a few moments.",
        });
      } else if (err.message?.toLowerCase().includes('timeout')) {
        setError({
          title: "Request Timed Out",
          message: "The request to the AI service timed out. Please check your connection and try again.",
        });
      } else {
        // Surface the real error text instead of a dead-end generic message -
        // this is almost always actionable (e.g. a Gemini API error or a
        // misconfigured server env var) rather than truly unknown.
        setError({
          title: "Couldn't Generate a Recommendation",
          message: err.message || "An unexpected error occurred. Please try again.",
        });
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    generateRecommendation();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600 rounded-xl shadow-[0_0_20px_rgba(56,242,255,0.35)]">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            AI-Powered Solution Recommendation
          </DialogTitle>
          <DialogDescription className="text-base">
            Intelligent analysis and recommendations for: <span className="font-semibold text-slate-200">"{issue?.title}"</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-2">
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div 
                key="loading" 
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <LoadingSpinner />
              </motion.div>
            )}
            
            {error && (
              <motion.div 
                key="error" 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-5 w-5" />
                  <AlertTitle className="text-base">{error.title}</AlertTitle>
                  <AlertDescription className="mt-2 text-sm">
                    {error.message}
                  </AlertDescription>
                </Alert>
                <div className="flex justify-center">
                  <Button onClick={handleRetry} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </motion.div>
            )}
            
            {recommendation && (
              <motion.div 
                key="success" 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <RecommendationDisplay recommendation={recommendation} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}