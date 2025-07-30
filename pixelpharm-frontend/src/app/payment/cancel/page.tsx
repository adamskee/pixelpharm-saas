"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, ArrowLeft, ArrowRight, HelpCircle, CreditCard } from 'lucide-react';

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Payment Cancelled
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            No worries! Your payment was not processed and no charges were made to your account.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-blue-500" />
                <span>Try Again</span>
              </CardTitle>
              <CardDescription>
                Ready to continue with your subscription?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Your cart is still saved. You can complete your purchase anytime you're ready.
              </p>
              <div className="space-y-2">
                <h4 className="font-medium">What you'll get:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• AI-powered health analysis</li>
                  <li>• Comprehensive biomarker insights</li>
                  <li>• Trend tracking and predictions</li>
                  <li>• Personalized recommendations</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HelpCircle className="h-5 w-5 text-purple-500" />
                <span>Need Help?</span>
              </CardTitle>
              <CardDescription>
                Common reasons for payment cancellation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm">Payment Issues</h4>
                  <p className="text-sm text-gray-600">Check your card details or try a different payment method</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm">Have Questions?</h4>
                  <p className="text-sm text-gray-600">Our support team is here to help with any concerns</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm">Need More Info?</h4>
                  <p className="text-sm text-gray-600">Learn more about our features and pricing options</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Return to Pricing
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/support">
              <Button size="lg" variant="outline">
                Contact Support
              </Button>
            </Link>
          </div>
          
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Homepage
          </Link>
        </div>

        {/* Alternative Options */}
        <Card className="mt-12 bg-gray-50 border-gray-200">
          <CardContent className="p-6">
            <div className="text-center">
              <h4 className="font-medium text-gray-900 mb-2">Still Interested?</h4>
              <p className="text-gray-600 text-sm mb-4">
                Join our newsletter to stay updated on new features and special offers.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                />
                <Button variant="outline" size="sm">
                  Subscribe
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Your payment information is secure and protected. No charges were made to your account.
          </p>
        </div>
      </div>
    </div>
  );
}