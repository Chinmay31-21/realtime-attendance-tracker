import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Download, 
  Users, 
  Clock, 
  Eye, 
  EyeOff, 
  Trash2,
  Loader2,
  Copy,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { exportToExcel } from '@/lib/excelExport';
import type { Database } from '@/integrations/supabase/types';

type Session = Database['public']['Tables']['tpo_sessions']['Row'];
type AttendanceRecord = Database['public']['Tables']['attendance_records']['Row'];

interface SessionListProps {
  refreshTrigger: number;
}

export function SessionList({ refreshTrigger }: SessionListProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendanceCounts, setAttendanceCounts] = useState<Record<string, number>>({});
  const [showCodes, setShowCodes] = useState<Record<string, boolean>>({});
  const [exporting, setExporting] = useState<string | null>(null);

  const fetchSessions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('tpo_sessions')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);

      // Fetch attendance counts for each session
      const counts: Record<string, number> = {};
      for (const session of data || []) {
        const { count } = await supabase
          .from('attendance_records')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.id);
        counts[session.id] = count || 0;
      }
      setAttendanceCounts(counts);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user, refreshTrigger]);

  const toggleSessionActive = async (session: Session) => {
    try {
      const { error } = await supabase
        .from('tpo_sessions')
        .update({ is_active: !session.is_active })
        .eq('id', session.id);

      if (error) throw error;
      
      toast.success(session.is_active ? 'Session deactivated' : 'Session activated');
      fetchSessions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update session');
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure? This will delete all attendance records for this session.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tpo_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      
      toast.success('Session deleted');
      fetchSessions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete session');
    }
  };

  const handleExport = async (session: Session) => {
    setExporting(session.id);
    
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('session_id', session.id)
        .order('recorded_at', { ascending: true });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast.error('No attendance records to export');
        return;
      }

      exportToExcel(data, session.session_name);
      toast.success('Excel file downloaded');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export');
    } finally {
      setExporting(null);
    }
  };

  const copyCode = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`${label} copied`);
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Sessions ({sessions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No sessions created yet. Create your first session above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Codes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      {session.session_name}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                            {showCodes[session.id] ? session.session_code : '••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyCode(session.session_code, 'Session code')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-1">
                          <code className="text-xs bg-accent/20 px-1.5 py-0.5 rounded font-mono">
                            {showCodes[session.id] ? session.network_token : '••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyCode(session.network_token, 'Network token')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => setShowCodes(prev => ({ ...prev, [session.id]: !prev[session.id] }))}
                        >
                          {showCodes[session.id] ? (
                            <><EyeOff className="w-3 h-3 mr-1" /> Hide</>
                          ) : (
                            <><Eye className="w-3 h-3 mr-1" /> Show</>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isExpired(session.expires_at) ? (
                        <Badge variant="secondary">Expired</Badge>
                      ) : session.is_active ? (
                        <Badge className="bg-success text-success-foreground">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{attendanceCounts[session.id] || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {new Date(session.expires_at).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExport(session)}
                          disabled={exporting === session.id}
                        >
                          {exporting === session.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleSessionActive(session)}
                        >
                          {session.is_active ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteSession(session.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
