import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './state/store';
import { setCredentials } from './state/slices/authSlice';
import { Sidebar } from './components/Sidebar';
import { GlassCard } from './components/GlassCard';
import { TicketTable } from './components/TicketTable';
import { ProofViewer } from './components/ProofViewer';
import { useTicketListController } from './controllers/useTicketListController';
import { usePoWValidationController } from './controllers/usePoWValidationController';
import { useBudgetDashboardController } from './controllers/useBudgetDashboardController';
import { Ticket, WorkOrder } from './types';
import { 
  ShieldAlert, 
  TrendingUp, 
  CheckCircle, 
  Users, 
  Sparkles, 
  Clock, 
  BarChart, 
  HardHat, 
  UploadCloud, 
  FileCheck2 
} from 'lucide-react';

export const App: React.FC = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const currentUser = useSelector((state: RootState) => state.auth.user);

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
  const [inputToken, setInputToken] = useState('developer-jwt-token-claims');

  const handleSimulatedLogin = () => {
    dispatch(setCredentials({ token: inputToken }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      submitProof(e.target.files[0]);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center px-6">
        <GlassCard className="max-w-md w-full p-8 text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white tracking-wider flex items-center justify-center">
              <Sparkles className="text-accentNeon mr-2" /> ROADWATCH
            </h1>
            <p className="text-xs text-gray-400">Govt Grievance & Command Dashboard</p>
          </div>

          <div className="space-y-4 text-left">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                OIDC Credentials Bearer Token
              </label>
              <input
                className="w-full bg-[#0d1325] text-white border border-glassBorder rounded-xl px-4 py-3 outline-none focus:border-accentNeon"
                type="password"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
              />
            </div>
            
            <button
              onClick={handleSimulatedLogin}
              className="w-full py-4 mt-4 bg-accentNeon hover:bg-accentNeon/80 text-white font-bold rounded-xl shadow-lg transition-all"
            >
              Sign In with SSO
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex bg-[#070a13] min-h-screen text-gray-100 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar currentTab={activeTab} setTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto h-screen p-8 space-y-8">
        
        {/* Tab 1: Primary Command Dashboard */}
        {activeTab === 'DASH' && (
          <div className="space-y-8 animate-slide-in">
            <header className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">System Dashboard</h1>
                <p className="text-xs text-gray-400 mt-1">Jurisdiction Circle: {currentUser?.jurisdiction_id}</p>
              </div>
            </header>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <GlassCard className="flex items-center space-x-4">
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <ShieldAlert className="text-red-400" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">{tickets.length}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active Complaints</div>
                </div>
              </GlassCard>

              <GlassCard className="flex items-center space-x-4">
                <div className="p-3 bg-accentNeon/10 border border-accentNeon/20 rounded-xl">
                  <TrendingUp className="text-accentNeon" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">96.4%</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">SLA compliance</div>
                </div>
              </GlassCard>

              <GlassCard className="flex items-center space-x-4">
                <div className="p-3 bg-successNeon/10 border border-successNeon/20 rounded-xl">
                  <CheckCircle className="text-successNeon" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">412</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Resolved Tickets</div>
                </div>
              </GlassCard>

              <GlassCard className="flex items-center space-x-4">
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <Users className="text-yellow-400" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">12</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active Contractors</div>
                </div>
              </GlassCard>
            </div>

            {/* Quick overview panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Core active list */}
              <div className="lg:col-span-2 space-y-4">
                <GlassCard>
                  <h3 className="text-lg font-bold text-white mb-4">Grievance Backlog</h3>
                  <TicketTable tickets={tickets.slice(0, 3)} onSelect={setSelectedTicket} />
                </GlassCard>
              </div>

              {/* Quick AI Validation Tracker */}
              <GlassCard className="flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <HardHat className="mr-2 text-accentNeon" /> AI PoW Validation
                  </h3>
                  {workOrder ? (
                    <div className="space-y-4">
                      <div className="text-sm font-semibold text-white">{workOrder.description}</div>
                      <div className="text-xs text-gray-400">Order ID: {workOrder.id}</div>
                      <div className="flex items-center justify-between text-xs py-2 border-t border-glassBorder mt-2">
                        <span>Current Status:</span>
                        <span className="font-bold text-accentNeon">{workOrder.status}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">No active work orders.</span>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-glassBorder">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block mb-2">Proof Upload (Simulation)</span>
                  <input
                    type="file"
                    id="pow-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <label
                    htmlFor="pow-upload"
                    className="flex justify-center items-center p-3 border border-dashed border-glassBorder rounded-xl hover:border-accentNeon cursor-pointer text-xs transition-all text-gray-400 hover:text-white"
                  >
                    <UploadCloud className="mr-2" size={16} /> Upload Repair proof
                  </label>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {/* Tab 2: Detailed Grievance List */}
        {activeTab === 'TICKETS' && (
          <div className="space-y-6 animate-slide-in">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Grievance List</h1>
              <p className="text-xs text-gray-400 mt-1">Audit, assign, and escalate incoming reports</p>
            </div>

            <div className="flex justify-between items-center space-x-4 mb-4">
              <input
                className="flex-1 max-w-sm bg-glassBg text-white border border-glassBorder rounded-xl px-4 py-3 outline-none focus:border-accentNeon text-xs"
                placeholder="Search ticket number or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <GlassCard>
              <TicketTable tickets={tickets} onSelect={setSelectedTicket} />
            </GlassCard>
          </div>
        )}

        {/* Tab 3: Work Order Issuance & Contractor Management */}
        {activeTab === 'WORKORDERS' && (
          <div className="space-y-6 animate-slide-in">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Contractor Portal</h1>
              <p className="text-xs text-gray-400 mt-1">Verify submitted road repairs side-by-side with Computer Vision metrics</p>
            </div>

            {workOrder ? (
              <GlassCard className="space-y-4">
                <div className="flex justify-between items-center border-b border-glassBorder pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">{workOrder.description}</h2>
                    <p className="text-xs text-gray-400 mt-1">Target Ticket: {workOrder.ticketId} | Contractor: {workOrder.contractorId}</p>
                  </div>
                  {workOrder.status === 'SUBMITTED' && (
                    <button
                      onClick={approveWork}
                      className="px-6 py-2.5 bg-successNeon hover:bg-successNeon/80 text-white font-bold rounded-xl text-xs flex items-center shadow-lg shadow-successNeon/20"
                    >
                      <FileCheck2 className="mr-2" size={16} /> Approve & Release Funds
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-6 py-2">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Estimated Cost</span>
                    <span className="text-lg font-black text-white">₹{workOrder.estimatedCost}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Assigned By</span>
                    <span className="text-sm font-semibold text-gray-300">{workOrder.assignedBy}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Status</span>
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
              <GlassCard className="p-8 text-center text-gray-500">
                No active work order found.
              </GlassCard>
            )}
          </div>
        )}

        {/* Tab 4: Open Budgets Explorer */}
        {activeTab === 'BUDGET' && (
          <div className="space-y-6 animate-slide-in">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Public Budgets Explorer</h1>
              <p className="text-xs text-gray-400 mt-1">Financial audit metrics for scheme allocations</p>
            </div>

            {/* Overall summary bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GlassCard className="text-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sanctioned Funding</span>
                <h3 className="text-3xl font-black text-white mt-2">₹{(budgetSummary.totalSanctioned / 10000000).toFixed(1)} Cr</h3>
              </GlassCard>

              <GlassCard className="text-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Released Funding</span>
                <h3 className="text-3xl font-black text-white mt-2">₹{(budgetSummary.totalReleased / 10000000).toFixed(1)} Cr</h3>
              </GlassCard>

              <GlassCard className="text-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Utilized Funding</span>
                <h3 className="text-3xl font-black text-successNeon mt-2">₹{(budgetSummary.totalUtilized / 10000000).toFixed(1)} Cr</h3>
              </GlassCard>
            </div>

            {/* Schemes lists */}
            <GlassCard>
              <h3 className="text-lg font-bold text-white mb-4">Jurisdiction Allocation Schemes</h3>
              <div className="space-y-6">
                {budgets.map((scheme) => {
                  const utilPercent = (scheme.utilizedAmount / scheme.releasedAmount) * 100;
                  return (
                    <div key={scheme.id} className="p-4 rounded-xl bg-[#10162A]/60 border border-glassBorder space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-white">{scheme.schemeName}</h4>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-accentNeon/20 border border-accentNeon/30 text-[10px] text-accentNeon font-bold">
                            {scheme.authorityType}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 uppercase block font-bold">Financial Year</span>
                          <span className="text-xs font-semibold text-white">{scheme.financialYear}</span>
                        </div>
                      </div>

                      {/* Bar graph utilization */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-400">Utilization Rate</span>
                          <span className="text-successNeon">{utilPercent.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-3 bg-gray-700/40 rounded-full overflow-hidden border border-glassBorder">
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
