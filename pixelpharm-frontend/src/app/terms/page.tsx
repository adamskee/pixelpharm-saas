"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  FileText,
  Scale,
  AlertTriangle,
  Shield,
  CreditCard,
  Users,
  Globe,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function TermsPage() {
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
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Terms of Service
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Clear, fair terms that protect both you and PixelPharm while enabling us to provide the best health analytics service.
              </p>
              <p className="text-sm text-gray-500">
                Last updated: December 2024
              </p>
            </div>
          </div>
        </section>

        {/* Important Notice */}
        <section className="py-8 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-2">Important Medical Disclaimer</h3>
                    <p className="text-yellow-800 text-sm">
                      PixelPharm provides health information and analysis tools, but we are not a medical provider. 
                      Our insights should not replace professional medical advice, diagnosis, or treatment. 
                      Always consult with qualified healthcare professionals for medical decisions.
                    </p>
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
              
              {/* Acceptance of Terms */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Acceptance of Terms</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    By accessing or using PixelPharm's services, you agree to be bound by these Terms of Service and all applicable laws and regulations. 
                    If you do not agree with any of these terms, you are prohibited from using our services.
                  </p>
                  <p className="text-sm text-gray-600">
                    These terms apply to all users of the service, including without limitation users who are browsers, vendors, customers, merchants, and contributors of content.
                  </p>
                </CardContent>
              </Card>

              {/* Description of Service */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <span>Description of Service</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">What PixelPharm Provides</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• AI-powered analysis of lab results and health data</li>
                      <li>• Health insights, trends, and personalized recommendations</li>
                      <li>• Data visualization and tracking tools</li>
                      <li>• Educational health content and resources</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">What PixelPharm Does NOT Provide</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Medical diagnosis or treatment recommendations</li>
                      <li>• Emergency medical services</li>
                      <li>• Prescription or medication advice</li>
                      <li>• Replacement for professional medical care</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* User Responsibilities */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span>User Responsibilities</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Account Security</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Keep your login credentials secure and confidential</li>
                      <li>• Notify us immediately of any unauthorized access</li>
                      <li>• Use strong passwords and enable two-factor authentication</li>
                      <li>• You are responsible for all activity under your account</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Data Accuracy</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Provide accurate and complete health information</li>
                      <li>• Upload only your own lab results and health data</li>
                      <li>• Update information when it changes</li>
                      <li>• Do not share false or misleading information</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Acceptable Use</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Use the service only for lawful purposes</li>
                      <li>• Do not attempt to hack, reverse engineer, or compromise our systems</li>
                      <li>• Do not upload malicious files or content</li>
                      <li>• Respect the intellectual property rights of others</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription and Billing */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    <span>Subscription & Billing</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Subscription Plans</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• We offer various subscription plans with different features</li>
                      <li>• All prices are clearly displayed before purchase</li>
                      <li>• Subscriptions automatically renew unless cancelled</li>
                      <li>• Free trial periods are available for new users</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Payment Terms</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Payment is due at the beginning of each billing cycle</li>
                      <li>• We accept major credit cards and process payments through Stripe</li>
                      <li>• Failed payments may result in service suspension</li>
                      <li>• All fees are non-refundable except as required by law</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Cancellation</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• You may cancel your subscription at any time</li>
                      <li>• Cancellation takes effect at the end of the current billing period</li>
                      <li>• No partial refunds for unused portions of subscription periods</li>
                      <li>• Your data remains accessible during the current billing period</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Intellectual Property */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span>Intellectual Property</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">PixelPharm's Rights</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      The PixelPharm service and its original content, features, and functionality are owned by PixelPharm and are protected by:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• International copyright laws</li>
                      <li>• Trademark protections</li>
                      <li>• Patent rights</li>
                      <li>• Other intellectual property rights</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Your Rights</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• You retain ownership of your health data</li>
                      <li>• You grant us a limited license to process your data to provide our services</li>
                      <li>• You can download and delete your data at any time</li>
                      <li>• We do not claim ownership of your uploaded content</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Disclaimers and Limitations */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span>Disclaimers & Limitations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Medical Disclaimers</h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-red-800 text-sm font-medium mb-2">
                        IMPORTANT: PixelPharm is not a medical device or healthcare provider.
                      </p>
                      <ul className="text-red-700 text-sm space-y-1">
                        <li>• Our insights are for informational purposes only</li>
                        <li>• Do not use our service for medical emergencies</li>
                        <li>• Always consult healthcare professionals for medical advice</li>
                        <li>• We are not liable for medical decisions based on our analysis</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Service Availability</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• We strive for 99.9% uptime but cannot guarantee uninterrupted service</li>
                      <li>• Maintenance windows may temporarily affect availability</li>
                      <li>• We are not liable for damages caused by service interruptions</li>
                      <li>• AI analysis accuracy may vary and is not guaranteed</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Limitation of Liability</h4>
                    <p className="text-sm text-gray-600">
                      To the fullest extent permitted by law, PixelPharm shall not be liable for any indirect, 
                      incidental, special, consequential, or punitive damages, or any loss of profits or revenues, 
                      whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Termination */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span>Termination</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Termination by You</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• You may terminate your account at any time</li>
                      <li>• Cancellation can be done through your account settings</li>
                      <li>• Your data will be retained according to our Privacy Policy</li>
                      <li>• You may request complete data deletion</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Termination by PixelPharm</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      We may terminate or suspend your account if you:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Violate these Terms of Service</li>
                      <li>• Fail to pay subscription fees</li>
                      <li>• Engage in prohibited or illegal activities</li>
                      <li>• Compromise the security or integrity of our services</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Governing Law */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Scale className="h-5 w-5 text-purple-600" />
                    <span>Governing Law & Disputes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Applicable Law</h4>
                    <p className="text-sm text-gray-600">
                      These Terms shall be interpreted and governed by the laws of the State of California, United States, 
                      without regard to conflict of law provisions.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Dispute Resolution</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• We encourage resolving disputes through direct communication first</li>
                      <li>• Disputes will be resolved through binding arbitration</li>
                      <li>• Arbitration will be conducted under the rules of the American Arbitration Association</li>
                      <li>• You waive the right to participate in class action lawsuits</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Changes to Terms */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <span>Changes to Terms</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    We reserve the right to modify these terms at any time. We will notify users of any material changes 
                    via email or through our service at least 30 days before the changes take effect.
                  </p>
                  <p className="text-sm text-gray-600">
                    Your continued use of the service after changes become effective constitutes acceptance of the new terms. 
                    If you do not agree to the new terms, you must discontinue using our service.
                  </p>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <span>Contact Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    If you have questions about these Terms of Service, please contact us:
                  </p>
                  <div className="space-y-2 text-sm">
                    <p><strong>Email:</strong> <a href="mailto:legal@pixelpharm.com" className="text-blue-600 hover:underline">legal@pixelpharm.com</a></p>
                    <p><strong>Mail:</strong> PixelPharm Legal Team, 123 Health St, San Francisco, CA 94102</p>
                    <p><strong>Phone:</strong> 1-800-PIXEL-FARM (for legal inquiries only)</p>
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