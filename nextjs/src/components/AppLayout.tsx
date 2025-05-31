"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import {
    Home,
    User,
    Menu,
    X,
    ChevronDown,
    LogOut,
    Key,
} from 'lucide-react';
import { useGlobal } from "@/lib/context/GlobalContext";
import { createSPASassClient } from "@/lib/supabase/client";
import { ErrorBoundary } from './ErrorBoundary';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isUserDropdownOpen, setUserDropdownOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();


    const { user } = useGlobal();

    const handleLogout = async () => {
        try {
            const client = await createSPASassClient();
            await client.logout();
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const getInitials = (email: string) => {
        const parts = email.split('@')[0].split(/[._-]/);
        return parts.length > 1
            ? (parts[0][0] + parts[1][0]).toUpperCase()
            : parts[0].slice(0, 2).toUpperCase();
    };

    const productName = process.env.NEXT_PUBLIC_PRODUCTNAME;

    const navigation = [
        { name: 'Dashboard', href: '/app', icon: Home },
        { name: 'User Settings', href: '/app/user-settings', icon: User },
    ];

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-violet-50">
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm z-20 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 w-64 bg-white/95 backdrop-blur-md shadow-xl border-r border-blue-100 transform transition-transform duration-300 ease-in-out z-30 
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

                <div className="h-16 flex items-center justify-between px-4 border-b border-blue-100 bg-gradient-to-r from-gray-800 via-blue-500 to-blue-600">
                    <Link href="/" className="flex items-center">
                        <span className="text-xl font-bold text-white hover:text-blue-100 transition-colors duration-300">
                            {productName || 'My Agent'}
                        </span>
                    </Link>
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden text-blue-100 hover:text-white transition-colors duration-200"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="mt-6 px-3 space-y-2">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || 
                                       (item.href === '/app/user-settings' && pathname.startsWith('/app/user-settings'));
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 hover:scale-105 ${
                                    isActive
                                        ? 'bg-gradient-to-r from-blue-500 via-violet-500 to-violet-600 text-white shadow-lg'
                                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:via-violet-50 hover:to-violet-100 hover:text-blue-700 hover:shadow-md'
                                }`}
                            >
                                <item.icon
                                    className={`mr-3 h-5 w-5 transition-all duration-300 ${
                                        isActive ? 'text-blue-100' : 'text-gray-500 group-hover:text-blue-600'
                                    }`}
                                />
                                {item.name}
                                {isActive && (
                                    <span className="absolute right-0 w-1 h-8 bg-gradient-to-b from-blue-300 to-violet-300 rounded-l-full"></span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

            </div>

            <div className="lg:pl-64">
                <div className="sticky top-0 z-10 flex items-center justify-between h-16 bg-white/95 backdrop-blur-md shadow-sm border-b border-blue-100 px-4">
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden text-gray-600 hover:text-blue-600 transition-colors duration-200"
                    >
                        <Menu className="h-6 w-6"/>
                    </button>

                    <div className="relative ml-auto">
                        <button
                            onClick={() => setUserDropdownOpen(!isUserDropdownOpen)}
                            className="flex items-center space-x-3 text-sm text-gray-700 hover:text-blue-700 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-blue-50"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-violet-600 flex items-center justify-center shadow-md">
                                <span className="text-white font-medium text-sm">
                                    {user ? getInitials(user.email) : '??'}
                                </span>
                            </div>
                            <span className="font-medium">{user?.email || 'Loading...'}</span>
                            <ChevronDown className="h-4 w-4"/>
                        </button>

                        {isUserDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-blue-100 overflow-hidden">
                                <div className="p-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 via-violet-50 to-violet-100">
                                    <p className="text-xs text-gray-600 font-medium">Signed in as</p>
                                    <p className="text-sm font-semibold text-gray-800 truncate mt-1">
                                        {user?.email}
                                    </p>
                                </div>
                                <div className="py-2">
                                    <button
                                        onClick={() => {
                                            setUserDropdownOpen(false);
                                            router.push('/app/user-settings');
                                        }}
                                        className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:via-violet-50 hover:to-violet-100 hover:text-blue-700 transition-all duration-200"
                                    >
                                        <User className="mr-3 h-4 w-4 text-gray-500"/>
                                        Account Settings
                                    </button>
                                    <button
                                        onClick={() => {
                                            setUserDropdownOpen(false);
                                            router.push('/app/user-settings#password');
                                        }}
                                        className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:via-violet-50 hover:to-violet-100 hover:text-blue-700 transition-all duration-200"
                                    >
                                        <Key className="mr-3 h-4 w-4 text-gray-500"/>
                                        Change Password
                                    </button>
                                    <button
                                        onClick={() => {
                                            setUserDropdownOpen(false);
                                            router.push('/app/user-settings#mfa');
                                        }}
                                        className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:via-violet-50 hover:to-violet-100 hover:text-blue-700 transition-all duration-200"
                                    >
                                        <Key className="mr-3 h-4 w-4 text-gray-500"/>
                                        Security (MFA)
                                    </button>
                                    <div className="border-t border-blue-100 my-2"></div>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setUserDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                                    >
                                        <LogOut className="mr-3 h-4 w-4 text-red-500"/>
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <main className="p-6">
                    <ErrorBoundary>
                        {children}
                    </ErrorBoundary>
                </main>
            </div>
        </div>
    );
}