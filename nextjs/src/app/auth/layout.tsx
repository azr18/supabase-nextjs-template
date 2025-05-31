import Link from 'next/link';
import { ArrowLeft, Cpu, Zap, Shield } from 'lucide-react';

export default function AuthLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    const productName = process.env.NEXT_PUBLIC_PRODUCTNAME;
    const processSteps = [
        {
            icon: Cpu,
            title: "AI-Powered Automation",
            description: "Intelligent document processing and reconciliation tailored to your business needs",
            gradient: "from-blue-500 via-violet-500 to-violet-600"
        },
        {
            icon: Zap,
            title: "Lightning Fast Results",
            description: "Automated workflows that save hours of manual processing time every month",
            gradient: "from-violet-500 via-violet-600 to-purple-600"
        },
        {
            icon: Shield,
            title: "Enterprise Security",
            description: "Bank-level security with user isolation and encrypted data storage",
            gradient: "from-violet-600 via-purple-500 to-purple-600"
        }
    ];

    return (
        <div className="flex min-h-screen">
            <div className="w-full lg:w-1/2 flex flex-col py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-blue-50 to-violet-50 relative">
                <Link
                    href="/"
                    className="absolute left-8 top-8 flex items-center text-sm text-gray-600 hover:text-blue-700 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:transform group-hover:-translate-x-1 transition-transform" />
                    Back to Homepage
                </Link>

                <div className="mt-16 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-blue-600 to-violet-600 bg-clip-text text-transparent mb-4 leading-normal">
                            {productName || 'My Agent'}
                        </h1>
                        <p className="text-gray-600 text-lg">
                            AI Business Automation Platform
                        </p>
                    </div>
                </div>

                <div className="flex-1 flex items-start justify-center">
                    <div className="w-full sm:mx-auto sm:w-full sm:max-w-md">
                        {children}
                    </div>
                </div>
            </div>

            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-800 via-blue-500 to-blue-600">
                <div className="w-full flex flex-col py-8 px-6">
                    <div className="mt-16 mb-8 text-center">
                        <h2 className="text-4xl font-bold mb-4 text-white">
                            Automate Your Business
                        </h2>
                        <p className="text-blue-100 text-lg leading-relaxed">
                            Join businesses transforming their operations with custom AI solutions
                        </p>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-start">
                        <div className="w-full max-w-lg mx-auto space-y-4">
                            {processSteps.map((step, index) => (
                                <div
                                    key={index}
                                    className="relative bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300"
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0">
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${step.gradient} flex items-center justify-center shadow-lg`}>
                                                <step.icon className="w-5 h-5 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-semibold text-white mb-1">
                                                {step.title}
                                            </h3>
                                            <p className="text-sm text-blue-100 leading-relaxed">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-violet-400 flex items-center justify-center text-white font-semibold text-xs">
                                            {index + 1}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            <div className="mt-6 text-center">
                                <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    <p className="text-blue-100 text-sm font-medium">
                                        Trusted by businesses worldwide
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}