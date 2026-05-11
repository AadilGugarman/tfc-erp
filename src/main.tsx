import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n/config";
import App from "./App";
import { initializeBackendStorage } from "./db/db";
import { createStartupBackup, runAutoBackupIfDue, saveClientStateForBackups } from "./services/backup";

async function bootstrap() {
  await initializeBackendStorage();

  try {
    await saveClientStateForBackups();
    await createStartupBackup();
    window.setInterval(() => {
      void runAutoBackupIfDue();
    }, 60_000);
  } catch {
    // Backup operations should never block app startup.
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

void bootstrap();
