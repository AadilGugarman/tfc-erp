import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../BaseComponents';
import { Input, Textarea, SectionDivider, Alert } from '../BaseComponents';
import { FileUpload } from '../FileUpload';
import { useAppStore } from '@/stores/useAppStore';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export const CompanySettings: React.FC = () => {
  const { settings, updateSettings } = useAppStore();
  
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validateGSTIN = (gstin: string): boolean => {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  };

  const validatePAN = (pan: string): boolean => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  const validatePincode = (pincode: string): boolean => {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
  };

  const validateField = (name: string, value: string) => {
    let error = '';
    
    switch (name) {
      case 'gstin':
        if (value && !validateGSTIN(value)) {
          error = 'Invalid GSTIN format (e.g., 27AAAAA0000A1Z5)';
        }
        break;
      case 'panNumber':
        if (value && !validatePAN(value)) {
          error = 'Invalid PAN format (e.g., ABCDE1234F)';
        }
        break;
      case 'email':
        if (value && !validateEmail(value)) {
          error = 'Invalid email address';
        }
        break;
      case 'phone':
        if (value && !validatePhone(value)) {
          error = 'Phone number must be 10 digits';
        }
        break;
      case 'pincode':
        if (value && !validatePincode(value)) {
          error = 'Pincode must be 6 digits';
        }
        break;
    }
    
    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleUpdate = (updates: Partial<typeof settings.company>) => {
    updateSettings({
      company: {
        ...settings.company,
        ...updates
      }
    });
  };

  const handleBlur = (name: string, value: string) => {
    validateField(name, value);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Basic information about your business that appears on invoices and documents.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Company Name"
              placeholder="Enter company name"
              value={settings.company.companyName}
              onChange={(e) => handleUpdate({ companyName: e.target.value })}
              onBlur={(e) => handleBlur('companyName', e.target.value)}
            />
            
            <Input
              label="Legal Name"
              placeholder="Enter legal business name"
              value={settings.company.legalName}
              onChange={(e) => handleUpdate({ legalName: e.target.value })}
              description="Used for legal documents and contracts"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="GSTIN"
              placeholder="27AAAAA0000A1Z5"
              value={settings.company.gstin}
              onChange={(e) => handleUpdate({ gstin: e.target.value.toUpperCase() })}
              onBlur={(e) => handleBlur('gstin', e.target.value.toUpperCase())}
              error={errors.gstin}
              description="Goods and Services Tax Identification Number"
            />
            
            <Input
              label="PAN Number"
              placeholder="ABCDE1234F"
              value={settings.company.panNumber}
              onChange={(e) => handleUpdate({ panNumber: e.target.value.toUpperCase() })}
              onBlur={(e) => handleBlur('panNumber', e.target.value.toUpperCase())}
              error={errors.panNumber}
              description="Permanent Account Number"
            />
          </div>

          <SectionDivider label="Contact Details" />

          <Input
            label="Email Address"
            type="email"
            placeholder="your@email.com"
            value={settings.company.email}
            onChange={(e) => handleUpdate({ email: e.target.value })}
            onBlur={(e) => handleBlur('email', e.target.value)}
            error={errors.email}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Phone Number"
              type="tel"
              placeholder="10-digit mobile number"
              value={settings.company.phone}
              onChange={(e) => handleUpdate({ phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              onBlur={(e) => handleBlur('phone', e.target.value)}
              error={errors.phone}
            />
            
            <Input
              label="WhatsApp Number"
              type="tel"
              placeholder="10-digit mobile number"
              value={settings.company.whatsappPhone}
              onChange={(e) => handleUpdate({ whatsappPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              description="For sending digital invoices"
            />
          </div>

          <Input
            label="Website"
            type="url"
            placeholder="https://yourcompany.com"
            value={settings.company.website}
            onChange={(e) => handleUpdate({ website: e.target.value })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Address</CardTitle>
          <CardDescription>
            Your registered business address that appears on invoices.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Textarea
            label="Address"
            placeholder="Enter your business address"
            value={settings.company.address}
            onChange={(e) => handleUpdate({ address: e.target.value })}
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="City"
              placeholder="Enter city"
              value={settings.company.city}
              onChange={(e) => handleUpdate({ city: e.target.value })}
            />
            
            <Input
              label="State"
              placeholder="Enter state"
              value={settings.company.state}
              onChange={(e) => handleUpdate({ state: e.target.value })}
            />
            
            <Input
              label="Pincode"
              placeholder="6-digit pincode"
              value={settings.company.pincode}
              onChange={(e) => handleUpdate({ pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              onBlur={(e) => handleBlur('pincode', e.target.value)}
              error={errors.pincode}
            />
          </div>

          <Input
            label="Country"
            placeholder="Enter country"
            value={settings.company.country}
            onChange={(e) => handleUpdate({ country: e.target.value })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>
            Upload your company logo and authorized signature.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8">
          <FileUpload
            label="Company Logo"
            description="Your logo will appear on invoices and documents"
            accept="image/*"
            currentUrl={settings.company.logo}
            onFileChange={() => {}}
            onUrlChange={(url) => handleUpdate({ logo: url })}
            maxSize={2 * 1024 * 1024}
          />
          
          <SectionDivider />
          
          <FileUpload
            label="Authorized Signature"
            description="This signature will appear at the bottom of your invoices"
            accept="image/*"
            currentUrl={settings.company.signature}
            onFileChange={() => {}}
            onUrlChange={(url) => handleUpdate({ signature: url })}
            maxSize={1 * 1024 * 1024}
            variant="image"
          />
        </CardContent>
      </Card>

      {Object.values(errors).some(e => e) && (
        <Alert variant="error" icon={<AlertCircle className="w-5 h-5 text-red-500" />}>
          Please fix the validation errors above before saving.
        </Alert>
      )}

      {!Object.values(errors).some(e => e) && (
        <Alert variant="success" icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}>
          All fields are valid. Your settings will be saved automatically.
        </Alert>
      )}
    </div>
  );
};
