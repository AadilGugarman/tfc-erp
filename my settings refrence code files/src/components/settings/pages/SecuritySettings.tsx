import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../BaseComponents';
import { Input, Select, Toggle, Button, Badge, Alert } from '../BaseComponents';
import { useSettings, useUpdateSettings } from '../../../store/settingsStore';
import { 
  Key,
  Fingerprint,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { ConfirmationDialog } from '../ConfirmationDialog';

export const SecuritySettings: React.FC = () => {
  const settings = useSettings();
  const updateSettings = useUpdateSettings();
  
  const [showPasswordDialog, setShowPasswordDialog] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPasswordInput, setShowPasswordInput] = React.useState(false);
  const [lastAction, setLastAction] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const timeoutOptions = [
    { value: '5', label: '5 minutes' },
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '60', label: '1 hour' },
    { value: '120', label: '2 hours' },
    { value: '480', label: '8 hours' },
    { value: '1440', label: '24 hours' },
  ];

  const sessionTimeoutOptions = [
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '60', label: '1 hour' },
    { value: '120', label: '2 hours' },
    { value: '480', label: '8 hours' },
    { value: '1440', label: '24 hours' },
    { value: '10080', label: '7 days' },
  ];

  const handlePasswordChange = async () => {
    if (password.length < 8) {
      setLastAction({
        type: 'error',
        message: 'Password must be at least 8 characters long',
      });
      return;
    }

    if (password !== confirmPassword) {
      setLastAction({
        type: 'error',
        message: 'Passwords do not match',
      });
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLastAction({
        type: 'success',
        message: 'Password changed successfully',
      });
      
      setPassword('');
      setConfirmPassword('');
      setShowPasswordDialog(false);
    } catch (error) {
      setLastAction({
        type: 'error',
        message: 'Failed to change password',
      });
    }
  };

  const handleEnable2FA = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateSettings('security', { twoFactorEnabled: true });
      
      setLastAction({
        type: 'success',
        message: 'Two-factor authentication enabled successfully',
      });
    } catch (error) {
      setLastAction({
        type: 'error',
        message: 'Failed to enable 2FA',
      });
    }
  };

  const handleDisable2FA = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateSettings('security', { twoFactorEnabled: false });
      
      setLastAction({
        type: 'success',
        message: 'Two-factor authentication disabled',
      });
    } catch (error) {
      setLastAction({
        type: 'error',
        message: 'Failed to disable 2FA',
      });
    }
  };

  const getSecurityScore = () => {
    let score = 0;
    
    if (settings.security.requirePassword) score += 20;
    if (settings.security.passwordTimeoutMinutes <= 15) score += 15;
    if (settings.security.twoFactorEnabled) score += 30;
    if (settings.security.dataEncryptionEnabled) score += 20;
    if (settings.security.auditLogEnabled) score += 15;
    
    return score;
  };

  const securityScore = getSecurityScore();
  const securityLevel = securityScore >= 80 ? 'Excellent' : securityScore >= 60 ? 'Good' : securityScore >= 40 ? 'Fair' : 'Poor';

  return (
    <div className="space-y-6">
      {/* Security Score */}
      <Card>
        <CardHeader>
          <CardTitle>Security Status</CardTitle>
          <CardDescription>
            Your overall security posture and recommendations.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-zinc-200 dark:text-zinc-800"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * securityScore) / 100}
                  className={cn(
                    'transition-all duration-500',
                    securityScore >= 80 ? 'text-green-500' : securityScore >= 60 ? 'text-blue-500' : securityScore >= 40 ? 'text-yellow-500' : 'text-red-500'
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {securityScore}%
                </span>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  variant={securityScore >= 80 ? 'success' : securityScore >= 60 ? 'info' : securityScore >= 40 ? 'warning' : 'error'}
                >
                  {securityLevel} Security
                </Badge>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {securityScore >= 80 
                  ? 'Your security settings are excellent. Keep them up!'
                  : securityScore >= 60
                  ? 'Good security practices. Consider enabling 2FA for better protection.'
                  : securityScore >= 40
                  ? 'Some security measures are in place. Enable more for better protection.'
                  : 'Your security settings need improvement. Enable password protection and 2FA.'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-900 dark:text-white">Security Checklist</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {settings.security.requirePassword ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-700" />
                )}
                <span className={cn(
                  'text-sm',
                  settings.security.requirePassword ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'
                )}>
                  Password protection enabled
                </span>
              </div>
              <div className="flex items-center gap-3">
                {settings.security.twoFactorEnabled ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-700" />
                )}
                <span className={cn(
                  'text-sm',
                  settings.security.twoFactorEnabled ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'
                )}>
                  Two-factor authentication enabled
                </span>
              </div>
              <div className="flex items-center gap-3">
                {settings.security.dataEncryptionEnabled ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-700" />
                )}
                <span className={cn(
                  'text-sm',
                  settings.security.dataEncryptionEnabled ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'
                )}>
                  Data encryption enabled
                </span>
              </div>
              <div className="flex items-center gap-3">
                {settings.security.auditLogEnabled ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-700" />
                )}
                <span className={cn(
                  'text-sm',
                  settings.security.auditLogEnabled ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'
                )}>
                  Audit logging enabled
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Password Protection</CardTitle>
          <CardDescription>
            Secure your billing application with password protection.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Toggle
            checked={settings.security.requirePassword}
            onCheckedChange={(checked) => updateSettings('security', { requirePassword: checked })}
            label="Require Password"
            description="Require a password to access the application"
          />

          <Select
            label="Lock Timeout"
            value={settings.security.passwordTimeoutMinutes.toString()}
            onChange={(e) => updateSettings('security', { passwordTimeoutMinutes: parseInt(e.target.value) })}
            options={timeoutOptions}
            description="Time of inactivity before requiring password"
            disabled={!settings.security.requirePassword}
          />

          <Button 
            variant="outline"
            onClick={() => setShowPasswordDialog(true)}
            disabled={!settings.security.requirePassword}
          >
            <Key className="w-4 h-4" />
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-start gap-3">
              <Fingerprint className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                  {settings.security.twoFactorEnabled ? '2FA is enabled' : '2FA is disabled'}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {settings.security.twoFactorEnabled 
                    ? 'You will need to enter a verification code when logging in.'
                    : 'Enable 2FA for an additional layer of security.'}
                </p>
              </div>
              <Toggle
                checked={settings.security.twoFactorEnabled}
                onCheckedChange={(checked) => {
                  if (checked) {
                    handleEnable2FA();
                  } else {
                    handleDisable2FA();
                  }
                }}
              />
            </div>
          </div>

          {settings.security.twoFactorEnabled && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-200">
                    Backup Codes
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Store these backup codes in a safe place. You can use them if you lose access to your authenticator app.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    View Backup Codes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
          <CardDescription>
            Control how long your sessions remain active.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Select
            label="Session Timeout"
            value={settings.security.sessionTimeoutMinutes.toString()}
            onChange={(e) => updateSettings('security', { sessionTimeoutMinutes: parseInt(e.target.value) })}
            options={sessionTimeoutOptions}
            description="Automatically log out after period of inactivity"
          />

          <Toggle
            checked={settings.security.auditLogEnabled}
            onCheckedChange={(checked) => updateSettings('security', { auditLogEnabled: checked })}
            label="Enable Audit Logging"
            description="Track all user actions and system events"
          />
        </CardContent>
      </Card>

      {/* Data Security */}
      <Card>
        <CardHeader>
          <CardTitle>Data Security</CardTitle>
          <CardDescription>
            Protect your sensitive business data.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Toggle
            checked={settings.security.dataEncryptionEnabled}
            onCheckedChange={(checked) => updateSettings('security', { dataEncryptionEnabled: checked })}
            label="Data Encryption"
            description="Encrypt sensitive data at rest"
          />

          <Toggle
            checked={settings.security.allowExport}
            onCheckedChange={(checked) => updateSettings('security', { allowExport: checked })}
            label="Allow Data Export"
            description="Permit exporting data from the application"
          />

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  Security Best Practices
                </p>
                <ul className="text-xs text-amber-700 dark:text-amber-300 mt-2 space-y-1">
                  <li>• Use a strong, unique password</li>
                  <li>• Enable two-factor authentication</li>
                  <li>• Regularly update your password</li>
                  <li>• Keep your software up to date</li>
                </ul>
              </div>
            </div>
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
              : <AlertTriangle className="w-5 h-5 text-red-500" />
          }
        >
          {lastAction.message}
        </Alert>
      )}

      {/* Password Change Dialog */}
      <ConfirmationDialog
        isOpen={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        onConfirm={handlePasswordChange}
        title="Change Password"
        description={
          <div className="space-y-4 mt-4">
            <Input
              label="New Password"
              type={showPasswordInput ? 'text' : 'password'}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="relative"
            />
            <Input
              label="Confirm Password"
              type={showPasswordInput ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="relative"
            />
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Toggle
                checked={showPasswordInput}
                onCheckedChange={setShowPasswordInput}
                label="Show Password"
              />
            </div>
          </div>
        }
        confirmLabel="Change Password"
        variant="info"
      />
    </div>
  );
};

// Helper function for className merging
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
