"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGlobal } from '@/lib/context/GlobalContext';
import { createSPASassClient } from '@/lib/supabase/client';
import { Key, User, CheckCircle } from 'lucide-react';
import { MFASetup } from '@/components/MFASetup';

export default function UserSettingsPage() {
    const { user } = useGlobal();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Handle scroll to anchor on page load
    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.hash) {
            const element = document.querySelector(window.location.hash);
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        }
    }, []);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("New passwords don&apos;t match");
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const supabase = await createSPASassClient();
            const client = supabase.getSupabaseClient();

            const { error } = await client.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            setSuccess('Password updated successfully');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: Error | unknown) {
            if (err instanceof Error) {
                console.error('Error updating password:', err);
                setError(err.message);
            } else {
                console.error('Error updating password:', err);
                setError('Failed to update password');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20 p-4 sm:p-6">
            <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
                {/* Page Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-blue-600 to-violet-600 bg-clip-text text-transparent">
                        User Settings
                    </h1>
                    <p className="text-lg sm:text-xl text-blue-600/70 max-w-2xl mx-auto leading-relaxed">
                        Manage your account settings and preferences with world-class security
                    </p>
                </div>

                {/* Alert Messages */}
                {error && (
                    <Alert variant="destructive" className="bg-gradient-to-br from-red-50 via-red-100 to-pink-50 border-red-200 backdrop-blur-sm shadow-lg">
                        <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="bg-gradient-to-br from-blue-50 via-blue-100 to-violet-50 border-blue-200 backdrop-blur-sm shadow-lg">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-700">{success}</AlertDescription>
                    </Alert>
                )}

                {/* Settings Cards Grid */}
                <div className="grid gap-6 sm:gap-8 lg:grid-cols-1 max-w-3xl mx-auto">
                    
                    {/* User Details Card */}
                    <Card className="group relative transition-all duration-500 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 bg-white/90 backdrop-blur-sm border-2 border-blue-200 hover:border-blue-300 hover:border-violet-300 overflow-hidden">
                        {/* Enhanced gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] via-violet-500/[0.02] to-purple-500/[0.01] group-hover:from-blue-500/[0.05] group-hover:via-violet-500/[0.05] group-hover:to-purple-500/[0.03] pointer-events-none transition-all duration-500" />
                        
                        <CardHeader className="bg-gradient-to-r from-gray-800 via-blue-500 to-blue-600 text-white">
                            <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                                <div className="p-2 bg-white/20 rounded-xl shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                                    <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                </div>
                                User Details
                            </CardTitle>
                            <CardDescription className="text-blue-100 text-sm sm:text-base">
                                Your account information and profile details
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6 sm:p-8">
                            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-xs sm:text-sm font-semibold text-blue-700 uppercase tracking-wider">User ID</label>
                                    <p className="text-sm sm:text-lg font-mono text-gray-700 bg-blue-50/50 p-3 rounded-lg border border-blue-200 truncate">{user?.id}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs sm:text-sm font-semibold text-blue-700 uppercase tracking-wider">Email Address</label>
                                    <p className="text-sm sm:text-lg text-gray-700 bg-blue-50/50 p-3 rounded-lg border border-blue-200 truncate">{user?.email}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Change Password Card */}
                    <Card id="password" className="group relative transition-all duration-500 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 bg-white/90 backdrop-blur-sm border-2 border-blue-200 hover:border-blue-300 hover:border-violet-300 overflow-hidden">
                        {/* Enhanced gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] via-violet-500/[0.02] to-purple-500/[0.01] group-hover:from-blue-500/[0.05] group-hover:via-violet-500/[0.05] group-hover:to-purple-500/[0.03] pointer-events-none transition-all duration-500" />
                        
                        <CardHeader className="bg-gradient-to-r from-blue-600 via-violet-500 to-violet-600 text-white">
                            <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                                <div className="p-2 bg-white/20 rounded-xl shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                                    <Key className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                </div>
                                Change Password
                            </CardTitle>
                            <CardDescription className="text-violet-100 text-sm sm:text-base">
                                Update your account password for enhanced security
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 sm:p-8">
                            <form onSubmit={handlePasswordChange} className="space-y-6">
                                <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label htmlFor="new-password" className="block text-xs sm:text-sm font-semibold text-blue-700 uppercase tracking-wider">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            id="new-password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full rounded-xl border-2 border-blue-200 px-3 sm:px-4 py-2 sm:py-3 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all duration-300 bg-white/80 backdrop-blur-sm text-sm sm:text-lg"
                                            required
                                            minLength={6}
                                            placeholder="Enter your new password"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="confirm-password" className="block text-xs sm:text-sm font-semibold text-blue-700 uppercase tracking-wider">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            id="confirm-password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full rounded-xl border-2 border-blue-200 px-3 sm:px-4 py-2 sm:py-3 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all duration-300 bg-white/80 backdrop-blur-sm text-sm sm:text-lg"
                                            required
                                            minLength={6}
                                            placeholder="Confirm your new password"
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    variant="secondary"
                                    disabled={loading || !newPassword || !confirmPassword}
                                    className="w-full flex justify-center items-center gap-2 py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-lg"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span className="truncate">Updating Password...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Key className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                                            <span className="truncate">Update Password</span>
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Two-Factor Authentication Card */}
                    <div id="mfa" className="transition-all duration-500 hover:scale-105 hover:-translate-y-2">
                        <MFASetup
                            onStatusChange={() => {
                                setSuccess('Two-factor authentication settings updated successfully');
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}