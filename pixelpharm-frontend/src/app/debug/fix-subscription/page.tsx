"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FixSubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const fixSubscription = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/fix-user-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to fix subscription' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Fix User Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              This will manually set your account to Pro status since the Stripe webhook didn't fire.
            </p>
            
            <Button 
              onClick={fixSubscription} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Fixing...' : 'Fix My Pro Subscription'}
            </Button>

            {result && (
              <div className="mt-4 p-4 rounded-lg bg-gray-100">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}