import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/stores/useAppStore";
import {
  PremiumModal,
  PremiumInput,
  PremiumSelect,
  PremiumTextarea,
} from "@/components";
import { Button } from "@/components/ui/Button";
import * as db from "@/db/db";
import type { Party, LedgerType, PartyType } from "@/db/schema";

interface CreatePartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (party: Party) => void;
  initialType?: PartyType;
}

export function CreatePartyModal({
  isOpen,
  onClose,
  onSuccess,
  initialType = "customer",
}: CreatePartyModalProps) {
  const { t } = useTranslation();
  const { currentCompanyId, loadParties } = useAppStore();

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formGstin, setFormGstin] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formShippingAddress, setFormShippingAddress] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formState, setFormState] = useState("");
  const [formOpenBal, setFormOpenBal] = useState(0);
  const [formBalType, setFormBalType] = useState<LedgerType>("debit");
  const [formComm, setFormComm] = useState(3);
  const [formCreditLimit, setFormCreditLimit] = useState(0);
  const [formPartyType, setFormPartyType] = useState<PartyType>(initialType);
  const [formNotes, setFormNotes] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormPartyType(initialType);
    }
  }, [isOpen, initialType]);

  const handleSave = async () => {
    if (!formName.trim()) {
      return;
    }
    setSaveLoading(true);
    try {
      if (!currentCompanyId) {
        setSaveLoading(false);
        return;
      }
      const newParty = db.createParty({
        name: formName,
        phone: formPhone,
        email: formEmail,
        gstin: formGstin,
        address: formAddress,
        shippingAddress: formShippingAddress,
        city: formCity,
        state: formState,
        openingBalance: formOpenBal,
        balanceType: formBalType,
        commissionPercent: formComm,
        creditLimit: formCreditLimit,
        partyType: formPartyType,
        notes: formNotes,
        companyId: currentCompanyId,
      });
      
      loadParties();
      onSuccess(newParty);
      onClose();
      resetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormPhone("");
    setFormEmail("");
    setFormGstin("");
    setFormAddress("");
    setFormShippingAddress("");
    setFormCity("");
    setFormState("");
    setFormOpenBal(0);
    setFormBalType("debit");
    setFormComm(3);
    setFormCreditLimit(0);
    setFormNotes("");
  };

  return (
    <PremiumModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialType === 'supplier' ? "+ Create Supplier" : "+ Create Customer"}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saveLoading} onClick={handleSave}>
            Create Party
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Primary Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PremiumInput
                label={t("parties.partyName") + " *"}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter party name"
              />
              <PremiumInput
                label={t("parties.phone")}
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="10-digit phone number"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PremiumInput
                label={t("parties.email")}
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="party@example.com"
              />
              <PremiumInput
                label={t("parties.gstin")}
                value={formGstin}
                onChange={(e) => setFormGstin(e.target.value)}
                placeholder="15-digit GST ID"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PremiumTextarea
                label={t("parties.address")}
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="Billing address"
                rows={3}
              />
              <PremiumTextarea
                label={t("parties.shippingAddress")}
                value={formShippingAddress}
                onChange={(e) => setFormShippingAddress(e.target.value)}
                placeholder="Shipping address (optional)"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PremiumInput
                label="City"
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
                placeholder="City name"
              />
              <PremiumInput
                label="State"
                value={formState}
                onChange={(e) => setFormState(e.target.value)}
                placeholder="State name"
              />
            </div>
          </div>

          {/* Business Settings */}
          <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
              {t("parties.partyType")}
            </h3>
            
            <PremiumSelect
              label={t("parties.partyType") + " *"}
              value={formPartyType}
              onChange={(e) => setFormPartyType(e.target.value as PartyType)}
              options={[
                { value: "customer", label: t("parties.customer") },
                { value: "supplier", label: t("parties.supplier") },
                { value: "both", label: t("parties.both") },
              ]}
            />

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <PremiumSelect
                label={t("parties.type") + " (Opening)"}
                value={formBalType}
                onChange={(e) => setFormBalType(e.target.value as LedgerType)}
                options={[
                  { value: "debit", label: "Debit (We receive)" },
                  { value: "credit", label: "Credit (They receive)" },
                ]}
              />

              <PremiumInput
                label={t("parties.openingBalance")}
                type="number"
                value={formOpenBal}
                onChange={(e) =>
                  setFormOpenBal(parseFloat(e.target.value) || 0)
                }
                placeholder="₹ 0.00"
              />

              <PremiumInput
                label={t("parties.creditLimit")}
                type="number"
                value={formCreditLimit}
                onChange={(e) => setFormCreditLimit(parseFloat(e.target.value) || 0)}
                placeholder="₹ 0.00"
              />

              <PremiumInput
                label="Commission %"
                type="number"
                value={formComm}
                onChange={(e) => setFormComm(parseFloat(e.target.value) || 0)}
                placeholder="3%"
              />
            </div>
          </div>
        </div>

        <PremiumTextarea
          label={t("parties.notes")}
          value={formNotes}
          onChange={(e) => setFormNotes(e.target.value)}
          placeholder="Additional notes or remarks"
          rows={2}
        />
      </div>
    </PremiumModal>
  );
}
