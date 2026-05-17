import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/auth";
import { useAppStore } from "@/stores/useAppStore";

/** @deprecated Use Settings → Companies. Kept for old bookmarks. */
export function ManageCompaniesPage() {
  const navigate = useNavigate();
  const { companies, currentCompanyId } = useAppStore();

  useEffect(() => {
    const companyId =
      currentCompanyId ||
      authService.getCurrentCompany() ||
      companies[0]?.id;

    if (companyId) {
      navigate(`/app/${companyId}/settings?section=companies`, {
        replace: true,
      });
    } else {
      navigate("/select-company", { replace: true });
    }
  }, [navigate, companies, currentCompanyId]);

  return null;
}
