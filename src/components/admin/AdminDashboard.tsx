import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, Cpu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { SessionGenerator } from './SessionGenerator';
import { SessionList } from './SessionList';

export function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSessionCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary via-primary to-accent py-3 sm:py-4 px-3 sm:px-4 border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 bg-primary-foreground/10 rounded-lg flex-shrink-0">
              <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-primary-foreground truncate">TPO Admin Portal</h1>
              <p className="text-xs text-primary-foreground/70 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={signOut}
            className="gap-1 sm:gap-2 flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* Stats Banner */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Secure Session Management</h2>
              <p className="text-sm text-muted-foreground">
                Create sessions with unique 8-character codes • Export attendance to Excel
              </p>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-1">
            <SessionGenerator onSessionCreated={handleSessionCreated} />
          </div>
          <div className="lg:col-span-2">
            <SessionList refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </main>
    </div>
  );
}
