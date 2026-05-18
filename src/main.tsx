import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n/config";
import { initializeCursorControl } from "./utils/cursorControl";
import App from "./App";
import { initializeBackendStorage } from "./db/db";
import {
  createStartupBackup,
  runAutoBackupIfDue,
  saveClientStateForBackups,
} from "./services/backup";

async function bootstrap() {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("Root element not found");
    return;
  }

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

  // Initialize cursor control immediately.
  initializeCursorControl();

  // Initialize backend storage in the background so the UI can render sooner.
  void initializeBackendStorage().catch((error) => {
    console.error("Failed to initialize backend storage:", error);
  });

  const scheduleBackupWork = () => {
    void (async () => {
      try {
        await saveClientStateForBackups();
        await createStartupBackup();
        window.setInterval(() => {
          void runAutoBackupIfDue();
        }, 60_000);
      } catch (error) {
        console.warn("[Backup] Startup backup failed:", error);
      }
    })();
  };

  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    (
      window as unknown as {
        requestIdleCallback: (
          cb: () => void,
          opts?: { timeout: number },
        ) => number;
      }
    ).requestIdleCallback(scheduleBackupWork, { timeout: 2000 });
  } else {
    window.setTimeout(scheduleBackupWork, 1000);
  }
}

void bootstrap();
