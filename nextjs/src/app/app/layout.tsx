// src/app/app/layout.tsx
import AppLayout from '@/components/AppLayout';
import { GlobalProvider } from '@/lib/context/GlobalContext';
import { Toaster } from '@/components/ui/toaster';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <GlobalProvider>
            <AppLayout>{children}</AppLayout>
            <Toaster />
        </GlobalProvider>
    );
}