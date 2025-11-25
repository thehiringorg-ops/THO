import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { ArrowRight, Globe, Mail, Lock, Loader2, AlertCircle, UserPlus, User as UserIcon, Building2, Hash, ArrowLeft, CheckCircle, HelpCircle, Briefcase, Shield } from 'lucide-react';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
  onRegister: (user: User) => void;
  onPublicView: () => void;
  onClientPortal: () => void;
}

type LoginStep = 'login' | 'register';

const Login: React.FC<LoginProps> = ({ users, onLogin, onRegister, onPublicView, onClientPortal }) => {
  const [loginStep, setLoginStep] = useState<LoginStep>('login');
  const [successMessage, setSuccessMessage] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [staffNumber, setStaffNumber] = useState('');
  const [requestedRole, setRequestedRole] = useState<UserRole>('Recruiter');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    setTimeout(() => {
      if (loginStep === 'register') {
          // Registration Logic
          if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
              setError('An account with this email already exists.');
              setIsLoading(false);
              return;
          }

          if (users.find(u => u.staffNumber === staffNumber)) {
              setError('This staff number is already in use.');
              setIsLoading(false);
              return;
          }

          const newUser: User = {
              id: `u-${Date.now()}`,
              staffNumber,
              name,
              email,
              password,
              role: requestedRole, 
              status: 'Pending', // Default to Pending for Admin Approval
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
              permissions: []
          };
          
          onRegister(newUser);
          setIsLoading(false);
          setSuccessMessage("Registration successful! Your account is pending admin approval. You will be notified once active.");
          // Reset form but stay on sign up screen or move to sign in with success message
          setName('');
          setEmail('');
          setPassword('');
          setStaffNumber('');
          setLoginStep('login'); // Switch back to login view
      } else {
          // Login Logic
          const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

          if (user) {
             // Check Staff Number
             if (user.staffNumber !== staffNumber) {
                 setError('Invalid Staff ID for this account.');
                 setIsLoading(false);
                 return;
             }

             // Check Password (matches stored password or default 'password')
             const storedPass = user.password || 'password';
             if (password === storedPass) {
                 if (user.status === 'Pending') {
                     setError('Your account is still pending approval. Please contact your administrator.');
                     setIsLoading(false);
                     return;
                 }
                 if (user.status === 'Frozen' || user.status === 'Rejected') {
                     setError(`Your account has been ${user.status.toLowerCase()}. Access denied.`);
                     setIsLoading(false);
                     return;
                 }
                 onLogin(user);
             } else {
                 setError('Invalid password.');
                 setIsLoading(false);
             }
          } else {
             setError('No account found with this email address.');
             setIsLoading(false);
          }
      }
    }, 1500);
  };

  const handleGoogleLogin = () => {
      setIsGoogleLoading(true);
      setError('');
      
      setTimeout(() => {
          // Simulate Google returning a SuperAdmin for demo
          const user = users.find(u => u.role === 'SuperAdmin'); 
          
          if(user) {
              onLogin(user);
          } else {
              setIsGoogleLoading(false);
              setError("Access Denied: Google Sign-In is restricted to Super Administrators.");
          }
      }, 2000);
  };

  // --- STAFF LOGIN FORM ---
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative">
      
      {/* Forgot Password Modal */}
      {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                  <div className="p-6 text-center">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <HelpCircle size={32} className="text-orange-600"/>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Forgot Password?</h3>
                      <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                          For security reasons, password resets must be performed by a System Administrator.
                          <br/><br/>
                          Please contact your <strong>Admin</strong> or <strong>Line Manager</strong> to request a temporary password reset.
                      </p>
                      <button 
                          onClick={() => setShowResetModal(false)}
                          className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-black transition-colors"
                      >
                          Close
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl shadow-2xl overflow-hidden min-h-[600px]">
        
        {/* Left Side: Branding */}
        <div className="bg-slate-800 p-12 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-orange-500 blur-3xl"></div>
             <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-blue-500 blur-3xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center overflow-hidden p-1 mb-6 shadow-lg">
                <img 
                  src="https://cdn1.site-media.eu/images/0/18949945/SlateBlueTHOlogo-YALN5aQrIMvAv5iD9degXQ.png" 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                />
            </div>
            <h1 className="text-4xl font-bold mb-2">The Hiring Org</h1>
            <p className="text-slate-400 text-lg">Recruitment OS & Staff Portal</p>
            
            <div className="mt-12 space-y-6">
                <div className="flex items-start gap-4 opacity-90">
                    <div className="p-2 bg-white/10 rounded-lg"><UserPlus size={20} className="text-green-400"/></div>
                    <div>
                        <h3 className="font-bold text-sm">Smart Recruitment</h3>
                        <p className="text-xs text-slate-400 leading-relaxed mt-1">AI-powered screening and pipeline management.</p>
                    </div>
                </div>
                <div className="flex items-start gap-4 opacity-90">
                    <div className="p-2 bg-white/10 rounded-lg"><Building2 size={20} className="text-blue-400"/></div>
                    <div>
                        <h3 className="font-bold text-sm">Client Portfolios</h3>
                        <p className="text-xs text-slate-400 leading-relaxed mt-1">Manage client relationships and financials.</p>
                    </div>
                </div>
            </div>
          </div>

          <div className="relative z-10 mt-auto pt-8">
             <p className="text-xs text-slate-500">© 2024 The Hiring Org. Secure System.</p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-12 flex flex-col justify-center bg-white animate-fadeIn relative">
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">{loginStep === 'register' ? 'Create Staff Account' : 'Staff Sign In'}</h2>
            <p className="text-slate-500 mt-1">
                {loginStep === 'register' ? 'Join your team.' : 'Welcome back! Please enter your credentials.'}
            </p>
          </div>

          {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-start gap-3 animate-fadeIn">
                  <CheckCircle size={20} className="mt-0.5 flex-shrink-0"/>
                  <p className="text-sm">{successMessage}</p>
              </div>
          )}

          {error && (
             <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg flex items-center gap-2 animate-fadeIn">
                 <AlertCircle size={16} /> {error}
             </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {loginStep === 'register' && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                        <input 
                            type="text" 
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. John Doe"
                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                        />
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Staff ID <span className="text-red-500">*</span></label>
                <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                    <input 
                        type="text" 
                        required
                        value={staffNumber}
                        onChange={(e) => setStaffNumber(e.target.value)}
                        placeholder="e.g. STF-001"
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                </div>
            </div>
            
            {loginStep === 'register' && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Requested Role</label>
                    <select 
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                        value={requestedRole}
                        onChange={(e) => setRequestedRole(e.target.value as UserRole)}
                    >
                        <option value="Recruiter">Recruiter (Talent Consultant)</option>
                        <option value="Hiring Manager">Hiring Manager</option>
                        <option value="Admin">Administrator</option>
                    </select>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                    <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={loginStep === 'register' ? "Create a password" : "Enter your password"}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                </div>
            </div>
            
            {loginStep === 'login' && (
                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded text-orange-500 focus:ring-orange-500"/>
                        <span className="text-slate-600">Remember me</span>
                    </label>
                    <button type="button" onClick={() => setShowResetModal(true)} className="text-orange-600 font-medium hover:text-orange-700">Forgot password?</button>
                </div>
            )}

            <button 
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-black transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isLoading ? <Loader2 className="animate-spin" size={20}/> : (loginStep === 'register' ? "Request Account" : "Sign In")}
            </button>
          </form>

          <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">Super Administrators</span>
              </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
            className="w-full py-3 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
          >
              {isGoogleLoading ? (
                  <Loader2 className="animate-spin text-slate-600" size={20}/>
              ) : (
                <>
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5"/>
                    <span>Sign in with Google (Super Admin)</span>
                </>
              )}
          </button>

          <p className="mt-8 text-center text-sm text-slate-600">
              {loginStep === 'register' ? "Already have an account?" : "Don't have an account?"}{" "}
              <button 
                onClick={() => { setLoginStep(loginStep === 'register' ? 'login' : 'register'); setError(''); setSuccessMessage(''); }}
                className="text-orange-600 font-bold hover:text-orange-700 hover:underline"
              >
                  {loginStep === 'register' ? "Sign In" : "Sign Up"}
              </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;