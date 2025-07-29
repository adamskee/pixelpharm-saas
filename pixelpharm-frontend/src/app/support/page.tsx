"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  MessageCircle,
  Mail,
  Phone,
  Clock,
  HelpCircle,
  FileText,
  Bug,
  Lightbulb,
  Shield,
  CreditCard,
  Users,
  Search,
  ChevronDown,
  ChevronRight,
  Send,
  CheckCircle
} from "lucide-react";

export default function SupportPage() {
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "general"
  });
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { id: "general", name: "General Questions", icon: <HelpCircle className="h-5 w-5" /> },
    { id: "technical", name: "Technical Issues", icon: <Bug className="h-5 w-5" /> },
    { id: "billing", name: "Billing & Subscriptions", icon: <CreditCard className="h-5 w-5" /> },
    { id: "privacy", name: "Privacy & Security", icon: <Shield className="h-5 w-5" /> },
    { id: "feature", name: "Feature Requests", icon: <Lightbulb className="h-5 w-5" /> }
  ];

  const faqs = [
    {
      question: "How accurate is PixelPharm's AI analysis?",
      answer: "Our AI models are trained on millions of lab results and achieve 95%+ accuracy when compared to clinical standards. However, our analysis should always be used alongside professional medical advice.",
      category: "general"
    },
    {
      question: "What file formats can I upload?",
      answer: "We support PDF lab reports from most major labs, as well as CSV and Excel files. Our AI can process most standard lab report formats automatically.",
      category: "technical"
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time with no cancellation fees. Your access will continue until the end of your current billing period.",
      category: "billing"
    },
    {
      question: "Is my health data secure?",
      answer: "Absolutely. We use bank-level encryption, are HIPAA compliant, and never sell your data. Your health information is stored in secure, encrypted databases.",
      category: "privacy"
    },
    {
      question: "Do you offer integrations with other health apps?",
      answer: "We're continuously expanding our integrations. Currently, we support manual data import and are working on direct integrations with popular health tracking apps.",
      category: "feature"
    },
    {
      question: "How often should I upload new lab results?",
      answer: "We recommend uploading new results as soon as you receive them. Most people get comprehensive lab work every 3-6 months, but this varies based on individual health needs.",
      category: "general"
    },
    {
      question: "My upload failed. What should I do?",
      answer: "First, ensure your file is under 10MB and in a supported format (PDF, CSV, Excel). If issues persist, try refreshing the page or contact our support team with the error message.",
      category: "technical"
    },
    {
      question: "How do I update my billing information?",
      answer: "You can update your billing information in your account settings under the 'Billing' section. Changes take effect immediately for future billing cycles.",
      category: "billing"
    }
  ];

  const filteredFAQs = faqs.filter(faq => faq.category === selectedCategory);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

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
              <Link href="/support" className="text-blue-600 font-medium">Support</Link>
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
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How Can We Help You?
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Get the support you need to make the most of your health analytics journey
            </p>
            
            {/* Quick Contact Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <MessageCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Live Chat</h3>
                  <p className="text-sm text-gray-600 mb-4">Chat with our support team in real-time</p>
                  <Button size="sm" className="w-full">Start Chat</Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 text-center">
                  <Mail className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Email Support</h3>
                  <p className="text-sm text-gray-600 mb-4">Get detailed help via email</p>
                  <Button size="sm" variant="outline" className="w-full">
                    <a href="mailto:support@pixelpharm.com">Send Email</a>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 text-center">
                  <Phone className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Phone Support</h3>
                  <p className="text-sm text-gray-600 mb-4">Speak directly with our team</p>
                  <Button size="sm" variant="outline" className="w-full">
                    <a href="tel:1-800-PIXEL-FARM">Call Us</a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Support Hours */}
        <section className="py-8 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center space-x-4">
                  <Clock className="h-6 w-6 text-blue-600" />
                  <div className="text-center">
                    <h3 className="font-semibold text-blue-900 mb-1">Support Hours</h3>
                    <p className="text-blue-800 text-sm">
                      Monday - Friday: 8AM - 8PM PST | Saturday - Sunday: 10AM - 6PM PST
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600">
                Find quick answers to common questions
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Category Sidebar */}
              <div className="lg:col-span-1">
                <h3 className="font-semibold mb-4">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {category.icon}
                      <span className="text-sm font-medium">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* FAQ Content */}
              <div className="lg:col-span-3">
                <div className="space-y-4">
                  {filteredFAQs.map((faq, index) => (
                    <Card key={index} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-0">
                        <button
                          onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                          className="w-full flex items-center justify-between p-6 text-left"
                        >
                          <h4 className="font-semibold text-gray-900 pr-4">{faq.question}</h4>
                          {expandedFAQ === index ? (
                            <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0" />
                          )}
                        </button>
                        {expandedFAQ === index && (
                          <div className="px-6 pb-6">
                            <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Still Need Help?
              </h2>
              <p className="text-xl text-gray-600">
                Send us a message and we'll get back to you within 24 hours
              </p>
            </div>

            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-6">
                {submitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Message Sent!</h3>
                    <p className="text-gray-600">
                      Thank you for contacting us. We'll get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Your full name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="Brief description of your question"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Please provide details about your question or issue..."
                        rows={6}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Resources Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Additional Resources
              </h2>
              <p className="text-xl text-gray-600">
                Helpful guides and documentation to get the most out of PixelPharm
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 text-center">
                  <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">User Guide</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Comprehensive guide to using all PixelPharm features
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    View Guide
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 text-center">
                  <HelpCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Video Tutorials</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Step-by-step video guides for common tasks
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    Watch Videos
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 text-center">
                  <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Community Forum</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Connect with other users and share experiences
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    Join Forum
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Emergency Notice */}
        <section className="py-8 bg-red-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <Shield className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">Medical Emergency Notice</h3>
                    <p className="text-red-800 text-sm">
                      PixelPharm is not intended for medical emergencies. If you're experiencing a medical emergency, 
                      please call 911 (US) or your local emergency services immediately. Our support team cannot 
                      provide medical advice or emergency assistance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                <li><Link href="/auth/signup" className="text-gray-300 hover:text-white">Get Started</Link></li>
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