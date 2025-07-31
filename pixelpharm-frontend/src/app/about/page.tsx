"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  ArrowRight,
  Users,
  Target,
  Award,
  Brain,
  Shield,
  BarChart3,
  Heart,
  Zap,
  Globe,
  CheckCircle,
} from "lucide-react";

export default function AboutPage() {
  const team = [
    {
      name: "Dr. Sarah Johnson",
      role: "Chief Medical Officer",
      bio: "Former Mayo Clinic physician with 15+ years in personalized medicine",
    },
    {
      name: "Alex Chen",
      role: "Chief Technology Officer",
      bio: "AI/ML expert, former Google Health, Stanford PhD in Computer Science",
    },
    {
      name: "Maria Rodriguez",
      role: "Head of Product",
      bio: "Healthcare technology veteran with experience at Epic and Cerner",
    },
  ];

  const values = [
    {
      icon: <Shield className="h-8 w-8 text-blue-600" />,
      title: "Privacy First",
      description:
        "Your health data belongs to you. We use bank-level encryption and never share your information without explicit consent.",
    },
    {
      icon: <Brain className="h-8 w-8 text-purple-600" />,
      title: "Scientific Rigor",
      description:
        "Our AI models are trained on peer-reviewed research and validated against clinical standards.",
    },
    {
      icon: <Heart className="h-8 w-8 text-red-600" />,
      title: "Human-Centered",
      description:
        "Technology should enhance human health, not complicate it. We focus on clear, actionable insights.",
    },
    {
      icon: <Target className="h-8 w-8 text-green-600" />,
      title: "Accessibility",
      description:
        "Advanced health analytics shouldn't be limited to the wealthy. We're democratizing personalized medicine.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PixelPharm Health
              </span>
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/about" className="text-blue-600 font-medium">
                About
              </Link>
              <Link
                href="/pricing"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Pricing
              </Link>
              <Link
                href="/support"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Support
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Democratizing
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {" "}
                  Personalized Medicine
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                We believe everyone deserves access to the same level of health
                insights that were once reserved for research institutions and
                wealthy individuals. Our mission is to transform how people
                understand and manage their health through cutting-edge AI
                technology.
              </p>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Our Story
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    PixelPharm was born from a simple frustration: why do lab
                    results come as confusing numbers with reference ranges that
                    tell you nothing about your personal health journey? Our
                    founders, a team of physicians, AI researchers, and
                    healthcare veterans, set out to change this.
                  </p>
                  <p>
                    After years of research and development, we've created the
                    world's first consumer-friendly platform that combines
                    multiple medical AI models to provide clinical-grade health
                    insights. What once required expensive consultations with
                    specialists is now available to anyone with a smartphone.
                  </p>
                  <p>
                    Today, we're proud to serve thousands of health-conscious
                    individuals who are taking control of their wellness journey
                    through data-driven insights and personalized
                    recommendations.
                  </p>
                  <p>
                    PixelPharm Health is proudly run out of Australia with a fully
                    Australian team of health experts, ensuring our platform meets
                    the highest standards of medical expertise and data security
                    while providing world-class healthcare insights to our users.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      50K+
                    </div>
                    <div className="text-sm text-gray-600">
                      Lab Reports Analyzed
                    </div>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      1000+
                    </div>
                    <div className="text-sm text-gray-600">Active Users</div>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      99.2%
                    </div>
                    <div className="text-sm text-gray-600">Accuracy Rate</div>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-red-600 mb-2">
                      24/7
                    </div>
                    <div className="text-sm text-gray-600">AI Analysis</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Our Values
              </h2>
              <p className="text-xl text-gray-600">
                The principles that guide everything we do
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <Card
                  key={index}
                  className="text-center hover:shadow-lg transition-shadow"
                >
                  <CardContent className="pt-8">
                    <div className="flex justify-center mb-4">{value.icon}</div>
                    <h3 className="text-xl font-semibold mb-3">
                      {value.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Leadership Team
              </h2>
              <p className="text-xl text-gray-600">
                World-class experts in medicine, AI, and healthcare technology
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {team.map((member, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="pt-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Users className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {member.name}
                    </h3>
                    <p className="text-blue-600 font-medium mb-3">
                      {member.role}
                    </p>
                    <p className="text-gray-600 text-sm">{member.bio}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="max-w-4xl mx-auto text-center text-white">
              <h2 className="text-3xl font-bold mb-6">
                Powered by Advanced AI
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Our Multi Medical Model technology combines the latest advances
                in machine learning, natural language processing, and clinical
                decision support to provide you with insights that rival those
                of top medical institutions.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="text-center">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-blue-200" />
                  <h3 className="text-lg font-semibold mb-2">
                    Deep Learning Models
                  </h3>
                  <p className="text-blue-100 text-sm">
                    Trained on millions of lab results and clinical outcomes
                  </p>
                </div>
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-blue-200" />
                  <h3 className="text-lg font-semibold mb-2">
                    Predictive Analytics
                  </h3>
                  <p className="text-blue-100 text-sm">
                    Identify health trends before they become problems
                  </p>
                </div>
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-blue-200" />
                  <h3 className="text-lg font-semibold mb-2">
                    Clinical Validation
                  </h3>
                  <p className="text-blue-100 text-sm">
                    Verified against established medical guidelines
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Join the World Class Health Platform Now!
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Take control of your health journey with AI-powered insights that
              help you make informed decisions about your wellness.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Start Now!
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Activity className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  PixelPharm Health
                </span>
              </div>
              <p className="text-gray-300 mb-4 max-w-md">
                Empowering individuals with professional-grade health analytics
                through advanced Multi Medical Model technology.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/pricing"
                    className="text-gray-300 hover:text-white"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/signin"
                    className="text-gray-300 hover:text-white"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/signup"
                    className="text-gray-300 hover:text-white"
                  >
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/about"
                    className="text-gray-300 hover:text-white"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-300 hover:text-white"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-gray-300 hover:text-white"
                  >
                    Terms
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support"
                    className="text-gray-300 hover:text-white"
                  >
                    Support
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 PixelPharm. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
