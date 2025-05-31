'use client';

import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import {useState} from "react";
import {createSPASassClient} from "@/lib/supabase/client";
import { useSearchParams } from 'next/navigation';

export default function VerifyEmailPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const resendVerificationEmail = async () => {
        if (!email) {
            setError('Please enter your email address');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const supabase = await createSPASassClient();
            const {error} = await supabase.resendVerificationEmail(email);
            if(error) {
                setError(error.message);
                return;
            }
            setSuccess(true);
        } catch (err: Error | unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred');
            }
        } finally {
            setLoading(false);
        }
    }

    const searchParams = useSearchParams();

    return (
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
                <div className="flex justify-center mb-4">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Check your email
                </h2>

                <p className="text-gray-600 mb-8">
                    We&#39;ve sent you an email with a verification link.
                    Please check your inbox and click the link to verify your account.
                </p>

                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Didn&#39;t receive the email? Check your spam folder or enter your email to resend:
                    </p>

                    {error && (
                        <div className="text-sm text-red-600 bg-gradient-to-br from-red-50 via-red-100 to-pink-50 border border-red-200 rounded-md p-3 shadow-lg">
                            Error: {error}
                        </div>
                    )}

                    {success && (
                        <div className="text-sm text-blue-600 bg-gradient-to-br from-blue-50 via-blue-100 to-violet-50 border border-blue-200 rounded-md p-3 shadow-lg">
                            Verification email has been resent successfully.
                        </div>
                    )}

                    <div className="mt-4">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email address"
                            className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 text-sm"
                        />
                    </div>

                    <button
                        className="text-primary-600 hover:text-primary-500 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={resendVerificationEmail}
                        disabled={loading}
                    >
                        {loading ? 'Sending...' : 'Click here to resend'}
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <Link
                        href="/auth/login"
                        className="text-sm font-medium text-primary-600 hover:text-primary-500"
                    >
                        Return to login
                    </Link>
                </div>
            </div>
        </div>
    );
}