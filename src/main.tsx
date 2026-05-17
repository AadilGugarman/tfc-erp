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
  try {
    await initializeBackendStorage();
  } catch (error) {
    console.error("Failed to initialize backend storage:", error);
  }

  // Render the app immediately after storage init
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

  // Initialize cursor control to enforce strict cursor behavior
  initializeCursorControl();
  try {
    void (async () => {
      await saveClientStateForBackups();
      await createStartupBackup();
      window.setInterval(() => {
        void runAutoBackupIfDue();
      }, 60_000);
    })();
  } catch {
    // Backup operations should never block app startup.
  }
}

void bootstrap();
