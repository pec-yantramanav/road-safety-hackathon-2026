import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../state/store';
import { toggleSidebar, toggleTheme } from '../state/slices/uiSlice';
import { logout } from '../state/slices/authSlice';
import { RoleGuard } from './RoleGuard';
import { 
  LayoutDashboard, 
  Ticket as TicketIcon, 
  Wrench, 
  BarChart3, 
  LogOut, 
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sun,
  Moon
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setTab }) => {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const theme = useSelector((state: RootState) => state.ui.theme);

  const menuItems = [
    { id: 'DASH', name: 'Dashboard', icon: LayoutDashboard, roles: ['JE', 'AE', 'EE', 'SE', 'CE', 'COMMISSIONER'] },
    { id: 'TICKETS', name: 'Grievance List', icon: TicketIcon, roles: ['JE', 'AE', 'EE', 'SE', 'CE', 'COMMISSIONER'] },
    { id: 'WORKORDERS', name: 'Work Orders', icon: Wrench, roles: ['EE', 'CONTRACTOR', 'JE', 'AE'] },
    { id: 'BUDGET', name: 'Budget Transparency', icon: BarChart3, roles: ['EE', 'SE', 'CE', 'COMMISSIONER'] },
  ];

  return (
    <div
      className={`h-screen bg-glassBg border-r border-glassBorder flex flex-col justify-between transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}
    >
      <div className="flex flex-col">
        {/* Logo and toggle control */}
        <div className="p-6 flex justify-between items-center border-b border-glassBorder">
          {sidebarOpen ? (
            <div className="flex items-center space-x-2">
              <ShieldCheck className="text-accentNeon" size={24} />
              <span className="font-extrabold text-lg text-textPrimary tracking-wider">ROADWATCH</span>
            </div>
          ) : (
            <ShieldCheck className="text-accentNeon mx-auto" size={24} />
          )}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-1 rounded bg-surface text-textSecondary hover:text-textPrimary border border-glassBorder"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* User Identity info badge */}
        {sidebarOpen && currentUser && (
          <div className="p-4 mx-4 my-6 rounded-xl bg-surface border border-glassBorder shadow-sm">
            <div className="text-[10px] text-textSecondary font-bold uppercase tracking-wider">Authorized Officer</div>
            <div className="text-sm font-black text-textPrimary mt-1 truncate">{currentUser.name}</div>
            <div className="inline-block mt-2 px-2 py-0.5 rounded bg-accentNeon/10 border border-accentNeon/20 text-[10px] text-accentNeon font-bold">
              {currentUser.roles.join(', ')}
            </div>
          </div>
        )}

        {/* Menu items */}
        <nav className="space-y-2 px-4">
          {menuItems.map((item) => (
            <RoleGuard key={item.id} allowed={item.roles}>
              <button
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center p-3 rounded-xl transition-all ${
                  currentTab === item.id
                    ? 'bg-accentNeon text-white shadow-lg shadow-accentNeon/10'
                    : 'text-textSecondary hover:bg-surface hover:text-textPrimary'
                }`}
              >
                <item.icon size={20} className="min-w-[20px]" />
                {sidebarOpen && <span className="ml-4 font-semibold text-sm">{item.name}</span>}
              </button>
            </RoleGuard>
          ))}
        </nav>
      </div>

      {/* Lower controls block (Theme + Logout) */}
      <div className="border-t border-glassBorder">
        {/* Dynamic Theme Toggle widget */}
        <div className="p-2">
          <button
            onClick={() => dispatch(toggleTheme())}
            className="w-full flex items-center p-3 text-textSecondary hover:bg-surface hover:text-textPrimary rounded-xl transition-all"
          >
            {theme === 'dark' ? (
              <>
                <Sun size={20} className="min-w-[20px] text-yellow-500" />
                {sidebarOpen && <span className="ml-4 font-semibold text-sm">Light Mode</span>}
              </>
            ) : (
              <>
                <Moon size={20} className="min-w-[20px] text-accentNeon" />
                {sidebarOpen && <span className="ml-4 font-semibold text-sm">Dark Mode</span>}
              </>
            )}
          </button>
        </div>

        {/* Logout Action */}
        <div className="p-2 border-t border-glassBorder/40">
          <button
            onClick={() => dispatch(logout())}
            className="w-full flex items-center p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all font-semibold"
          >
            <LogOut size={20} className="min-w-[20px]" />
            {sidebarOpen && <span className="ml-4 font-semibold text-sm">System Logout</span>}
          </button>
        </div>
      </div>
    </div>
  );
};
export default Sidebar;
