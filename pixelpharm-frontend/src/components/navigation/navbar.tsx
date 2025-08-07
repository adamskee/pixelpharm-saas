"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/auth-context";
import { User, LogOut, Settings, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function Navbar() {
  const { user, signOut } = useAuth();

  const userInitials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() ||
      user.email[0].toUpperCase()
    : "U";

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Image 
              src="/pp_logo.png" 
              alt="PixelPharm Health Logo" 
              width={200} 
              height={47}
              className="h-auto max-h-10"
              priority
            />
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium hover:text-blue-600"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/health-analytics"
            className="text-sm font-medium hover:text-blue-600"
          >
            Health Analytics
          </Link>
          <Link
            href="/dashboard/health-optimization"
            className="text-sm font-medium hover:text-blue-600 flex items-center space-x-1"
          >
            <Zap className="h-4 w-4" />
            <span>Health Optimization</span>
          </Link>
          <Link
            href="/upload"
            className="text-sm font-medium hover:text-blue-600"
          >
            Upload Data
          </Link>
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                {userInitials}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
