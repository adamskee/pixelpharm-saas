// src/app/api/auth/credentials/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/database/client";

interface AuthRequest {
  email: string;
  password: string;
  action: "signin" | "signup";
  firstName?: string;
  lastName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, action, firstName, lastName }: AuthRequest =
      await request.json();

    console.log("🔐 Credentials auth request:", {
      email,
      action,
      hasFirstName: !!firstName,
      hasLastName: !!lastName,
    });

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    if (action === "signup") {
      return await handleSignUp(normalizedEmail, password, firstName, lastName);
    } else {
      return await handleSignIn(normalizedEmail, password);
    }
  } catch (error: any) {
    console.error("❌ Credentials auth error:", error);
    return NextResponse.json(
      {
        error: "Authentication failed",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

async function handleSignUp(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string
) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("❌ User already exists:", email);
      return NextResponse.json(
        {
          error:
            "An account with this email already exists. Please sign in instead.",
        },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate user ID
    const userId = `user-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        userId,
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        name: `${firstName || ""} ${lastName || ""}`.trim() || null,
        passwordHash: hashedPassword,
        provider: "credentials",
        emailVerified: null, // You can implement email verification later
      },
    });

    console.log("✅ New user created:", {
      userId: newUser.userId,
      email: newUser.email,
    });

    // Return user data (without password hash)
    const userResponse = {
      id: newUser.userId,
      email: newUser.email,
      name: newUser.name,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      provider: "credentials",
    };

    return NextResponse.json(
      {
        user: userResponse,
        message: "Account created successfully!",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Sign up error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}

async function handleSignIn(email: string, password: string) {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("❌ User not found:", email);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user signed up with credentials (has password)
    if (!user.passwordHash) {
      console.log("❌ User exists but has no password (OAuth user):", email);
      return NextResponse.json(
        {
          error:
            "This email is associated with a Google account. Please sign in with Google.",
        },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      console.log("❌ Invalid password for user:", email);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    console.log("✅ User authenticated successfully:", email);

    // Return user data (without password hash)
    const userResponse = {
      id: user.userId,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      provider: "credentials",
    };

    return NextResponse.json(
      {
        user: userResponse,
        message: "Signed in successfully!",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Sign in error:", error);
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 });
  }
}
