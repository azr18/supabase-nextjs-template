"use client";
import { useState, useEffect } from 'react';
import { createSPASassClient } from '@/lib/supabase/client';
import { ArrowRight, ChevronRight } from 'lucide-react';
import Link from "next/link";

export default function AuthAwareButtons({ variant = 'primary' }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const supabase = await createSPASassClient();
                const { data: { user } } = await supabase.getSupabaseClient().auth.getUser();
                setIsAuthenticated(!!user);
            } catch (error) {
                console.error('Error checking auth status:', error);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Show loading skeleton that matches the expected button layout
    if (loading) {
        if (variant === 'nav') {
            return (
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
            );
        }
        return (
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-40 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="w-32 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
        );
    }

    // Navigation buttons for the header
    if (variant === 'nav') {
        return isAuthenticated ? (
            <Link
                href="/app"
                className="bg-gradient-to-r from-gray-800 via-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium"
            >
                Go to Dashboard
            </Link>
        ) : (
            <div className="flex items-center space-x-4">
                <Link 
                    href="/auth/login" 
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
                >
                    Login
                </Link>
                <Link
                    href="/auth/register"
                    className="bg-gradient-to-r from-gray-800 via-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium"
                >
                    Get Started
                </Link>
            </div>
        );
    }

    // Primary buttons for the hero section
    return isAuthenticated ? (
        <Link
            href="/app"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-gray-800 via-blue-500 to-blue-600 text-white font-medium hover:shadow-xl hover:scale-105 transition-all duration-300"
        >
            Go to Dashboard
            <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
    ) : (
        <>
            <Link
                href="/auth/register"
                className="inline-flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-gray-800 via-blue-500 to-blue-600 text-white font-medium hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
                Start Building Free
                <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
                href="#features"
                className="inline-flex items-center px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 hover:border-blue-300 transition-all duration-300"
            >
                Learn More
                <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
        </>
    );
}