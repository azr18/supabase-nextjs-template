'use client';

import { useEffect, useState } from 'react';

export default function ClientEnvDebug() {
    const [envVars, setEnvVars] = useState<{
        supabaseUrl: string;
        supabaseAnonKey: string;
        nodeEnv: string | undefined;
        timestamp: string;
    } | null>(null);

    useEffect(() => {
        setEnvVars({
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'undefined',
            supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'defined' : 'undefined',
            nodeEnv: process.env.NODE_ENV,
            timestamp: new Date().toISOString()
        });
    }, []);

    if (!envVars) return <div>Loading env debug...</div>;

    return (
        <div style={{ 
            position: 'fixed', 
            top: '10px', 
            right: '10px', 
            background: 'white', 
            border: '1px solid #ccc', 
            padding: '10px', 
            fontSize: '12px',
            zIndex: 9999 
        }}>
            <strong>Client Env Debug:</strong>
            <pre>{JSON.stringify(envVars, null, 2)}</pre>
        </div>
    );
} 