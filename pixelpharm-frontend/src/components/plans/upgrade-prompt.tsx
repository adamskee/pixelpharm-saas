// File: src/components/plans/upgrade-prompt.tsx
// Upgrade prompt component for Free plan users

"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, ArrowRight, Lock, TrendingUp } from "lucide-react";

interface UpgradePromptProps {
  reason: "upload_limit" | "biomarker_limit" | "feature_access";
  uploadsUsed?: number;
  maxUploads?: number;
  biomarkersShown?: number;
  totalBiomarkers?: number;
  className?: string;
}

export function UpgradePrompt({ 
  reason, 
  uploadsUsed = 0, 
  maxUploads = 1, 
  biomarkersShown = 3,
  totalBiomarkers = 0,
  className = ""
}: UpgradePromptProps) {
  const getPromptContent = () => {
    switch (reason) {
      case "upload_limit":
        return {
          title: "Upload Limit Reached",
          description: `You've used ${uploadsUsed} of ${maxUploads} free upload${maxUploads === 1 ? '' : 's'}. Upgrade to continue analyzing your health data.`,
          icon: <Lock className="h-5 w-5" />,
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200"
        };
      
      case "biomarker_limit":
        return {
          title: "Limited Biomarker Analysis",
          description: `Showing ${biomarkersShown} of ${totalBiomarkers} biomarkers. Upgrade to analyze ALL your health markers for complete insights.`,
          icon: <TrendingUp className="h-5 w-5" />,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200"
        };
      
      case "feature_access":
        return {
          title: "Unlock Premium Features",
          description: "Access advanced health optimization, unlimited uploads, and comprehensive biomarker analysis.",
          icon: <Zap className="h-5 w-5" />,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200"
        };
      
      default:
        return {
          title: "Upgrade Your Plan",
          description: "Unlock full health insights with unlimited uploads and complete biomarker analysis.",
          icon: <Zap className="h-5 w-5" />,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200"
        };
    }
  };

  const content = getPromptContent();

  return (
    <Card className={`${content.borderColor} ${content.bgColor} border-2 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`${content.color}`}>
              {content.icon}
            </div>
            <CardTitle className="text-lg">{content.title}</CardTitle>
          </div>
          <Badge variant="outline" className={`${content.color} border-current`}>
            Free Plan
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-gray-600 mb-4">
          {content.description}
        </p>
        
        {reason === "biomarker_limit" && totalBiomarkers > biomarkersShown && (
          <div className="mb-4 p-3 bg-white rounded-md border border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Biomarkers Analyzed:</span>
              <span className="font-medium">{biomarkersShown} of {totalBiomarkers}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${(biomarkersShown / totalBiomarkers) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/pricing" className="flex-1">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <Zap className="h-4 w-4 mr-2" />
              Upgrade to Elite
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline" className="w-full sm:w-auto">
              View Plans
            </Button>
          </Link>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          ✨ Elite Plan: Unlimited uploads • All biomarkers • Health Optimization
        </div>
      </CardContent>
    </Card>
  );
}

export default UpgradePrompt;