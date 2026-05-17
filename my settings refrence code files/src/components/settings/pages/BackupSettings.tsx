import React from 'react';
import { cn } from '../../../utils/cn';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../BaseComponents';
import { Input, Select, Toggle, Button, SectionDivider, Badge, Alert } from '../BaseComponents';
import { useSettings, useUpdateSettings } from '../../../store/settingsStore';
import { 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  Shield, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Trash2,
  FileArchive,
  Calendar
} from 'lucide-react';
import { DangerDialogWithInput } from '../ConfirmationDialog';
import { BackupInfo } from '../../../types/settings';

export const BackupSettings: React.FC = () => {
  const settings = useSettings();
  const updateSettings = useUpdateSettings();
  
  const [showRestoreDialog, setShowRestoreDialog] = React.useState(false);
  const [showResetDialog, setShowResetDialog] = React.useState(false);
  const [lastAction, setLastAction] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Initialize backup history if empty
  React.useEffect(() => {
    if (settings.backup.backupHistory.length === 0) {
      const mockBackups: BackupInfo[] = [
        {
          id: '1',
          name: 'Auto Backup',
          path: '/backups/backup-2024-12-20.sql',
          size: '2.4 MB',
          date: new Date(Date.now() - 86400000).toISOString(),
          type: 'auto',
          encrypted: true,
        },
        {
          id: '2',
          name: 'Manual Backup',
          path: '/backups/manual-backup-2024-12-19.sql',
          size: '2.3 MB',
          date: new Date(Date.now() - 172800000).toISOString(),
          type: 'manual',
          encrypted: true,
        },
        {
          id: '3',
          name: 'Auto Backup',
          path: '/backups/backup-2024-12-18.sql',
          size: '2.2 MB',
          date: new Date(Date.now() - 259200000).toISOString(),
          type: 'auto',
          encrypted: true,
        },
      ];
      updateSettings('backup', { backupHistory: mockBackups });
    }
  }, []);

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  const handleBackup = async () => {
    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newBackup: BackupInfo = {
        id: Date.now().toString(),
        name: 'Manual Backup',
        path: `/backups/manual-backup-${new Date().toISOString().split('T')[0]}.sql`,
        size: '2.5 MB',
        date: new Date().toISOString(),
        type: 'manual',
        encrypted: settings.backup.encryptBackups,
      };
      
      updateSettings('backup', {
        lastBackupDate: new Date().toISOString(),
        backupHistory: [newBackup, ...settings.backup.backupHistory].slice(0, 50),
      });
      
      setLastAction({
        type: 'success',
        message: 'Backup completed successfully at ' + new Date().toLocaleTimeString(),
      });
    } catch (error) {
      setLastAction({
        type: 'error',
        message: 'Backup failed. Please try again.',
      });
    }
  };

  const handleDeleteBackup = async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      updateSettings('backup', {
        backupHistory: settings.backup.backupHistory.filter(b => b.id !== id),
      });
      
      setLastAction({
        type: 'success',
        message: 'Backup deleted successfully',
      });
    } catch (error) {
      setLastAction({
        type: 'error',
        message: 'Failed to delete backup',
      });
    }
  };

  const handleRestoreBackup = async (backup: BackupInfo) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setLastAction({
        type: 'success',
        message: `Restored from ${backup.name} successfully`,
      });
    } catch (error) {
      setLastAction({
        type: 'error',
        message: 'Restore failed. Please try again.',
      });
    }
  };

  const formatBackupDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-GB');
    }
  };

  const handleExport = async () => {
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a dummy export file
      const data = JSON.stringify({
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        data: 'Exported database content...',
      }, null, 2);
      
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `billing-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      setLastAction({
        type: 'success',
        message: 'Database exported successfully',
      });
    } catch (error) {
      setLastAction({
        type: 'error',
        message: 'Export failed. Please try again.',
      });
    }
  };

  const handleImport = async () => {
    try {
      // Simulate import process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLastAction({
        type: 'success',
        message: 'Database imported successfully',
      });
    } catch (error) {
      setLastAction({
        type: 'error',
        message: 'Import failed. Please try again.',
      });
    }
  };

  const handleRestore = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setLastAction({
        type: 'success',
        message: 'Database restored successfully',
      });
    } catch (error) {
      setLastAction({
        type: 'error',
        message: 'Restore failed. Please try again.',
      });
    }
  };

  const handleResetDatabase = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setLastAction({
        type: 'success',
        message: 'Database has been reset to default state',
      });
    } catch (error) {
      setLastAction({
        type: 'error',
        message: 'Reset failed. Please try again.',
      });
    }
  };

  const getDatabaseHealthStatus = () => {
    // Simulate health check
    return {
      status: 'healthy',
      size: '2.4 MB',
      lastCheck: new Date().toLocaleString(),
      tables: 15,
      records: 1247,
    };
  };

  const health = getDatabaseHealthStatus();

  return (
    <div className="space-y-6">
      {/* Auto Backup Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Automatic Backups</CardTitle>
          <CardDescription>
            Configure automatic backup schedule to protect your data.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Toggle
            checked={settings.backup.autoBackupEnabled}
            onCheckedChange={(checked) => updateSettings('backup', { autoBackupEnabled: checked })}
            label="Enable Automatic Backups"
            description="Automatically backup your data at scheduled intervals"
          />

          <Select
            label="Backup Frequency"
            value={settings.backup.backupFrequency}
            onChange={(e) => updateSettings('backup', { backupFrequency: e.target.value as any })}
            options={frequencyOptions}
            disabled={!settings.backup.autoBackupEnabled}
          />

          <Input
            label="Backup Location"
            placeholder="/path/to/backups"
            value={settings.backup.backupLocation}
            onChange={(e) => updateSettings('backup', { backupLocation: e.target.value })}
            description="Directory where backups will be stored"
            disabled={!settings.backup.autoBackupEnabled}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Retention Period (days)"
              type="number"
              min={1}
              max={365}
              value={settings.backup.backupRetentionDays}
              onChange={(e) => updateSettings('backup', { backupRetentionDays: parseInt(e.target.value) || 30 })}
              description="How long to keep old backups"
              disabled={!settings.backup.autoBackupEnabled}
            />
          </div>

          <Toggle
            checked={settings.backup.encryptBackups}
            onCheckedChange={(checked) => updateSettings('backup', { encryptBackups: checked })}
            label="Encrypt Backups"
            description="Encrypt backup files for additional security"
          />

          <Toggle
            checked={settings.backup.cloudBackupEnabled}
            onCheckedChange={(checked) => updateSettings('backup', { cloudBackupEnabled: checked })}
            label="Cloud Backup"
            description="Store backups in the cloud (coming soon)"
          />

          {settings.backup.lastBackupDate && (
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
              <Clock className="w-5 h-5 text-zinc-400" />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                  Last Backup
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {new Date(settings.backup.lastBackupDate).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button onClick={handleBackup}>
            <RotateCcw className="w-4 h-4" />
            Create Manual Backup
          </Button>
        </CardFooter>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>
            View and manage your backup files.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {settings.backup.backupHistory.length === 0 ? (
            <div className="text-center py-8">
              <FileArchive className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No backups found. Create your first backup.
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={handleBackup}>
                <RotateCcw className="w-4 h-4" />
                Create Backup
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {settings.backup.backupHistory.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      backup.type === 'auto' 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : backup.type === 'manual'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                    )}>
                      <FileArchive className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                          {backup.name}
                        </p>
                        {backup.encrypted && (
                          <Shield className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatBackupDate(backup.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          {backup.size}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestoreBackup(backup)}
                      title="Restore"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBackup(backup.id)}
                      title="Delete"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Management */}
      <Card>
        <CardHeader>
          <CardTitle>Database Management</CardTitle>
          <CardDescription>
            Export, import, and manage your billing database.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" onClick={handleExport} className="justify-start">
              <Download className="w-4 h-4" />
              Export Database
            </Button>
            
            <Button variant="outline" onClick={handleImport} className="justify-start">
              <Upload className="w-4 h-4" />
              Import Database
            </Button>
          </div>

          <SectionDivider />

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  Restore from Backup
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Restoring from a backup will overwrite your current data. Make sure to create a backup first.
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => setShowRestoreDialog(true)}
            >
              <RotateCcw className="w-4 h-4" />
              Restore from Backup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Database Health */}
      <Card>
        <CardHeader>
          <CardTitle>Database Health</CardTitle>
          <CardDescription>
            Monitor the status and performance of your database.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-zinc-400" />
                <span className="text-xs text-zinc-500">Status</span>
              </div>
              <Badge variant="success" className="w-fit">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Healthy
              </Badge>
            </div>

            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-4 h-4 text-zinc-400" />
                <span className="text-xs text-zinc-500">Size</span>
              </div>
              <p className="text-lg font-semibold text-zinc-900 dark:text-white">{health.size}</p>
            </div>

            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-zinc-400" />
                <span className="text-xs text-zinc-500">Tables</span>
              </div>
              <p className="text-lg font-semibold text-zinc-900 dark:text-white">{health.tables}</p>
            </div>

            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-zinc-400" />
                <span className="text-xs text-zinc-500">Records</span>
              </div>
              <p className="text-lg font-semibold text-zinc-900 dark:text-white">{health.records.toLocaleString()}</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-medium">Last Health Check:</span>{' '}
              {health.lastCheck}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that affect your entire database.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-200">
                  Reset Database
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  This will delete ALL data and reset the database to its default state. 
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <Button 
              variant="danger" 
              size="sm" 
              className="mt-3"
              onClick={() => setShowResetDialog(true)}
            >
              Reset Database
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Feedback */}
      {lastAction && (
        <Alert 
          variant={lastAction.type === 'success' ? 'success' : 'error'}
          icon={
            lastAction.type === 'success' 
              ? <CheckCircle2 className="w-5 h-5 text-green-500" />
              : <AlertCircle className="w-5 h-5 text-red-500" />
          }
        >
          {lastAction.message}
        </Alert>
      )}

      {/* Restore Dialog */}
      <DangerDialogWithInput
        isOpen={showRestoreDialog}
        onClose={() => setShowRestoreDialog(false)}
        onConfirm={handleRestore}
        actionName="RESTORE"
      />

      {/* Reset Dialog */}
      <DangerDialogWithInput
        isOpen={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onConfirm={handleResetDatabase}
        actionName="RESET"
      />
    </div>
  );
};
