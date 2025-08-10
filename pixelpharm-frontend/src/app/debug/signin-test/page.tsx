"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignInTestPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [debugResult, setDebugResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCheckUser = async () => {
    if (!email) {
      alert('Please enter an email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/debug/check-user-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setDebugResult({
        status: response.status,
        data,
        timestamp: new Date().toLocaleString(),
      });
    } catch (error) {
      setDebugResult({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toLocaleString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAllUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/fix-user-passwords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      setDebugResult({
        status: response.status,
        data,
        timestamp: new Date().toLocaleString(),
      });
    } catch (error) {
      setDebugResult({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toLocaleString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUserFromStripe = async () => {
    if (!sessionId && !email) {
      alert('Please enter either a Stripe session ID or email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/debug/create-user-from-stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, email, password }),
      });

      const data = await response.json();
      setDebugResult({
        status: response.status,
        data,
        timestamp: new Date().toLocaleString(),
      });
    } catch (error) {
      setDebugResult({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toLocaleString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFixGoogleOAuthPayment = async () => {
    if (!email) {
      alert('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/debug/fix-google-oauth-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, paymentIntentId }),
      });

      const data = await response.json();
      setDebugResult({
        status: response.status,
        data,
        timestamp: new Date().toLocaleString(),
      });
    } catch (error) {
      setDebugResult({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toLocaleString(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Sign In Debug Tool</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Check Specific User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Password (optional for debug)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button 
                onClick={handleCheckUser} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Checking...' : 'Check User'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Check All Users</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleCheckAllUsers} 
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                {loading ? 'Checking...' : 'Check All Credentials Users'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-700">🚨 Recovery Tool</CardTitle>
              <p className="text-sm text-gray-600">Create missing user from Stripe payment</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="text"
                placeholder="Stripe Session ID (cs_...)"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
              />
              <div className="text-xs text-gray-500">
                Or use email + password from above ↑
              </div>
              <Button 
                onClick={handleCreateUserFromStripe} 
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {loading ? 'Creating...' : 'Create User from Stripe'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-700">💳 Google OAuth Payment Fix</CardTitle>
              <p className="text-sm text-gray-600">Fix subscription for paid Google OAuth users</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="text"
                placeholder="Payment Intent ID (pi_...)"
                value={paymentIntentId}
                onChange={(e) => setPaymentIntentId(e.target.value)}
              />
              <div className="text-xs text-gray-500">
                Enter email above ↑ and payment intent ID
              </div>
              <Button 
                onClick={handleFixGoogleOAuthPayment} 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Fixing...' : 'Fix OAuth User Subscription'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {debugResult && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Debug Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm overflow-auto">
                  {JSON.stringify(debugResult, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Check Specific User:</strong> Enter the email of the user having signin issues to see their database record and password status.</p>
              <p><strong>Check All Users:</strong> See all users with credentials provider and their password hash status.</p>
              <p><strong>🚨 Recovery Tool:</strong> If a user paid via Stripe but doesn't exist in database (User not found error), use this to create their account.</p>
              <p><strong>Expected:</strong> Users should have a passwordHash field with a bcrypt hash (starts with $2b$).</p>
              <p><strong>Issues:</strong> Users missing passwordHash or with empty/null values cannot sign in.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}