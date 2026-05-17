import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../BaseComponents';
import { Input, Textarea, SectionDivider, Alert } from '../BaseComponents';
import { FileUpload } from '../FileUpload';
import { useSettings, useUpdateSettings } from '../../../store/settingsStore';
import { validateGSTIN, validatePAN, validateEmail, validatePhone, validatePincode } from '../../../types/settings';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export const CompanySettings: React.FC = () => {
  const settings = useSettings();
  const updateSettings = useUpdateSettings();
  
  const [errors, setErrors] = React.useState<Record<string, string>>({});

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

  const handleCompanyLogoChange = (url: string | null) => {
    updateSettings('company', { logo: url });
  };

  const handleBlur = (name: string, value: string) => {
    validateField(name, value);
  };

  return (
    <div className="space-y-6">
      {/* Company Information */}
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
              onChange={(e) => updateSettings('company', { companyName: e.target.value })}
              onBlur={(e) => handleBlur('companyName', e.target.value)}
            />
            
            <Input
              label="Legal Name"
              placeholder="Enter legal business name"
              value={settings.company.legalName}
              onChange={(e) => updateSettings('company', { legalName: e.target.value })}
              description="Used for legal documents and contracts"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="GSTIN"
              placeholder="27AAAAA0000A1Z5"
              value={settings.company.gstin}
              onChange={(e) => updateSettings('company', { gstin: e.target.value.toUpperCase() })}
              onBlur={(e) => handleBlur('gstin', e.target.value.toUpperCase())}
              error={errors.gstin}
              description="Goods and Services Tax Identification Number"
            />
            
            <Input
              label="PAN Number"
              placeholder="ABCDE1234F"
              value={settings.company.panNumber}
              onChange={(e) => updateSettings('company', { panNumber: e.target.value.toUpperCase() })}
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
            onChange={(e) => updateSettings('company', { email: e.target.value })}
            onBlur={(e) => handleBlur('email', e.target.value)}
            error={errors.email}
          />

          <Input
            label="Phone Number"
            type="tel"
            placeholder="10-digit mobile number"
            value={settings.company.phone}
            onChange={(e) => updateSettings('company', { phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            onBlur={(e) => handleBlur('phone', e.target.value)}
            error={errors.phone}
          />

          <Input
            label="Website"
            type="url"
            placeholder="https://yourcompany.com"
            value={settings.company.website}
            onChange={(e) => updateSettings('company', { website: e.target.value })}
          />
        </CardContent>
      </Card>

      {/* Address */}
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
            onChange={(e) => updateSettings('company', { address: e.target.value })}
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="City"
              placeholder="Enter city"
              value={settings.company.city}
              onChange={(e) => updateSettings('company', { city: e.target.value })}
            />
            
            <Input
              label="State"
              placeholder="Enter state"
              value={settings.company.state}
              onChange={(e) => updateSettings('company', { state: e.target.value })}
            />
            
            <Input
              label="Pincode"
              placeholder="6-digit pincode"
              value={settings.company.pincode}
              onChange={(e) => updateSettings('company', { pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              onBlur={(e) => handleBlur('pincode', e.target.value)}
              error={errors.pincode}
            />
          </div>

          <Input
            label="Country"
            placeholder="Enter country"
            value={settings.company.country}
            onChange={(e) => updateSettings('company', { country: e.target.value })}
          />
        </CardContent>
      </Card>

      {/* Company Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Company Logo</CardTitle>
          <CardDescription>
            Upload your company logo. Recommended size: 300x100px. PNG or JPG format.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <FileUpload
            label="Logo"
            description="Your logo will appear on invoices and documents"
            accept="image/*"
            currentUrl={settings.company.logo || undefined}
            onFileChange={() => {}}
            onUrlChange={handleCompanyLogoChange}
            maxSize={2 * 1024 * 1024} // 2MB
          />
        </CardContent>
      </Card>

      {/* Validation Summary */}
      {Object.values(errors).some(e => e) && (
        <Alert variant="error" icon={<AlertCircle className="w-5 h-5 text-red-500" />}>
          Please fix the validation errors above before saving.
        </Alert>
      )}

      {/* Success Message */}
      {!Object.values(errors).some(e => e) && (
        <Alert variant="success" icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}>
          All fields are valid. Your settings will be saved automatically.
        </Alert>
      )}
    </div>
  );
};
