import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../BaseComponents';
import { Input, Textarea, Select, Toggle, Button, SectionDivider } from '../BaseComponents';
import { FileUpload, ColorPicker } from '../FileUpload';
import { useAppStore } from '@/stores/useAppStore';
import { Download, Printer, MessageCircle, Eye, X } from 'lucide-react';

export const InvoiceSettings: React.FC = () => {
  const { settings, updateSettings } = useAppStore();
  
  const [showPreview, setShowPreview] = React.useState(false);
  
  const invoiceData = {
    billNumber: `${settings.financial.invoicePrefix}-${String(settings.financial.invoiceStartingNumber).padStart(6, '0')}`,
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }),
    customerName: 'John Doe',
    customerMobile: '9876543210',
    items: [
      { id: '1', item: 'Gold Chain', lot: 'G1234', caret: 24, weight: 15.5, rate: 5800, amount: 89900 },
      { id: '2', item: 'Silver Bracelet', lot: 'S5678', caret: 925, weight: 45.2, rate: 85, amount: 3842 },
      { id: '3', item: 'Diamond Ring', lot: 'D9012', caret: 18, weight: 3.2, rate: 45000, amount: 144000 },
    ],
    previousBalance: 25000,
    todayAmount: 237742,
    paidAmount: 100000,
    remainingBalance: 162742,
    notes: 'Thank you for your business. Please pay within 7 days.',
  };

  const templateOptions = [
    { value: 'modern', label: 'Modern' },
    { value: 'classic', label: 'Classic' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'professional', label: 'Professional' },
  ];

  const handleUpdate = (updates: Partial<typeof settings.invoice>) => {
    updateSettings({
      invoice: {
        ...settings.invoice,
        ...updates
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const message = `Hello ${invoiceData.customerName}, your invoice ${invoiceData.billNumber} for ₹${invoiceData.remainingBalance.toLocaleString()} is ready. Please check the attached invoice.`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleDownloadPDF = () => {
    alert('PDF download would be triggered here. In production, integrate with jsPDF or react-pdf library.');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invoice Template</CardTitle>
          <CardDescription>
            Choose and customize the template for your invoices.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Select
            label="Template Style"
            value={settings.invoice.template}
            onChange={(e) => handleUpdate({ template: e.target.value as any })}
            options={templateOptions}
            description="Select the visual style for your invoices"
          />

          <ColorPicker
            label="Brand Color"
            description="Primary color used in invoice design"
            value={settings.invoice.invoiceColorTheme}
            onChange={(color) => handleUpdate({ invoiceColorTheme: color })}
          />

          <SectionDivider label="Invoice Options" />

          <Toggle
            checked={settings.invoice.enableQRCode}
            onCheckedChange={(checked) => handleUpdate({ enableQRCode: checked })}
            label="Enable QR Code"
            description="Add QR code for quick payment verification"
          />

          <Toggle
            checked={settings.invoice.autoInvoiceNumber}
            onCheckedChange={(checked) => handleUpdate({ autoInvoiceNumber: checked })}
            label="Auto Invoice Number"
            description="Automatically generate sequential invoice numbers"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Default Tax Rate (%)"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={settings.invoice.defaultTax}
              onChange={(e) => handleUpdate({ defaultTax: parseFloat(e.target.value) || 0 })}
              description="Default tax rate applied to all items"
            />
            
            <Input
              label="Commission %"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={settings.invoice.commissionPercent}
              onChange={(e) => handleUpdate({ commissionPercent: parseFloat(e.target.value) || 0 })}
              description="Default commission percentage"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Payment Due Days"
              type="number"
              min={0}
              max={365}
              value={settings.invoice.dueDateDays}
              onChange={(e) => handleUpdate({ dueDateDays: parseInt(e.target.value) || 30 })}
              description="Default payment terms in days"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Content</CardTitle>
          <CardDescription>
            Customize the text content that appears on your invoices.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Textarea
            label="Terms & Conditions"
            placeholder="Enter default terms and conditions..."
            value={settings.invoice.termsAndConditions}
            onChange={(e) => handleUpdate({ termsAndConditions: e.target.value })}
            rows={4}
            description="These terms will appear on all invoices"
          />

          <Textarea
            label="Footer Notes"
            placeholder="Enter footer notes..."
            value={settings.invoice.footerNotes}
            onChange={(e) => handleUpdate({ footerNotes: e.target.value })}
            rows={2}
            description="Additional notes displayed at the bottom of invoices"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Toggle
              checked={settings.invoice.showCompanyDetails}
              onCheckedChange={(checked) => handleUpdate({ showCompanyDetails: checked })}
              label="Show Company Details"
              description="Display your company information on invoices"
            />
            
            <Toggle
              checked={settings.invoice.showPaymentDetails}
              onCheckedChange={(checked) => handleUpdate({ showPaymentDetails: checked })}
              label="Show Payment Details"
              description="Display bank/payment information on invoices"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Signature</CardTitle>
          <CardDescription>
            Upload your signature to appear on invoices and documents.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <FileUpload
            label="Signature Image"
            description="Upload your signature (PNG with transparent background recommended)"
            accept="image/*"
            currentUrl={settings.invoice.signature}
            onFileChange={() => {}}
            onUrlChange={(url) => handleUpdate({ signature: url })}
            maxSize={1 * 1024 * 1024}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Bill / Invoice Preview</CardTitle>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  A4 Size Format
                </span>
              </div>
              <CardDescription>
                Preview how your invoice will look in standard professional A4 size (210mm × 297mm) with current settings.
              </CardDescription>
            </div>
            <Button onClick={() => setShowPreview(true)}>
              <Eye className="w-4 h-4 mr-2" />
              View A4 Preview
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start font-medium" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
              Print A4 Invoice
            </Button>
            <Button variant="outline" className="justify-start font-medium" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
              Download A4 PDF
            </Button>
            <Button variant="outline" className="justify-start font-medium" onClick={handleWhatsAppShare}>
              <MessageCircle className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
              Share on WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800">
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-20 shadow-sm">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Bill / Invoice Live Preview</h3>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Standard A4 Size
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 md:p-10 overflow-y-auto flex-1 bg-zinc-100 dark:bg-zinc-950">
              <div className="bg-white p-8 shadow-xl mx-auto max-w-[210mm] min-h-[297mm]">
                <div className="flex items-start justify-between pb-6 border-b-2 border-zinc-200">
                  <div className="flex-1 pr-4 text-zinc-900">
                    {settings.company.logo ? (
                      <img 
                        src={settings.company.logo} 
                        alt="Company Logo" 
                        className="h-16 mb-4 object-contain"
                      />
                    ) : (
                      <div 
                        className="h-16 w-16 flex items-center justify-center mb-4 rounded-xl shadow-inner text-white text-3xl font-extrabold"
                        style={{ backgroundColor: settings.invoice.invoiceColorTheme }}
                      >
                        {settings.company.companyName?.charAt(0) || 'B'}
                      </div>
                    )}
                    
                    <h1 
                      className="text-2xl font-extrabold mb-1 tracking-tight"
                      style={{ color: settings.invoice.invoiceColorTheme }}
                    >
                      {settings.company.companyName || 'Your Company Name'}
                    </h1>
                    
                    {settings.company.phone && (
                      <p className="text-sm font-medium text-zinc-700 flex items-center gap-1.5 mt-1">
                        📞 {settings.company.phone}
                      </p>
                    )}
                    
                    {settings.company.address && (
                      <p className="text-sm text-zinc-600 mt-1 leading-relaxed max-w-md">
                        {settings.company.address}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right pl-4">
                    <h2 
                      className="text-4xl font-black mb-3 tracking-wider uppercase"
                      style={{ color: settings.invoice.invoiceColorTheme }}
                    >
                      INVOICE
                    </h2>
                    {settings.company.gstin && (
                      <p className="text-xs font-semibold text-zinc-600 bg-zinc-50 px-2.5 py-1 rounded border border-zinc-200 inline-block mb-1">
                        GSTIN: {settings.company.gstin}
                      </p>
                    )}
                    <br />
                    {settings.company.panNumber && (
                      <p className="text-xs font-semibold text-zinc-600 bg-zinc-50 px-2.5 py-1 rounded border border-zinc-200 inline-block">
                        PAN: {settings.company.panNumber}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 py-6 border-b border-zinc-200 bg-zinc-50/50 px-4 rounded-lg my-4 text-zinc-900">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                      Bill Details
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between max-w-xs">
                        <span className="text-sm font-medium text-zinc-500">Bill No:</span>
                        <span className="text-sm font-bold text-zinc-900 bg-white px-2 py-0.5 rounded border border-zinc-200 shadow-xs">{invoiceData.billNumber}</span>
                      </div>
                      <div className="flex items-center justify-between max-w-xs">
                        <span className="text-sm font-medium text-zinc-500">Date:</span>
                        <span className="text-sm font-semibold text-zinc-800">{invoiceData.date}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                      Customer Details
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between max-w-xs">
                        <span className="text-sm font-medium text-zinc-500">Customer Name:</span>
                        <span className="text-sm font-bold text-zinc-900">{invoiceData.customerName}</span>
                      </div>
                      <div className="flex items-center justify-between max-w-xs">
                        <span className="text-sm font-medium text-zinc-500">Mobile Number:</span>
                        <span className="text-sm font-semibold text-zinc-800">{invoiceData.customerMobile}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="py-4 my-2">
                  <table className="w-full border-collapse text-zinc-900">
                    <thead>
                      <tr 
                        className="border-b-2 text-zinc-800 bg-zinc-50/80"
                        style={{ borderColor: settings.invoice.invoiceColorTheme }}
                      >
                        <th className="text-left py-3.5 px-3 text-xs font-bold uppercase tracking-wider">Item</th>
                        <th className="text-center py-3.5 px-3 text-xs font-bold uppercase tracking-wider">Lot</th>
                        <th className="text-center py-3.5 px-3 text-xs font-bold uppercase tracking-wider">Caret</th>
                        <th className="text-right py-3.5 px-3 text-xs font-bold uppercase tracking-wider">Weight</th>
                        <th className="text-right py-3.5 px-3 text-xs font-bold uppercase tracking-wider">Rate</th>
                        <th className="text-right py-3.5 px-3 text-xs font-bold uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {invoiceData.items.map((item) => (
                        <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="py-3.5 px-3 text-sm font-bold text-zinc-900">{item.item}</td>
                          <td className="py-3.5 px-3 text-sm font-medium text-zinc-600 text-center bg-zinc-50/30 rounded">{item.lot}</td>
                          <td className="py-3.5 px-3 text-sm font-semibold text-zinc-700 text-center">{item.caret}K</td>
                          <td className="py-3.5 px-3 text-sm font-semibold text-zinc-900 text-right">{item.weight}g</td>
                          <td className="py-3.5 px-3 text-sm font-medium text-zinc-700 text-right">
                            {settings.financial.currencySymbol}{item.rate.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3 text-sm font-bold text-zinc-900 text-right">
                            {settings.financial.currencySymbol}{item.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="py-6 border-t-2 border-zinc-200 mt-4 text-zinc-900">
                  <div className="grid grid-cols-2 gap-12">
                    <div className="space-y-3 bg-zinc-50/50 p-4 rounded-xl border border-zinc-100">
                      <div className="flex justify-between text-sm py-1.5 border-b border-zinc-200/60">
                        <span className="text-zinc-600 font-medium">Previous Balance</span>
                        <span className="font-bold text-zinc-900">
                          {settings.financial.currencySymbol}{invoiceData.previousBalance.toLocaleString()}
                        </span>
                      </div>
                      <div 
                        className="flex justify-between text-sm py-1.5 border-b border-zinc-200/60"
                        style={{ color: settings.invoice.invoiceColorTheme }}
                      >
                        <span className="font-bold">Today Amount</span>
                        <span className="font-extrabold text-base">
                          {settings.financial.currencySymbol}{invoiceData.todayAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm py-1.5 pt-2">
                        <span className="text-zinc-700 font-bold">Total Due</span>
                        <span className="font-black text-zinc-900 text-base">
                          {settings.financial.currencySymbol}{(invoiceData.previousBalance + invoiceData.todayAmount).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3 bg-zinc-50/50 p-4 rounded-xl border border-zinc-100">
                      <div className="flex justify-between text-sm py-1.5 border-b border-zinc-200/60">
                        <span className="text-zinc-600 font-medium">Paid Amount</span>
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                          {settings.financial.currencySymbol}{invoiceData.paidAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm py-1.5 pt-2">
                        <span className="text-zinc-700 font-bold">Remaining Balance</span>
                        <span className="font-black text-lg text-red-600 bg-red-50 px-3 py-1 rounded-lg border border-red-200 shadow-xs">
                          {settings.financial.currencySymbol}{invoiceData.remainingBalance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {invoiceData.notes && (
                  <div className="py-5 border-t border-zinc-200 mt-2 text-zinc-900">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      Notes / Terms
                    </h3>
                    <p className="text-xs font-medium text-zinc-600 leading-relaxed bg-zinc-50 p-3 rounded-lg border border-zinc-200/60">{invoiceData.notes}</p>
                  </div>
                )}

                <div className="pt-8 pb-4 mt-6 border-t border-zinc-200 text-zinc-900">
                  <div className="flex items-end justify-between">
                    <div className="flex-1 max-w-xs">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                        Authorized Signature
                      </h3>
                      {settings.invoice.signature ? (
                        <img 
                          src={settings.invoice.signature} 
                          alt="Signature" 
                          className="h-14 object-contain mb-1"
                        />
                      ) : (
                        <div className="h-14 border-2 border-dashed border-zinc-300 bg-zinc-50/50 rounded-lg flex items-center justify-center mb-1">
                          <span className="text-xs font-medium text-zinc-400">Signature Area</span>
                        </div>
                      )}
                      <div className="border-t border-zinc-300 pt-1 text-center">
                        <span className="text-xs font-bold text-zinc-600">{settings.company.companyName || 'Authorized Signatory'}</span>
                      </div>
                    </div>
                    
                    {settings.invoice.enableQRCode && (
                      <div className="ml-8 flex flex-col items-center bg-zinc-50 p-3 rounded-xl border border-zinc-200 shadow-xs">
                        <div className="w-20 h-20 bg-white rounded p-1.5 border border-zinc-200 flex items-center justify-center shadow-xs">
                          <div className="w-full h-full bg-zinc-800 rounded-xs" />
                        </div>
                        <p className="text-xs font-bold text-zinc-600 mt-2 tracking-wide uppercase">Scan to Pay</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-10 pt-4 border-t border-zinc-200 text-center bg-zinc-50/50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-zinc-500 tracking-wide">
                      {settings.invoice.footerNotes || 'Thank you for your business! This is a computer generated invoice.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-20 shadow-md">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleWhatsAppShare} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
