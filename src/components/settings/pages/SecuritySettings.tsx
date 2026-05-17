import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../BaseComponents";
import { Select, Toggle } from "../BaseComponents";
import { useAppStore } from "@/stores/useAppStore";

export const SecuritySettings: React.FC = () => {
  const { settings, updateSettings } = useAppStore();

  const handleUpdate = (updates: Partial<typeof settings.security>) => {
    updateSettings({
      security: {
        ...settings.security,
        ...updates,
      },
    });
  };

  const timeoutOptions = [
    { value: "5", label: "5 minutes" },
    { value: "15", label: "15 minutes" },
    { value: "30", label: "30 minutes" },
    { value: "60", label: "1 hour" },
    { value: "120", label: "2 hours" },
  ];

  const sessionTimeoutOptions = [
    { value: "15", label: "15 minutes" },
    { value: "30", label: "30 minutes" },
    { value: "60", label: "1 hour" },
    { value: "120", label: "2 hours" },
    { value: "480", label: "8 hours" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Access Control</CardTitle>
          <CardDescription>
            Secure your workspace with password and session settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Toggle
            checked={settings.security.requirePassword}
            onCheckedChange={(checked) =>
              handleUpdate({ requirePassword: checked })
            }
            label="Require Password"
            description="Ask for a password when opening the application"
          />
          <Select
            label="Auto-lock Timeout"
            value={settings.security.passwordTimeoutMinutes.toString()}
            onChange={(e) =>
              handleUpdate({
                passwordTimeoutMinutes: parseInt(e.target.value, 10) || 15,
              })
            }
            options={timeoutOptions}
            disabled={!settings.security.requirePassword}
          />
          <Select
            label="Session Timeout"
            value={settings.security.sessionTimeoutMinutes.toString()}
            onChange={(e) =>
              handleUpdate({
                sessionTimeoutMinutes: parseInt(e.target.value, 10) || 60,
              })
            }
            options={sessionTimeoutOptions}
          />
          <Toggle
            checked={settings.security.twoFactorEnabled}
            onCheckedChange={(checked) =>
              handleUpdate({ twoFactorEnabled: checked })
            }
            label="Two-Factor Authentication"
            description="Add an extra verification step at login"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Security</CardTitle>
          <CardDescription>
            Control exports, encryption, and audit logging.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Toggle
            checked={settings.security.allowExport}
            onCheckedChange={(checked) => handleUpdate({ allowExport: checked })}
            label="Allow Data Export"
          />
          <Toggle
            checked={settings.security.auditLogEnabled}
            onCheckedChange={(checked) =>
              handleUpdate({ auditLogEnabled: checked })
            }
            label="Enable Audit Log"
            description="Track changes across the database"
          />
          <Toggle
            checked={settings.security.dataEncryptionEnabled}
            onCheckedChange={(checked) =>
              handleUpdate({ dataEncryptionEnabled: checked })
            }
            label="Database Encryption"
          />
        </CardContent>
      </Card>
    </div>
  );
};
