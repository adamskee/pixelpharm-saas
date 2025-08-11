"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight, Download, Star, Loader2 } from 'lucide-react';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signinAttempted, setSigninAttempted] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const handlePostPaymentAuth = async () => {
      if (!sessionId || signinAttempted) return;

      console.log('🔐 Handling post-payment authentication...');
      setSigninAttempted(true);

      try {
        // If user is already signed in (Google OAuth), just verify their session and continue
        if (session?.user) {
          console.log('✅ User already authenticated via OAuth:', session.user.email);
          setUserEmail(session.user.email);
          
          // For OAuth users, verify their subscription was updated by the webhook
          try {
            const verifyResponse = await fetch('/api/user/subscription-status');
            const verifyData = await verifyResponse.json();
            
            if (verifyResponse.ok && verifyData.hasActiveSubscription) {
              console.log('✅ OAuth user subscription verified and active:', verifyData);
              setSessionData({
                mode: 'payment',
                amount_total: 0, // For 100% discount coupons
                user: session.user,
                subscriptionInfo: verifyData
              });
            } else {
              console.warn('⚠️ OAuth user subscription not active yet:', verifyData);
              // For OAuth users whose webhook hasn't processed yet, show a message
              console.log('💡 OAuth user needs subscription activation - use debug tool');
              setSessionData({
                mode: 'payment',
                amount_total: 0,
                user: session.user,
                needsSubscriptionFix: true,
                subscriptionInfo: verifyData
              });
            }
          } catch (verifyError) {
            console.warn('⚠️ Error verifying OAuth user subscription:', verifyError);
            setSessionData({
              mode: 'payment', 
              amount_total: 0,
              user: session.user,
              needsSubscriptionFix: true
            });
          }
          
          setLoading(false);
          return;
        }

        // For credentials-based users, get user info from the post-payment signin API
        const response = await fetch('/api/auth/post-payment-signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (response.ok && data.user) {
          console.log('✅ Got user data from payment session:', data.user.email);
          setUserEmail(data.user.email);
          setSessionData(data);

          // If user is not already signed in, show sign-in instructions
          if (status !== 'loading' && !session) {
            console.log('👤 User needs to sign in manually');
          }
        } else {
          console.error('❌ Failed to get user data:', data.error);
          // If this fails but we have a session, it might be a Google OAuth user
          if (session?.user) {
            console.log('✅ Fallback: Using existing session data');
            setUserEmail(session.user.email);
          } else {
            // For credentials users who aren't signed in, we need to show signin instructions
            console.log('❌ No session and failed to get user data - user needs to sign in');
            // We still have the sessionId, so we know a payment was made
            // Set a placeholder email so we show the sign-in required message
            if (sessionId) {
              setUserEmail('payment_completed_but_not_signed_in');
            }
          }
        }
      } catch (error) {
        console.error('❌ Error in post-payment auth:', error);
        // If this fails but we have a session, it might be a Google OAuth user
        if (session?.user) {
          console.log('✅ Fallback: Using existing session data');
          setUserEmail(session.user.email);
        } else {
          // For credentials users, show sign-in required message
          console.log('❌ Error and no session - user needs to sign in');
          if (sessionId) {
            setUserEmail('payment_completed_but_not_signed_in');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    handlePostPaymentAuth();
  }, [sessionId, signinAttempted, session, status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

  // Show sign-in required message if user is not authenticated
  if (status !== 'loading' && !session && userEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Payment Successful!
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Your account has been created successfully. Please sign in to access your dashboard.
            </p>
          </div>

          <Card className="bg-blue-50 border-blue-200 mb-8">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Ready to Access Your Dashboard
              </h3>
              <p className="text-blue-700 mb-6">
                {userEmail === 'payment_completed_but_not_signed_in' ? (
                  <>Your account has been created and your subscription is active. Please sign in using the email and password you provided during checkout.</>
                ) : (
                  <>Your account (<strong>{userEmail}</strong>) has been created and your subscription is active. Please sign in using the password you set during checkout.</>
                )}
              </p>
              <Link href="/auth/signin">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Sign In to Dashboard
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Questions? Contact our support team at{' '}
              <Link href="/support" className="text-blue-600 hover:underline">
                support@pixelpharm.com
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show OAuth subscription fix needed message
  if (session?.user && sessionData?.needsSubscriptionFix) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-6">
              <CheckCircle className="h-10 w-10 text-orange-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Payment Received!
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Your payment was successful, but we need to activate your subscription. This usually happens automatically, but may take a moment.
            </p>
          </div>

          <Card className="bg-orange-50 border-orange-200 mb-8">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {session.user.image ? (
                    <img 
                      src={session.user.image} 
                      alt="Profile" 
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-orange-900 mb-2">
                    Account: {session.user.name}
                  </h3>
                  <p className="text-orange-800 mb-4">
                    Email: <strong>{session.user.email}</strong>
                  </p>
                  <p className="text-orange-700 text-sm mb-4">
                    Your subscription is being activated. If this doesn't complete automatically, you can use our debug tool below.
                  </p>
                  
                  <div className="space-y-2">
                    <Link href="/dashboard">
                      <Button className="w-full bg-orange-600 hover:bg-orange-700">
                        Try Dashboard Access
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    </Link>
                    <p className="text-xs text-orange-600 text-center">
                      Session ID: {sessionId?.slice(-10)} (save this for support)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Need Help? Use Our Debug Tool
              </h3>
              <p className="text-blue-800 text-sm mb-4">
                If you can't access the dashboard, you can fix your subscription manually:
              </p>
              <Link href="/debug/signin-test">
                <Button variant="outline" className="border-blue-300 text-blue-800 hover:bg-blue-100">
                  Open Debug Tool
                </Button>
              </Link>
              <p className="text-xs text-blue-600 mt-2">
                Use "OAuth Session Fix" with your email and session ID above
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Thank you for choosing PixelPharm Health. Your subscription is now active and you have full access to all features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span>What's Next?</span>
              </CardTitle>
              <CardDescription>
                Get started with your PixelPharm Health experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Upload Your First Blood Test</h4>
                  <p className="text-sm text-gray-600">Start by uploading your lab results to get AI-powered insights</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Explore Your Dashboard</h4>
                  <p className="text-sm text-gray-600">View comprehensive health analytics and trends</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Set Up Notifications</h4>
                  <p className="text-sm text-gray-600">Configure alerts for abnormal values and health reports</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>
                Your plan information and billing details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessionData ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-medium">
                      {sessionData.mode === 'subscription' ? 'Basic Monthly' : 'Pro (30 Days)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">
                      {sessionData.amount_total === 0 ? (
                        <span className="text-green-600">Free (100% Discount)</span>
                      ) : (
                        `$${(sessionData.amount_total / 100).toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium text-green-600">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Session ID:</span>
                    <span className="font-mono text-sm">{sessionId?.slice(-10)}</span>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium text-green-600">Payment Confirmed</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Your subscription is now active. Check your email for the receipt and welcome information.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Go to Dashboard
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button size="lg" variant="outline">
                Manage Subscription
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-gray-600 mt-8">
            Questions? Contact our support team at{' '}
            <Link href="/support" className="text-blue-600 hover:underline">
              support@pixelpharm.com
            </Link>
          </p>
        </div>

        {/* Confirmation Email Notice */}
        <Card className="mt-12 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Download className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Receipt & Welcome Email</h4>
                <p className="text-blue-700 text-sm">
                  We've sent your payment receipt and welcome information to your email address. 
                  If you don't see it within a few minutes, please check your spam folder.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}