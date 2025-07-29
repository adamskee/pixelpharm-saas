// File: src/components/dashboard/detailed-recommendations.tsx

"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Activity,
  Heart,
  Utensils,
  Pill,
  Stethoscope,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Calendar,
  TrendingUp,
  Info,
  ExternalLink,
} from "lucide-react";

interface DetailedRecommendation {
  id: string;
  title: string;
  description: string;
  category: "diet" | "exercise" | "lifestyle" | "supplements" | "medical" | "monitoring";
  priority: "urgent" | "high" | "moderate" | "low";
  reasoning: string;
  actionSteps: string[];
  expectedOutcome: string;
  timeframe: string;
  evidenceLevel: "strong" | "moderate" | "limited";
  relatedBiomarkers: string[];
  resources?: string[];
  status: "new" | "in_progress" | "completed" | "dismissed";
}

interface RecommendationSummary {
  totalRecommendations: number;
  urgentCount: number;
  highPriorityCount: number;
  moderateCount: number;
  lowPriorityCount: number;
  categoryCounts: Record<string, number>;
}

interface DetailedRecommendationsProps {
  userId: string;
}

export function DetailedRecommendations({ userId }: DetailedRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<DetailedRecommendation[]>([]);
  const [summary, setSummary] = useState<RecommendationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("💡 Fetching detailed recommendations for user:", userId);

      const response = await fetch(`/api/health/recommendations?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.status}`);
      }

      const data = await response.json();
      console.log("💡 Received recommendations:", data);

      setRecommendations(data.recommendations || []);
      setSummary(data.summary);
    } catch (err) {
      console.error("❌ Error fetching recommendations:", err);
      setError(err instanceof Error ? err.message : "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchRecommendations();
    }
  }, [userId]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "diet": return <Utensils className="h-4 w-4" />;
      case "exercise": return <Activity className="h-4 w-4" />;
      case "lifestyle": return <Heart className="h-4 w-4" />;
      case "supplements": return <Pill className="h-4 w-4" />;
      case "medical": return <Stethoscope className="h-4 w-4" />;
      case "monitoring": return <BarChart3 className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "border-l-red-600 bg-red-50";
      case "high": return "border-l-orange-500 bg-orange-50";
      case "moderate": return "border-l-yellow-500 bg-yellow-50";
      case "low": return "border-l-green-500 bg-green-50";
      default: return "border-l-gray-500 bg-gray-50";
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      urgent: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800", 
      moderate: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800"
    };
    
    return (
      <Badge className={colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const getEvidenceBadge = (level: string) => {
    const colors = {
      strong: "bg-blue-100 text-blue-800",
      moderate: "bg-purple-100 text-purple-800",
      limited: "bg-gray-100 text-gray-800"
    };
    
    return (
      <Badge variant="outline" className={colors[level as keyof typeof colors]}>
        {level} evidence
      </Badge>
    );
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  const filterRecommendationsByPriority = (priority: string) => {
    return recommendations.filter(rec => rec.priority === priority);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
        <span className="text-gray-600">Loading personalized recommendations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button onClick={fetchRecommendations} variant="outline" size="sm" className="ml-2">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!summary || recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Recommendations Available
          </h3>
          <p className="text-gray-600 mb-4">
            We need more biomarker data to generate personalized recommendations.
          </p>
          <Button onClick={fetchRecommendations}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Recommendations
          </Button>
        </CardContent>
      </Card>
    );
  }

  const urgentRecs = filterRecommendationsByPriority("urgent");
  const highRecs = filterRecommendationsByPriority("high");
  const moderateRecs = filterRecommendationsByPriority("moderate");
  const lowRecs = filterRecommendationsByPriority("low");

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-500" />
                <span>Personalized Health Recommendations</span>
              </CardTitle>
              <CardDescription>
                AI-generated recommendations based on your biomarker data
              </CardDescription>
            </div>
            <Button onClick={fetchRecommendations} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {summary.totalRecommendations}
              </div>
              <div className="text-sm text-gray-600">Total Recommendations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {summary.urgentCount + summary.highPriorityCount}
              </div>
              <div className="text-sm text-gray-600">High Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {summary.moderateCount}
              </div>
              <div className="text-sm text-gray-600">Moderate Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {summary.lowPriorityCount}
              </div>
              <div className="text-sm text-gray-600">Low Priority</div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div>
            <h4 className="font-medium mb-3">Recommendation Categories:</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.categoryCounts).map(([category, count]) => (
                <Badge key={category} variant="outline" className="flex items-center space-x-1">
                  {getCategoryIcon(category)}
                  <span>{category}</span>
                  <span className="ml-1 bg-gray-200 text-gray-800 rounded-full px-1.5 py-0.5 text-xs">
                    {count}
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations by Priority */}
      <Tabs defaultValue="urgent" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="urgent" className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Urgent ({urgentRecs.length})</span>
          </TabsTrigger>
          <TabsTrigger value="high" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>High ({highRecs.length})</span>
          </TabsTrigger>
          <TabsTrigger value="moderate" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Moderate ({moderateRecs.length})</span>
          </TabsTrigger>
          <TabsTrigger value="low" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Low ({lowRecs.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Urgent Recommendations */}
        <TabsContent value="urgent" className="space-y-4">
          {urgentRecs.length > 0 ? (
            urgentRecs.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                isExpanded={expandedCards.has(rec.id)}
                onToggleExpanded={() => toggleExpanded(rec.id)}
              />
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Urgent Actions Needed</h3>
                <p className="text-gray-600">Great! No urgent health actions are required at this time.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* High Priority Recommendations */}
        <TabsContent value="high" className="space-y-4">
          {highRecs.length > 0 ? (
            highRecs.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                isExpanded={expandedCards.has(rec.id)}
                onToggleExpanded={() => toggleExpanded(rec.id)}
              />
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No High Priority Actions</h3>
                <p className="text-gray-600">Your high-priority health metrics look good!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Moderate Priority Recommendations */}
        <TabsContent value="moderate" className="space-y-4">
          {moderateRecs.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              isExpanded={expandedCards.has(rec.id)}
              onToggleExpanded={() => toggleExpanded(rec.id)}
            />
          ))}
        </TabsContent>

        {/* Low Priority Recommendations */}
        <TabsContent value="low" className="space-y-4">
          {lowRecs.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              isExpanded={expandedCards.has(rec.id)}
              onToggleExpanded={() => toggleExpanded(rec.id)}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface RecommendationCardProps {
  recommendation: DetailedRecommendation;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

function RecommendationCard({ recommendation, isExpanded, onToggleExpanded }: RecommendationCardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "diet": return <Utensils className="h-4 w-4" />;
      case "exercise": return <Activity className="h-4 w-4" />;
      case "lifestyle": return <Heart className="h-4 w-4" />;
      case "supplements": return <Pill className="h-4 w-4" />;
      case "medical": return <Stethoscope className="h-4 w-4" />;
      case "monitoring": return <BarChart3 className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "border-l-red-600 bg-red-50";
      case "high": return "border-l-orange-500 bg-orange-50";
      case "moderate": return "border-l-yellow-500 bg-yellow-50";
      case "low": return "border-l-green-500 bg-green-50";
      default: return "border-l-gray-500 bg-gray-50";
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      urgent: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800", 
      moderate: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800"
    };
    
    return (
      <Badge className={colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const getEvidenceBadge = (level: string) => {
    const colors = {
      strong: "bg-blue-100 text-blue-800",
      moderate: "bg-purple-100 text-purple-800",
      limited: "bg-gray-100 text-gray-800"
    };
    
    return (
      <Badge variant="outline" className={colors[level as keyof typeof colors]}>
        {level} evidence
      </Badge>
    );
  };

  return (
    <Card className={`border-l-4 ${getPriorityColor(recommendation.priority)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="flex items-center space-x-2">
                {getCategoryIcon(recommendation.category)}
                <CardTitle className="text-lg">{recommendation.title}</CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                {getPriorityBadge(recommendation.priority)}
                {getEvidenceBadge(recommendation.evidenceLevel)}
              </div>
            </div>
            <CardDescription className="text-sm">
              {recommendation.description}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onToggleExpanded}>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        
        {/* Quick Info */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{recommendation.timeframe}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Info className="h-3 w-3" />
            <span>{recommendation.category}</span>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Reasoning */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Why this recommendation?</h4>
            <p className="text-sm text-gray-700">{recommendation.reasoning}</p>
          </div>

          {/* Action Steps */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Action Steps:</h4>
            <ul className="space-y-1">
              {recommendation.actionSteps.map((step, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                  <span className="text-blue-600 font-bold min-w-[1.5rem]">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Expected Outcome */}
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center space-x-1">
              <TrendingUp className="h-3 w-3" />
              <span>Expected Outcome:</span>
            </h4>
            <p className="text-sm text-gray-700">{recommendation.expectedOutcome}</p>
          </div>

          {/* Related Biomarkers */}
          {recommendation.relatedBiomarkers.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Related Biomarkers:</h4>
              <div className="flex flex-wrap gap-1">
                {recommendation.relatedBiomarkers.map((biomarker, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {biomarker}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Resources */}
          {recommendation.resources && recommendation.resources.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Additional Resources:</h4>
              <ul className="space-y-1">
                {recommendation.resources.map((resource, index) => (
                  <li key={index} className="text-sm text-blue-600 flex items-center space-x-1">
                    <ExternalLink className="h-3 w-3" />
                    <span>{resource}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}