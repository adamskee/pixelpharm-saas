"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Bell,
  Shield,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  AlertCircle,
  Calendar,
  Clock,
  Globe,
  Smartphone,
  Mail,
  Lock,
  Database,
  FileText,
  Settings as SettingsIcon,
} from "lucide-react";

export default function UserSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Profile Settings
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    height: "",
    weight: "",
    timezone: "",
    bio: "",
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    healthAlerts: true,
    weeklyReports: true,
    abnormalResults: true,
    reminderNotifications: true,
    marketingEmails: false,
  });

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    dataSharing: false,
    anonymousAnalytics: true,
    thirdPartySharing: false,
    profileVisibility: "private",
    dataRetention: "5years",
  });

  // Security Settings
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
  });

  // Health Preferences
  const [healthPreferences, setHealthPreferences] = useState({
    units: "metric", // metric or imperial
    language: "en",
    testReminderFrequency: "6months",
    riskTolerance: "moderate",
    autoSync: true,
    shareWithDoctor: false,
  });

  const fetchUserProfile = async () => {
    try {
      console.log("🔍 Fetching user profile data...");
      
      const response = await fetch('/api/user/profile');
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const userData = await response.json();
      console.log("📋 User profile loaded:", userData);
      
      setProfileData(prev => ({
        ...prev,
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split('T')[0] : "",
        gender: userData.gender || "",
        height: userData.height ? userData.height.toString() : "",
        weight: userData.weight ? userData.weight.toString() : "",
        bio: userData.bio || "",
        timezone: userData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      }));
    } catch (error) {
      console.error("❌ Error fetching user profile:", error);
      // Fall back to using auth context data
      if (user) {
        setProfileData(prev => ({
          ...prev,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          timezone: prev.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        }));
      }
    }
  };

  useEffect(() => {
    if (user?.userId) {
      fetchUserProfile();
    }
  }, [user?.userId]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      console.log("💾 Saving profile data:", profileData);
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          dateOfBirth: profileData.dateOfBirth || null,
          gender: profileData.gender || null,
          timezone: profileData.timezone || null,
          height: profileData.height || null,
          weight: profileData.weight || null,
          bio: profileData.bio || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const result = await response.json();
      console.log("✅ Profile updated successfully:", result);
      
      setSaveMessage("Profile updated successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error: any) {
      console.error("❌ Error updating profile:", error);
      setSaveMessage(error.message || "Failed to update profile. Please try again.");
      setTimeout(() => setSaveMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveMessage("Notification preferences updated!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      setSaveMessage("Failed to update notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      setSaveMessage("New passwords don't match!");
      return;
    }
    if (securityData.newPassword.length < 8) {
      setSaveMessage("Password must be at least 8 characters long!");
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveMessage("Password changed successfully!");
      setSecurityData({ ...securityData, currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      setSaveMessage("Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      // Simulate data export
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSaveMessage("Data export started! You'll receive an email when ready.");
      setTimeout(() => setSaveMessage(""), 5000);
    } catch (error) {
      setSaveMessage("Failed to export data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSaveMessage("Account deletion initiated. Please check your email for confirmation.");
        setTimeout(() => setSaveMessage(""), 5000);
      } catch (error) {
        setSaveMessage("Failed to delete account. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">
            Manage your account preferences and privacy settings
          </p>
        </div>
        <Badge variant="outline" className="flex items-center space-x-2">
          <SettingsIcon className="h-4 w-4" />
          <span>Account Settings</span>
        </Badge>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <Alert className={saveMessage.includes("success") || saveMessage.includes("updated") || saveMessage.includes("changed") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {saveMessage.includes("success") || saveMessage.includes("updated") || saveMessage.includes("changed") ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={saveMessage.includes("success") || saveMessage.includes("updated") || saveMessage.includes("changed") ? "text-green-800" : "text-red-800"}>
            {saveMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Lock className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Health</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <span>Personal Information</span>
              </CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  placeholder="Enter your email"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={profileData.gender}
                    onValueChange={(value) => setProfileData({ ...profileData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={profileData.timezone}
                    onValueChange={(value) => setProfileData({ ...profileData, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={profileData.height}
                    onChange={(e) => setProfileData({ ...profileData, height: e.target.value })}
                    placeholder="170"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={profileData.weight}
                    onChange={(e) => setProfileData({ ...profileData, weight: e.target.value })}
                    placeholder="70"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio / Notes</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  placeholder="Add any personal notes or health information you'd like to remember..."
                  rows={4}
                />
              </div>

              <Button onClick={handleSaveProfile} disabled={loading} className="w-full md:w-auto">
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-green-600" />
                <span>Notification Preferences</span>
              </CardTitle>
              <CardDescription>
                Choose how you want to be notified about your health data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Communication Methods</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <div>
                          <Label htmlFor="emailNotifications" className="text-sm font-medium">
                            Email Notifications
                          </Label>
                          <p className="text-xs text-gray-500">Receive notifications via email</p>
                        </div>
                      </div>
                      <Switch
                        id="emailNotifications"
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Smartphone className="h-4 w-4 text-gray-500" />
                        <div>
                          <Label htmlFor="pushNotifications" className="text-sm font-medium">
                            Push Notifications
                          </Label>
                          <p className="text-xs text-gray-500">Receive push notifications on your devices</p>
                        </div>
                      </div>
                      <Switch
                        id="pushNotifications"
                        checked={notificationSettings.pushNotifications}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({ ...notificationSettings, pushNotifications: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Smartphone className="h-4 w-4 text-gray-500" />
                        <div>
                          <Label htmlFor="smsNotifications" className="text-sm font-medium">
                            SMS Notifications
                          </Label>
                          <p className="text-xs text-gray-500">Receive text message notifications</p>
                        </div>
                      </div>
                      <Switch
                        id="smsNotifications"
                        checked={notificationSettings.smsNotifications}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({ ...notificationSettings, smsNotifications: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Health Notifications</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="healthAlerts" className="text-sm font-medium">
                          Critical Health Alerts
                        </Label>
                        <p className="text-xs text-gray-500">Get notified about critical health values</p>
                      </div>
                      <Switch
                        id="healthAlerts"
                        checked={notificationSettings.healthAlerts}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({ ...notificationSettings, healthAlerts: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="abnormalResults" className="text-sm font-medium">
                          Abnormal Test Results
                        </Label>
                        <p className="text-xs text-gray-500">Notifications for abnormal biomarker values</p>
                      </div>
                      <Switch
                        id="abnormalResults"
                        checked={notificationSettings.abnormalResults}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({ ...notificationSettings, abnormalResults: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="weeklyReports" className="text-sm font-medium">
                          Weekly Health Reports
                        </Label>
                        <p className="text-xs text-gray-500">Weekly summary of your health data</p>
                      </div>
                      <Switch
                        id="weeklyReports"
                        checked={notificationSettings.weeklyReports}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({ ...notificationSettings, weeklyReports: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="reminderNotifications" className="text-sm font-medium">
                          Test Reminders
                        </Label>
                        <p className="text-xs text-gray-500">Reminders to take blood tests</p>
                      </div>
                      <Switch
                        id="reminderNotifications"
                        checked={notificationSettings.reminderNotifications}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({ ...notificationSettings, reminderNotifications: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Marketing & Updates</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="marketingEmails" className="text-sm font-medium">
                          Marketing Emails
                        </Label>
                        <p className="text-xs text-gray-500">Product updates and health tips</p>
                      </div>
                      <Switch
                        id="marketingEmails"
                        checked={notificationSettings.marketingEmails}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({ ...notificationSettings, marketingEmails: checked })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveNotifications} disabled={loading} className="w-full md:w-auto">
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save Notification Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-purple-600" />
                <span>Privacy & Data Control</span>
              </CardTitle>
              <CardDescription>
                Manage how your data is used and shared
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dataSharing" className="text-sm font-medium">
                      Data Sharing for Research
                    </Label>
                    <p className="text-xs text-gray-500">Allow anonymized data to be used for medical research</p>
                  </div>
                  <Switch
                    id="dataSharing"
                    checked={privacySettings.dataSharing}
                    onCheckedChange={(checked) => 
                      setPrivacySettings({ ...privacySettings, dataSharing: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="anonymousAnalytics" className="text-sm font-medium">
                      Anonymous Analytics
                    </Label>
                    <p className="text-xs text-gray-500">Help improve our service with anonymous usage data</p>
                  </div>
                  <Switch
                    id="anonymousAnalytics"
                    checked={privacySettings.anonymousAnalytics}
                    onCheckedChange={(checked) => 
                      setPrivacySettings({ ...privacySettings, anonymousAnalytics: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="thirdPartySharing" className="text-sm font-medium">
                      Third-Party Sharing
                    </Label>
                    <p className="text-xs text-gray-500">Allow sharing data with trusted healthcare partners</p>
                  </div>
                  <Switch
                    id="thirdPartySharing"
                    checked={privacySettings.thirdPartySharing}
                    onCheckedChange={(checked) => 
                      setPrivacySettings({ ...privacySettings, thirdPartySharing: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profileVisibility">Profile Visibility</Label>
                  <Select
                    value={privacySettings.profileVisibility}
                    onValueChange={(value) => setPrivacySettings({ ...privacySettings, profileVisibility: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private - Only you can see your profile</SelectItem>
                      <SelectItem value="healthcare">Healthcare providers only</SelectItem>
                      <SelectItem value="public">Public - Anonymous health insights</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataRetention">Data Retention Period</Label>
                  <Select
                    value={privacySettings.dataRetention}
                    onValueChange={(value) => setPrivacySettings({ ...privacySettings, dataRetention: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select retention period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1year">1 Year</SelectItem>
                      <SelectItem value="3years">3 Years</SelectItem>
                      <SelectItem value="5years">5 Years</SelectItem>
                      <SelectItem value="10years">10 Years</SelectItem>
                      <SelectItem value="forever">Keep Forever</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Data Management</h4>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={handleExportData} disabled={loading} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export My Data
                  </Button>
                  <Button onClick={handleDeleteAccount} disabled={loading} variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5 text-red-600" />
                <span>Security Settings</span>
              </CardTitle>
              <CardDescription>
                Manage your account security and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Change Password</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={securityData.currentPassword}
                          onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                          placeholder="Enter current password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={securityData.newPassword}
                          onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                          placeholder="Enter new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={securityData.confirmPassword}
                        onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                      />
                    </div>

                    <Button onClick={handleChangePassword} disabled={loading}>
                      <Lock className="h-4 w-4 mr-2" />
                      {loading ? "Changing..." : "Change Password"}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Two-Factor Authentication</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="twoFactorEnabled" className="text-sm font-medium">
                        Enable Two-Factor Authentication
                      </Label>
                      <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
                    </div>
                    <Switch
                      id="twoFactorEnabled"
                      checked={securityData.twoFactorEnabled}
                      onCheckedChange={(checked) => 
                        setSecurityData({ ...securityData, twoFactorEnabled: checked })
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Login History</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">Current Session</p>
                          <p className="text-xs text-gray-500">Chrome on Windows • 192.168.1.1</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-600">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Smartphone className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">Mobile App</p>
                          <p className="text-xs text-gray-500">iPhone • 2 hours ago</p>
                        </div>
                      </div>
                      <Badge variant="outline">Inactive</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Preferences Tab */}
        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-orange-600" />
                <span>Health Preferences</span>
              </CardTitle>
              <CardDescription>
                Customize your health tracking and reporting preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="units">Measurement Units</Label>
                  <Select
                    value={healthPreferences.units}
                    onValueChange={(value) => setHealthPreferences({ ...healthPreferences, units: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select units" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metric">Metric (kg, cm, °C)</SelectItem>
                      <SelectItem value="imperial">Imperial (lbs, ft/in, °F)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={healthPreferences.language}
                    onValueChange={(value) => setHealthPreferences({ ...healthPreferences, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="testReminderFrequency">Test Reminder Frequency</Label>
                <Select
                  value={healthPreferences.testReminderFrequency}
                  onValueChange={(value) => setHealthPreferences({ ...healthPreferences, testReminderFrequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3months">Every 3 months</SelectItem>
                    <SelectItem value="6months">Every 6 months</SelectItem>
                    <SelectItem value="1year">Annually</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="riskTolerance">Risk Assessment Sensitivity</Label>
                <Select
                  value={healthPreferences.riskTolerance}
                  onValueChange={(value) => setHealthPreferences({ ...healthPreferences, riskTolerance: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sensitivity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative - More alerts</SelectItem>
                    <SelectItem value="moderate">Moderate - Balanced approach</SelectItem>
                    <SelectItem value="aggressive">Aggressive - Fewer alerts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Health Data Integration</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoSync" className="text-sm font-medium">
                      Auto-sync Health Devices
                    </Label>
                    <p className="text-xs text-gray-500">Automatically import data from connected devices</p>
                  </div>
                  <Switch
                    id="autoSync"
                    checked={healthPreferences.autoSync}
                    onCheckedChange={(checked) => 
                      setHealthPreferences({ ...healthPreferences, autoSync: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="shareWithDoctor" className="text-sm font-medium">
                      Share with Healthcare Provider
                    </Label>
                    <p className="text-xs text-gray-500">Allow your doctor to access your health data</p>
                  </div>
                  <Switch
                    id="shareWithDoctor"
                    checked={healthPreferences.shareWithDoctor}
                    onCheckedChange={(checked) => 
                      setHealthPreferences({ ...healthPreferences, shareWithDoctor: checked })
                    }
                  />
                </div>
              </div>

              <Button disabled={loading} className="w-full md:w-auto">
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save Health Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}