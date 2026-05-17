import React from "react";
import { ArrowLeft, Database, CheckCircle2, RefreshCw } from "lucide-react";

interface HeaderProps {
  onBackClick: () => void;
  lastSavedTime: string | null;
  isDirty: boolean;
  onResetForm: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onBackClick,
  lastSavedTime,
  isDirty,
  onResetForm,
  title = "Create New Company",
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Back Navigation & Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBackClick}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer group focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            title="Return to previous screen"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back</span>
          </button>

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          <div> 
             <div className="flex items-center gap-2"> 
               <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1> 
             </div> 
             <p className="text-xs text-slate-500 hidden sm:block mt-0.5"> 
               Configure your organizational ledger, statutory tax profiles, and automated billing engine. 
             </p> 
           </div> 
         </div> 
 
         {/* Right: Autosave status */} 
         <div className="flex items-center flex-wrap gap-3 w-full md:w-auto justify-between md:justify-end"> 
           
           <button 
               onClick={onResetForm} 
               className="text-xs font-medium bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all cursor-pointer flex items-center gap-1.5" 
               title="Clear all fields" 
             > 
               <RefreshCw className="w-3.5 h-3.5" /> 
               Reset Form 
             </button> 
 
           {/* Autosave Status */} 
           <div className="text-right hidden xl:block min-w-[120px]"> 
             {isDirty ? ( 
               <div className="flex items-center justify-end gap-1.5 text-xs text-amber-600 font-medium"> 
                 <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span> 
                 <span>Unsaved changes</span> 
               </div> 
             ) : lastSavedTime ? ( 
               <div className="flex items-center justify-end gap-1 text-xs text-slate-500"> 
                 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 
                 <span>Draft saved {lastSavedTime}</span> 
               </div> 
             ) : null} 
           </div> 
         </div> 
       </div> 
     </header>
  );
};
