"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

export default function AuthForm() {
  return (
    <div className="min-h-screen relative flex items-center justify-start">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/videos/gen4.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 z-10" />

      {/* Auth Form */}
      <div className="relative z-20 ml-8 md:ml-16 lg:ml-24">
        <div className="backdrop-blur-md bg-white/10 rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">PixelPharm</h1>
            <p className="text-white/80">AI-Powered Health Analytics</p>
          </div>

          <Authenticator
            loginMechanisms={["email"]}
            signUpAttributes={["email"]}
            hideSignUp={false}
            formFields={{
              signUp: {
                email: {
                  order: 1,
                  required: true,
                },
                password: {
                  order: 2,
                  required: true,
                },
                confirm_password: {
                  order: 3,
                  required: true,
                },
              },
            }}
            components={{
              Header() {
                return null;
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
