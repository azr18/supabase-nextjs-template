import React, { useState, useEffect } from 'react';
import { createSPASassClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, CheckCircle, XCircle, Loader2, Shield, Smartphone } from 'lucide-react';
import {Factor} from "@supabase/auth-js";

// Define the interface locally instead of importing from internal types
interface MFAEnrollTOTPParams {
    factorType: 'totp';
    friendlyName: string;
}

interface MFASetupProps {
    onStatusChange?: () => void;
}

export function MFASetup({ onStatusChange }: MFASetupProps) {
    const [factors, setFactors] = useState<Factor[]>([]);
    const [step, setStep] = useState<'list' | 'name' | 'enroll'>('list');
    const [factorId, setFactorId] = useState('');
    const [qr, setQR] = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [friendlyName, setFriendlyName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionInProgress, setActionInProgress] = useState(false);

    const fetchFactors = async () => {
        try {
            const supabase = await createSPASassClient();
            const { data, error } = await supabase.getSupabaseClient().auth.mfa.listFactors();

            if (error) throw error;

            setFactors(data.all || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching MFA factors:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch MFA status');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFactors();
    }, []);

    const startEnrollment = async () => {
        if (!friendlyName.trim()) {
            setError('Please provide a name for this authentication method');
            return;
        }

        setError('');
        setActionInProgress(true);

        try {
            const supabase = await createSPASassClient();
            const enrollParams: MFAEnrollTOTPParams = {
                factorType: 'totp',
                friendlyName: friendlyName.trim()
            };

            const { data, error } = await supabase.getSupabaseClient().auth.mfa.enroll(enrollParams);

            if (error) throw error;

            setFactorId(data.id);
            setQR(data.totp.qr_code);
            setStep('enroll');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start MFA enrollment');
            setStep('name');
        } finally {
            setActionInProgress(false);
        }
    };

    const verifyFactor = async () => {
        setError('');
        setActionInProgress(true);

        try {
            const supabase = await createSPASassClient();
            const client = supabase.getSupabaseClient();

            const challenge = await client.auth.mfa.challenge({ factorId });
            if (challenge.error) throw challenge.error;

            const verify = await client.auth.mfa.verify({
                factorId,
                challengeId: challenge.data.id,
                code: verifyCode
            });
            if (verify.error) throw verify.error;

            await fetchFactors();
            resetEnrollment();
            onStatusChange?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to verify MFA code');
        } finally {
            setActionInProgress(false);
        }
    };

    const unenrollFactor = async (factorId: string) => {
        setError('');
        setActionInProgress(true);

        try {
            const supabase = await createSPASassClient();
            const { error } = await supabase.getSupabaseClient().auth.mfa.unenroll({ factorId });

            if (error) throw error;

            await fetchFactors();
            onStatusChange?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to unenroll MFA factor');
        } finally {
            setActionInProgress(false);
        }
    };

    const resetEnrollment = () => {
        setStep('list');
        setFactorId('');
        setQR('');
        setVerifyCode('');
        setFriendlyName('');
        setError('');
    };

    if (loading) {
        return (
            <Card className="group relative transition-all duration-500 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 bg-white/90 backdrop-blur-sm border-2 border-blue-200 hover:border-blue-300 hover:border-violet-300 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] via-violet-500/[0.02] to-purple-500/[0.01] group-hover:from-blue-500/[0.05] group-hover:via-violet-500/[0.05] group-hover:to-purple-500/[0.03] pointer-events-none transition-all duration-500" />
                <CardContent className="flex justify-center items-center p-12">
                    <div className="flex items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <span className="text-lg text-blue-600 font-medium">Loading security settings...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="group relative transition-all duration-500 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 bg-white/90 backdrop-blur-sm border-2 border-blue-200 hover:border-blue-300 hover:border-violet-300 overflow-hidden">
            {/* Enhanced gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] via-violet-500/[0.02] to-purple-500/[0.01] group-hover:from-blue-500/[0.05] group-hover:via-violet-500/[0.05] group-hover:to-purple-500/[0.03] pointer-events-none transition-all duration-500" />
            
            <CardHeader className="bg-gradient-to-r from-violet-600 via-purple-500 to-purple-600 text-white">
                <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-white/20 rounded-xl shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                        <Shield className="h-6 w-6 text-white" />
                    </div>
                    Two-Factor Authentication (2FA)
                </CardTitle>
                <CardDescription className="text-purple-100">
                    Add an additional layer of security to your account with world-class protection
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
                {error && (
                    <Alert variant="destructive" className="bg-gradient-to-br from-red-50 via-red-100 to-pink-50 border-red-200 backdrop-blur-sm shadow-lg">
                        <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                )}

                {factors.length > 0 && step === 'list' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-blue-700 mb-4">Active Authentication Methods</h3>
                        {factors.map((factor) => (
                            <div key={factor.id} className="flex items-center justify-between p-6 border-2 border-blue-200 rounded-xl bg-blue-50/30 backdrop-blur-sm hover:bg-blue-50/50 transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl shadow-lg ${factor.status === 'verified' ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
                                        {factor.status === 'verified' ? (
                                            <CheckCircle className="h-6 w-6 text-white" />
                                        ) : (
                                            <XCircle className="h-6 w-6 text-white" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-lg text-gray-800">
                                            {factor.friendly_name || 'Authenticator App'}
                                        </p>
                                        <p className="text-sm text-blue-600">
                                            Added on {new Date(factor.created_at).toLocaleDateString()}
                                        </p>
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                                            factor.status === 'verified' 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {factor.status === 'verified' ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => unenrollFactor(factor.id)}
                                    disabled={actionInProgress}
                                    className="px-4 py-2 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-300 disabled:opacity-50 border border-red-200 hover:border-red-300"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {step === 'name' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-blue-700 mb-4">Setup New Authentication Method</h3>
                        <div className="space-y-3">
                            <label htmlFor="friendly-name" className="block text-sm font-semibold text-blue-700 uppercase tracking-wider">
                                Device Name
                            </label>
                            <input
                                id="friendly-name"
                                type="text"
                                value={friendlyName}
                                onChange={(e) => setFriendlyName(e.target.value)}
                                className="w-full rounded-xl border-2 border-blue-200 px-4 py-3 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all duration-300 bg-white/80 backdrop-blur-sm text-lg"
                                placeholder="e.g., Work Phone, Personal iPhone"
                                autoFocus
                            />
                            <p className="text-sm text-blue-600">
                                Give this authentication method a name to help you identify it later
                            </p>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={resetEnrollment}
                                disabled={actionInProgress}
                                className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={startEnrollment}
                                disabled={actionInProgress || !friendlyName.trim()}
                                className="flex justify-center items-center gap-2 py-3 px-6 border-0 rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-600 via-purple-500 to-purple-600 hover:from-violet-700 hover:via-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                            >
                                {actionInProgress ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Smartphone className="h-4 w-4" />
                                        Continue
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {step === 'enroll' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-blue-700 mb-4">Scan QR Code</h3>
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                {qr && (
                                    <div className="p-4 bg-white rounded-2xl shadow-lg border-2 border-blue-200">
                                        <img
                                            src={qr}
                                            alt="QR Code for Two-Factor Authentication"
                                            className="w-48 h-48 rounded-lg"
                                        />
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-blue-600 max-w-md mx-auto">
                                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.) to complete setup
                            </p>
                        </div>

                        <div className="space-y-3">
                            <label htmlFor="verify-code" className="block text-sm font-semibold text-blue-700 uppercase tracking-wider">
                                Verification Code
                            </label>
                            <input
                                id="verify-code"
                                type="text"
                                value={verifyCode}
                                onChange={(e) => setVerifyCode(e.target.value.trim())}
                                className="w-full rounded-xl border-2 border-blue-200 px-4 py-3 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all duration-300 bg-white/80 backdrop-blur-sm text-lg text-center font-mono tracking-widest"
                                placeholder="000000"
                                maxLength={6}
                            />
                            <p className="text-sm text-blue-600 text-center">
                                Enter the 6-digit code from your authenticator app
                            </p>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={resetEnrollment}
                                disabled={actionInProgress}
                                className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={verifyFactor}
                                disabled={actionInProgress || verifyCode.length === 0}
                                className="flex justify-center items-center gap-2 py-3 px-6 border-0 rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-600 via-purple-500 to-purple-600 hover:from-violet-700 hover:via-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                            >
                                {actionInProgress ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-4 w-4" />
                                        Verify & Enable
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {step === 'list' && (
                    <div className="space-y-6">
                        <div className="text-center space-y-3">
                            <div className="p-4 bg-blue-50/50 rounded-xl border-2 border-blue-200">
                                <p className="text-sm text-blue-700 leading-relaxed">
                                    {factors.length === 0
                                        ? 'Protect your account with two-factor authentication. When enabled, you\'ll need to enter a code from your authenticator app in addition to your password when signing in.'
                                        : 'You can add additional authentication methods or remove existing ones. We recommend having at least one backup method configured.'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setStep('name')}
                            disabled={actionInProgress}
                            className="w-full flex justify-center items-center gap-3 py-4 px-6 border-0 rounded-xl shadow-lg text-lg font-semibold text-white bg-gradient-to-r from-violet-600 via-purple-500 to-purple-600 hover:from-violet-700 hover:via-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                        >
                            {actionInProgress ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Shield className="h-5 w-5" />
                                    Add New Authentication Method
                                </>
                            )}
                        </button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}