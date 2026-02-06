import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, RefreshCw, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateSessionCode, generateNetworkToken } from '@/lib/codeGenerator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SessionGeneratorProps {
  onSessionCreated: () => void;
}

export function SessionGenerator({ onSessionCreated }: SessionGeneratorProps) {
  const { user } = useAuth();
  const [sessionName, setSessionName] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [networkToken, setNetworkToken] = useState('');
  const [duration, setDuration] = useState(60); // minutes
  const [isCreating, setIsCreating] = useState(false);

  const regenerateSessionCode = () => {
    const code = generateSessionCode();
    setSessionCode(code);
    toast.success('Session code generated');
  };

  const regenerateNetworkToken = () => {
    const token = generateNetworkToken();
    setNetworkToken(token);
    toast.success('Network token generated');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleCreateSession = async () => {
    if (!sessionName.trim()) {
      toast.error('Please enter a session name');
      return;
    }
    if (!sessionCode) {
      toast.error('Please generate a session code');
      return;
    }
    if (!networkToken) {
      toast.error('Please generate a network token');
      return;
    }
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    setIsCreating(true);

    try {
      const expiresAt = new Date(Date.now() + duration * 60 * 1000);
      
      const { error } = await supabase.from('tpo_sessions').insert({
        session_name: sessionName.trim(),
        session_code: sessionCode,
        network_token: networkToken,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      toast.success('Session created successfully!');
      setSessionName('');
      setSessionCode('');
      setNetworkToken('');
      onSessionCreated();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create session');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create New Session
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="session-name">Session Name</Label>
          <Input
            id="session-name"
            placeholder="e.g., Placement Drive - Day 1"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            min={10}
            max={480}
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
          />
        </div>

        <div className="space-y-2">
          <Label>Session Code (8 characters)</Label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={sessionCode}
                readOnly
                placeholder="Click generate"
                className="font-mono text-lg tracking-widest pr-10"
              />
              {sessionCode && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => copyToClipboard(sessionCode, 'Session code')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Button type="button" variant="outline" onClick={regenerateSessionCode}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Network Token (8 characters)</Label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={networkToken}
                readOnly
                placeholder="Click generate"
                className="font-mono text-lg tracking-widest pr-10"
              />
              {networkToken && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => copyToClipboard(networkToken, 'Network token')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Button type="button" variant="outline" onClick={regenerateNetworkToken}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Button
          className="w-full"
          onClick={handleCreateSession}
          disabled={isCreating || !sessionName || !sessionCode || !networkToken}
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Create Session
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
