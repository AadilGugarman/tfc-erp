import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronLeft,
  Layers,
  Warehouse,
  CreditCard,
  LogOut,
} from 'lucide-react';

interface NavItem {
  icon: React.ElementType;
  label: string;
  badge?: number;
  active?: boolean;
  group?: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', group: 'main' },
  { icon: Users, label: 'Parties', active: true, group: 'main' },
  { icon: ShoppingCart, label: 'Sales', group: 'main' },
  { icon: Package, label: 'Purchase', group: 'main' },
  { icon: Warehouse, label: 'Inventory', group: 'main' },
  { icon: FileText, label: 'Accounting', badge: 3, group: 'finance' },
  { icon: CreditCard, label: 'Payments', group: 'finance' },
  { icon: BarChart3, label: 'Reports', group: 'finance' },
  { icon: Layers, label: 'Integrations', group: 'system' },
  { icon: Settings, label: 'Settings', group: 'system' },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onClose }) => {
  const [collapsed, setCollapsed] = useState(false);

  const NavLink: React.FC<NavItem> = ({ icon: Icon, label, badge, active }) => (
    <li className="relative">
      {active && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-indigo-500"
          style={{ height: '60%' }}
        />
      )}
      <button
        className={`
          group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
          transition-all duration-150 cursor-pointer
          ${active
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }
        `}
      >
        <span
          className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-colors
            ${active ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}
          `}
        >
          <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
        </span>

        {!collapsed && (
          <>
            <span className={`flex-1 text-sm font-medium ${active ? 'text-indigo-700' : ''}`}>
              {label}
            </span>
            {badge !== undefined && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-100 text-rose-600 text-[10px] font-bold">
                {badge}
              </span>
            )}
          </>
        )}

        {collapsed && badge !== undefined && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
        )}
      </button>
    </li>
  );

  const sidebarContent = (
    <div className={`
      flex flex-col h-full bg-white border-r border-slate-100/80
      transition-all duration-300
      ${collapsed ? 'w-[68px]' : 'w-[220px]'}
    `}>
      {/* Logo area */}
      <div className={`flex items-center justify-between h-16 px-4 border-b border-slate-100/80 flex-shrink-0`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-indigo-200">
              <span className="text-white text-xs font-bold tracking-tight">N</span>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800 tracking-tight leading-none">Nexus</div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wide leading-none mt-0.5">ERP Platform</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto shadow-sm shadow-indigo-200">
            <span className="text-white text-xs font-bold">N</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`hidden lg:flex items-center justify-center w-6 h-6 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors ${collapsed ? 'mx-auto mt-0' : ''}`}
        >
          <ChevronLeft size={14} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-5">
        {/* Main */}
        <div>
          {!collapsed && (
            <div className="px-2 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              Main
            </div>
          )}
          <ul className="space-y-0.5">
            {navItems.filter(i => i.group === 'main').map(item => (
              <NavLink key={item.label} {...item} />
            ))}
          </ul>
        </div>

        {/* Finance */}
        <div>
          {!collapsed && (
            <div className="px-2 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              Finance
            </div>
          )}
          <ul className="space-y-0.5">
            {navItems.filter(i => i.group === 'finance').map(item => (
              <NavLink key={item.label} {...item} />
            ))}
          </ul>
        </div>

        {/* System */}
        <div>
          {!collapsed && (
            <div className="px-2 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              System
            </div>
          )}
          <ul className="space-y-0.5">
            {navItems.filter(i => i.group === 'system').map(item => (
              <NavLink key={item.label} {...item} />
            ))}
          </ul>
        </div>
      </nav>

      {/* Bottom user section */}
      <div className={`flex-shrink-0 border-t border-slate-100 p-3 space-y-1`}>
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors">
          <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-slate-400">
            <HelpCircle size={16} strokeWidth={1.8} />
          </span>
          {!collapsed && <span className="text-sm font-medium">Help & Docs</span>}
        </button>

        <div className={`flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors`}>
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center">
            <span className="text-white text-xs font-semibold">AK</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-700 truncate">Arjun Kumar</div>
              <div className="text-[11px] text-slate-400 truncate">Admin</div>
            </div>
          )}
          {!collapsed && (
            <button className="text-slate-300 hover:text-slate-500 transition-colors">
              <LogOut size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-shrink-0 h-full">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside className="relative flex flex-shrink-0 h-full animate-drawer" style={{ zIndex: 51 }}>
            <div className="flex flex-col h-full bg-white border-r border-slate-100/80 w-[220px]">
              {/* Same content for mobile but no collapse */}
              <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100/80 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-indigo-200">
                    <span className="text-white text-xs font-bold tracking-tight">N</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800 tracking-tight leading-none">Nexus</div>
                    <div className="text-[10px] text-slate-400 font-medium tracking-wide leading-none mt-0.5">ERP Platform</div>
                  </div>
                </div>
                <button onClick={onClose} className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-slate-100 text-slate-400">
                  <ChevronLeft size={14} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-5">
                <div>
                  <div className="px-2 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Main</div>
                  <ul className="space-y-0.5">
                    {navItems.filter(i => i.group === 'main').map(item => (
                      <NavLink key={item.label} {...item} />
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="px-2 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Finance</div>
                  <ul className="space-y-0.5">
                    {navItems.filter(i => i.group === 'finance').map(item => (
                      <NavLink key={item.label} {...item} />
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="px-2 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">System</div>
                  <ul className="space-y-0.5">
                    {navItems.filter(i => i.group === 'system').map(item => (
                      <NavLink key={item.label} {...item} />
                    ))}
                  </ul>
                </div>
              </nav>
              <div className="flex-shrink-0 border-t border-slate-100 p-3 space-y-1">
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">AK</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-700 truncate">Arjun Kumar</div>
                    <div className="text-[11px] text-slate-400 truncate">Admin</div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
