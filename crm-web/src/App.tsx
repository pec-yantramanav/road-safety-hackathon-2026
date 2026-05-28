import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './state/store';
import { setCredentials } from './state/slices/authSlice';
import { Sidebar } from './components/Sidebar';
import { GlassCard } from './components/GlassCard';
import { TicketTable } from './components/TicketTable';
import { ProofViewer } from './components/ProofViewer';

// Import modular, role-specific dashboards
import { ExecutiveDashboard } from './components/dashboards/ExecutiveDashboard';
import { OperationalDashboard } from './components/dashboards/OperationalDashboard';
import { FieldDashboard } from './components/dashboards/FieldDashboard';
import { ContractorDashboard } from './components/dashboards/ContractorDashboard';

import { useTicketListController } from './controllers/useTicketListController';
import { usePoWValidationController } from './controllers/usePoWValidationController';
import { useBudgetDashboardController } from './controllers/useBudgetDashboardController';
import { Ticket } from './types';
import { 
  Sparkles, 
  FileCheck2, 
  UploadCloud 
} from 'lucide-react';

export const App: React.FC = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const theme = useSelector((state: RootState) => state.ui.theme);

  const [activeTab, setActiveTab] = useState('DASH');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Load Controller Hooks
  const { tickets, isLoading: loadingTickets, searchTerm, setSearchTerm } = useTicketListController();
  const { budgets, summary: budgetSummary } = useBudgetDashboardController();
  const { 
    workOrder, 
    status: powStatus, 
    aiVerdict, 
    submitProof, 
    approveWork 
  } = usePoWValidationController('WO-8801');

  // Input states for quick login simulator
  const [inputToken, setInputToken] = useState('EE');

  const handleSimulatedLogin = () => {
    dispatch(setCredentials({ token: inputToken }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      submitProof(e.target.files[0]);
    }
  };

  // Determine user designation scopes dynamically
  const isExecutive = currentUser?.roles.some(r => ['CE', 'SE', 'COMMISSIONER'].includes(r));
  const isOperational = currentUser?.roles.some(r => ['EE'].includes(r));
  const isField = currentUser?.roles.some(r => ['JE', 'AE'].includes(r));
  const isContractor = currentUser?.roles.includes('CONTRACTOR');

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen bg-background flex flex-col justify-center items-center px-6 transition-all duration-300 ${theme === 'dark' ? 'dark-mode' : ''}`}>
        <GlassCard className="max-w-md w-full p-8 text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-textPrimary tracking-wider flex items-center justify-center">
              <Sparkles className="text-accentNeon mr-2" /> ROADWATCH
            </h1>
            <p className="text-xs text-textSecondary">Govt Command & AI Verification Dashboard</p>
          </div>

          <div className="space-y-4 text-left">
            <div>
              <label className="text-[10px] font-bold text-textSecondary uppercase tracking-wider block mb-1">
                OIDC Credentials Bearer Token
              </label>
              <div className="text-[9px] text-textSecondary mb-2 font-semibold">
                * Sandbox Mode: Type <span className="text-accentNeon font-bold">'JE'</span>, <span className="text-accentNeon font-bold">'EE'</span>, <span className="text-accentNeon font-bold">'CE'</span>, or <span className="text-accentNeon font-bold">'CONTRACTOR'</span> to test different roles.
              </div>
              <input
                className="w-full bg-surface text-textPrimary border border-glassBorder rounded-xl px-4 py-3 outline-none focus:border-accentNeon text-sm font-semibold tracking-wider"
                type="text"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
              />
            </div>
            
            <button
              onClick={handleSimulatedLogin}
              className="w-full py-4 mt-4 bg-accentNeon hover:opacity-90 text-white font-bold rounded-xl shadow-lg transition-all"
            >
              Sign In with SSO Keycloak
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className={`flex bg-background min-h-screen text-textPrimary overflow-hidden ${theme === 'dark' ? 'dark-mode' : ''}`}>
      {/* Sidebar Navigation */}
      <Sidebar currentTab={activeTab} setTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto h-screen p-8 space-y-8">
        
        {/* Tab 1: Primary Command Dashboard (Dynamically renders custom modular views) */}
        {activeTab === 'DASH' && (
          <div className="space-y-8 animate-slide-in">
            <header className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-black text-textPrimary tracking-tight">System Command Center</h1>
                <p className="text-xs text-textSecondary mt-1">Jurisdiction ID: {currentUser?.jurisdiction_id} | Role Scoping: {currentUser?.roles.join(', ')}</p>
              </div>
            </header>

            {/* Mount Modular Dashboard based on user scope */}
            {isExecutive && (
              <ExecutiveDashboard tickets={tickets} onSelectTicket={setSelectedTicket} />
            )}

            {isOperational && (
              <OperationalDashboard 
                tickets={tickets} 
                onSelectTicket={setSelectedTicket} 
                workOrder={workOrder}
                powStatus={powStatus}
                aiVerdict={aiVerdict}
                handleFileUpload={handleFileUpload}
              />
            )}

            {isField && (
              <FieldDashboard tickets={tickets} onSelectTicket={setSelectedTicket} />
            )}

            {isContractor && (
              <ContractorDashboard workOrder={workOrder} handleFileUpload={handleFileUpload} />
            )}
          </div>
        )}

        {/* Tab 2: Detailed Grievance List */}
        {activeTab === 'TICKETS' && (
          <div className="space-y-6 animate-slide-in">
            <div>
              <h1 className="text-3xl font-black text-textPrimary tracking-tight">Grievance List</h1>
              <p className="text-xs text-textSecondary mt-1">Audit, assign, and escalate incoming reports</p>
            </div>

            <div className="flex justify-between items-center space-x-4 mb-4">
              <input
                className="flex-1 max-w-sm bg-glassBg text-textPrimary border border-glassBorder rounded-xl px-4 py-3 outline-none focus:border-accentNeon text-xs shadow-sm"
                placeholder="Search ticket number or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <GlassCard>
              {loadingTickets ? (
                <div className="py-8 text-center text-textSecondary text-xs">Loading tickets list...</div>
              ) : (
                <TicketTable tickets={tickets} onSelect={setSelectedTicket} />
              )}
            </GlassCard>
          </div>
        )}

        {/* Tab 3: Work Order Issuance & Contractor Management */}
        {activeTab === 'WORKORDERS' && (
          <div className="space-y-6 animate-slide-in">
            <div>
              <h1 className="text-3xl font-black text-textPrimary tracking-tight">Contractor Portal</h1>
              <p className="text-xs text-textSecondary mt-1">Verify submitted road repairs side-by-side with Computer Vision metrics</p>
            </div>

            {workOrder ? (
              <GlassCard className="space-y-4">
                <div className="flex justify-between items-center border-b border-glassBorder pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-textPrimary">{workOrder.description}</h2>
                    <p className="text-xs text-textSecondary mt-1">Target Ticket: {workOrder.ticketId} | Contractor: {workOrder.contractorId}</p>
                  </div>
                  {workOrder.status === 'SUBMITTED' && (
                    <button
                      onClick={approveWork}
                      className="px-6 py-2.5 bg-successNeon hover:opacity-90 text-white font-bold rounded-xl text-xs flex items-center shadow-lg shadow-successNeon/20 transition-all"
                    >
                      <FileCheck2 className="mr-2" size={16} /> Approve & Release Funds
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-6 py-2">
                  <div>
                    <span className="text-[10px] text-textSecondary font-bold uppercase tracking-wider block">Estimated Cost</span>
                    <span className="text-lg font-black text-textPrimary">₹{workOrder.estimatedCost.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-textSecondary font-bold uppercase tracking-wider block">Assigned By</span>
                    <span className="text-sm font-semibold text-textSecondary">{workOrder.assignedBy}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-textSecondary font-bold uppercase tracking-wider block">Status</span>
                    <span className="text-sm font-bold text-accentNeon uppercase">{workOrder.status}</span>
                  </div>
                </div>

                {/* Split proof comparisons screen */}
                <ProofViewer
                  proofPhotoUrl={workOrder.proofPhotoUrls[0]}
                  status={powStatus}
                  aiVerdict={aiVerdict}
                />
              </GlassCard>
            ) : (
              <GlassCard className="p-8 text-center text-textSecondary">
                No active work order found.
              </GlassCard>
            )}
          </div>
        )}

        {/* Tab 4: Open Budgets Explorer */}
        {activeTab === 'BUDGET' && (
          <div className="space-y-6 animate-slide-in">
            <div>
              <h1 className="text-3xl font-black text-textPrimary tracking-tight">Public Budgets Explorer</h1>
              <p className="text-xs text-textSecondary mt-1">Financial audit metrics for scheme allocations</p>
            </div>

            {/* Overall summary bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GlassCard className="text-center">
                <span className="text-xs font-bold text-textSecondary uppercase tracking-wider">Sanctioned Funding</span>
                <h3 className="text-3xl font-black text-textPrimary mt-2">₹{(budgetSummary.totalSanctioned / 10000000).toFixed(1)} Cr</h3>
              </GlassCard>

              <GlassCard className="text-center">
                <span className="text-xs font-bold text-textSecondary uppercase tracking-wider">Released Funding</span>
                <h3 className="text-3xl font-black text-textPrimary mt-2">₹{(budgetSummary.totalReleased / 10000000).toFixed(1)} Cr</h3>
              </GlassCard>

              <GlassCard className="text-center">
                <span className="text-xs font-bold text-textSecondary uppercase tracking-wider">Utilized Funding</span>
                <h3 className="text-3xl font-black text-successNeon mt-2">₹{(budgetSummary.totalUtilized / 10000000).toFixed(1)} Cr</h3>
              </GlassCard>
            </div>

            {/* Schemes lists */}
            <GlassCard>
              <h3 className="text-lg font-bold text-textPrimary mb-4">Jurisdiction Allocation Schemes</h3>
              <div className="space-y-6">
                {budgets.map((scheme) => {
                  const utilPercent = (scheme.utilizedAmount / scheme.releasedAmount) * 100;
                  return (
                    <div key={scheme.id} className="p-4 rounded-xl bg-surface border border-glassBorder space-y-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-textPrimary">{scheme.schemeName}</h4>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-accentNeon/10 border border-accentNeon/20 text-[10px] text-accentNeon font-bold">
                            {scheme.authorityType}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-textSecondary uppercase block font-bold">Financial Year</span>
                          <span className="text-xs font-semibold text-textPrimary">{scheme.financialYear}</span>
                        </div>
                      </div>

                      {/* Bar graph utilization */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-textSecondary">Utilization Rate</span>
                          <span className="text-successNeon">{utilPercent.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-3 bg-background dark:bg-gray-700/40 rounded-full overflow-hidden border border-glassBorder">
                          <div 
                            className="h-full bg-successNeon transition-all duration-500" 
                            style={{ width: `${utilPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>
        )}
      </main>
    </div>
  );
};
export default App;
