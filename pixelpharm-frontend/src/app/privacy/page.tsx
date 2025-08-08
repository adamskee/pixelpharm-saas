"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  Shield,
  Lock,
  Eye,
  FileText,
  Users,
  Globe,
  Database,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PixelPharm
              </span>
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/about" className="text-gray-600 hover:text-gray-900 font-medium">About</Link>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900 font-medium">Pricing</Link>
              <Link href="/support" className="text-gray-600 hover:text-gray-900 font-medium">Support</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/auth/signin">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Shield className="h-4 w-4" />
                <span>HIPAA Compliant • Bank-Level Security</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Privacy Policy
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Your health data is sacred. We're committed to protecting your privacy with the highest standards of security and transparency.
              </p>
              <p className="text-sm text-gray-500">
                Last updated: December 2024
              </p>
            </div>
          </div>
        </section>

        {/* Quick Overview */}
        <section className="py-8 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-2">Your Rights at a Glance</h3>
                    <ul className="text-green-800 text-sm space-y-1">
                      <li>• Your data belongs to you - we never sell it</li>
                      <li>• You control who sees your health information</li>
                      <li>• You can delete your data at any time</li>
                      <li>• We use bank-level encryption for all data</li>
                      <li>• We're fully HIPAA compliant</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="prose prose-gray max-w-none">
              
              {/* Information We Collect */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    <span>Information We Collect</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Health Information You Provide</h4>
                    <p className="text-gray-600 text-sm mb-2">
                      When you upload lab results or enter health data, we collect:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Laboratory test results and biomarker values</li>
                      <li>• Body composition measurements</li>
                      <li>• Health symptoms and wellness goals</li>
                      <li>• Medication and supplement information</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Account Information</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Name, email address, and contact information</li>
                      <li>• Account preferences and settings</li>
                      <li>• Billing information (processed securely by Stripe)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Technical Information</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Device information and browser type</li>
                      <li>• IP address and general location (country/state level)</li>
                      <li>• Usage patterns and feature interactions</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* How We Use Information */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="h-5 w-5 text-purple-600" />
                    <span>How We Use Your Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Primary Uses</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Generate personalized health insights and recommendations</li>
                      <li>• Track your health trends and progress over time</li>
                      <li>• Provide AI-powered analysis of your lab results</li>
                      <li>• Send you health alerts and notifications (with your consent)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Service Improvement</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Improve our AI models and analysis accuracy</li>
                      <li>• Develop new features and health insights</li>
                      <li>• Ensure platform security and prevent fraud</li>
                    </ul>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-yellow-900 mb-1">Important Note</h4>
                        <p className="text-yellow-800 text-sm">
                          We never use your data for marketing to third parties or sell your information. 
                          Your health data is used solely to provide you with better health insights.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Security */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lock className="h-5 w-5 text-green-600" />
                    <span>Data Security & Protection</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Encryption & Storage</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• All data encrypted in transit using TLS 1.3</li>
                      <li>• Data encrypted at rest using AES-256</li>
                      <li>• Stored in secure, HIPAA-compliant data centers</li>
                      <li>• Regular security audits and penetration testing</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Access Controls</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Multi-factor authentication for all accounts</li>
                      <li>• Role-based access for our team members</li>
                      <li>• Automated access logging and monitoring</li>
                      <li>• Regular access reviews and updates</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Data Sharing */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-red-600" />
                    <span>Data Sharing & Third Parties</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">We Never Share Your Health Data Except:</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• With your explicit written consent</li>
                      <li>• When required by law (e.g., court order)</li>
                      <li>• To protect against fraud or security threats</li>
                      <li>• With healthcare providers you explicitly authorize</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Service Providers</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      We work with trusted partners who help us provide our service:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Cloud hosting (AWS, HIPAA-compliant)</li>
                      <li>• Payment processing (Stripe, PCI-compliant)</li>
                      <li>• Email delivery (for health reports and notifications)</li>
                      <li>• Analytics (anonymized usage data only)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Your Rights */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span>Your Privacy Rights</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Access & Control</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• View all your data</li>
                        <li>• Download your data</li>
                        <li>• Correct inaccuracies</li>
                        <li>• Delete your account</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Privacy Controls</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Opt-out of notifications</li>
                        <li>• Control data sharing</li>
                        <li>• Manage cookies</li>
                        <li>• Request data portability</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Exercise Your Rights</h4>
                    <p className="text-blue-800 text-sm">
                      You can manage most privacy settings directly in your account. 
                      For other requests, contact us at <a href="mailto:privacy@pixelpharm.com" className="underline">privacy@pixelpharm.com</a>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* International Users */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-purple-600" />
                    <span>International Users</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">GDPR Compliance (EU Users)</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      If you're in the European Union, you have additional rights under GDPR:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Right to be forgotten (data deletion)</li>
                      <li>• Data portability</li>
                      <li>• Object to processing</li>
                      <li>• Lodge complaints with supervisory authorities</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Data Transfers</h4>
                    <p className="text-sm text-gray-600">
                      Your data is primarily stored in the United States in HIPAA-compliant facilities. 
                      International transfers are protected by appropriate safeguards and adequacy decisions.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <span>Contact Us</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    If you have questions about this Privacy Policy or our privacy practices, please contact us:
                  </p>
                  <div className="space-y-2 text-sm">
                    <p><strong>Email:</strong> <a href="mailto:privacy@pixelpharm.com" className="text-blue-600 hover:underline">privacy@pixelpharm.com</a></p>
                    <p><strong>Mail:</strong> PixelPharm Privacy Team, 123 Health St, San Francisco, CA 94102</p>
                    <p><strong>Phone:</strong> 1-800-PIXEL-FARM (for privacy inquiries only)</p>
                  </div>
                </CardContent>
              </Card>

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
                  PixelPharm
                </span>
              </div>
              <p className="text-gray-300 mb-4 max-w-md">
                Empowering individuals with professional-grade health analytics through advanced Multi Medical Model technology.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/pricing" className="text-gray-300 hover:text-white">Pricing</Link></li>
                <li><Link href="/auth/signin" className="text-gray-300 hover:text-white">Sign In</Link></li>
                <li><Link href="/auth/signin" className="text-gray-300 hover:text-white">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-300 hover:text-white">About</Link></li>
                <li><Link href="/privacy" className="text-gray-300 hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="text-gray-300 hover:text-white">Terms</Link></li>
                <li><Link href="/support" className="text-gray-300 hover:text-white">Support</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">© 2024 PixelPharm. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}