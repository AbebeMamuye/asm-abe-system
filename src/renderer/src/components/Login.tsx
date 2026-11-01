import React, { useState, useEffect } from 'react'
import {
  ArrowRight,
  KeyRound,
  X,
  AlertCircle,
  Shield,
  Phone,
  Lock,
  Sparkles,
  CheckCircle2
} from 'lucide-react'
import { useStore, TRANSLATIONS } from '../store/useStore'
import asmLogo from '../assets/asm-logo.jpg'

const Login = () => {
  const { login, changePassword, language, setLanguage, orgName, orgTagline, fetchSystemSettings } = useStore()
  const t = TRANSLATIONS[language]

  // Fetch org branding from server DB on mount (works before login)
  useEffect(() => {
    fetchSystemSettings().catch(() => {})
  }, [])

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)

  // First-time mandatory password change state
  const [showForceChangeModal, setShowForceChangeModal] = useState(false)
  const [pendingUser, setPendingUser] = useState<any>(null)
  const [currentPasswordInput, setCurrentPasswordInput] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changeError, setChangeError] = useState('')
  const [changeSuccess, setChangeSuccess] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const success = await login(username, password)
      if (!success) {
        setError(language === 'AM' ? 'ስልክ ቁጥር ወይም የይለፍ ቃል የተሳሳተ ነው!' : t.loginError)
      } else {
        // Check if user requires mandatory initial password reset
        const currentUser = useStore.getState().user
        if (currentUser && currentUser.forcePasswordChange === 1) {
          setPendingUser(currentUser)
          setCurrentPasswordInput(password) // pre-populate with what they just typed
          setShowForceChangeModal(true)
        }
      }
    } catch {
      setError('System error during login.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Mandatory First-Time Password Reset
  const handleForcePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setChangeError('')

    if (!currentPasswordInput) {
      setChangeError(language === 'AM' ? 'እባክዎ አሁን የገቡበትን ነባሪ የይለፍ ቃል ያስገቡ!' : 'Please enter your current temporary password!')
      return
    }

    if (newPassword.length < 6) {
      setChangeError(language === 'AM' ? 'አዲሱ የይለፍ ቃል ቢያንስ 6 ፊደላት/ቁጥሮች መሆን አለበት!' : 'New password must be at least 6 characters!')
      return
    }

    if (newPassword === currentPasswordInput) {
      setChangeError(language === 'AM' ? 'አዲሱ የይለፍ ቃል ከነባሪው የተለየ መሆን አለበት!' : 'New password must be different from current temporary password!')
      return
    }

    if (newPassword !== confirmPassword) {
      setChangeError(language === 'AM' ? 'አዲሶቹ የይለፍ ቃሎች አይመሳሰሉም!' : 'New passwords do not match!')
      return
    }

    if (pendingUser?.id) {
      const success = await changePassword(pendingUser.id, newPassword)
      if (success) {
        setChangeSuccess(language === 'AM' ? 'የይለፍ ቃልዎ በተሳካ ሁኔታ ተቀይሯል! ወደ ሲስተሙ በመግባት ላይ...' : 'Password updated successfully! Entering AMIS...')
        useStore.setState({
          user: { ...pendingUser, forcePasswordChange: 0 }
        })
        setTimeout(() => {
          setShowForceChangeModal(false)
        }, 1200)
      } else {
        setChangeError('Failed to update password')
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 md:p-6 relative overflow-hidden font-sans">
      {/* Background Animated Gradient Circles */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl flex flex-col lg:flex-row bg-slate-950/80 backdrop-blur-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-800 relative z-10 animate-in zoom-in-95 duration-500 min-h-[680px]">

        {/* Left Branding Panel (AMIS Portal Showcase) */}
        <div className="lg:w-1/2 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950">
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-xl shadow-blue-600/30 flex items-center justify-center">
                <img src={asmLogo} alt="ASM Logo" className="w-full h-full object-contain rounded-xl" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-black uppercase tracking-widest border border-blue-500/20">
                <Sparkles size={12} />
                <span>ASM • AMIS</span>
              </div>
            </div>

            <div>
              <h1 className="text-3xl lg:text-4xl font-black leading-tight tracking-tight uppercase">
                {orgName && !orgName.includes('የአዲስ አበባ ከተማ አስተዳደር')
                  ? orgName
                  : (language === 'AM' ? 'የንብረት አስተዳደር መቆጣጠሪያ ስርዓት' : 'Asset Management System')}
              </h1>
              <p className="text-blue-400 font-bold text-sm mt-1 uppercase tracking-wider">
                {orgTagline || (language === 'AM' ? 'AMIS — ኃላፊነት፣ ግልፅነት እና ቁጥጥር!' : 'Public Property Administration Authority')}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/10">
                <Shield size={18} className="text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300">
                  <span className="font-bold text-white block">
                    {language === 'AM' ? 'ሃላፊነት፣ ግልፅነት እና ቁጥጥር' : 'Accountability, Transparency & Control'}
                  </span>
                  {language === 'AM'
                    ? 'የመንግስት ቋሚ እና አላቂ ንብረቶችን ከግዢ እስከ ማስወገድ በዲጂታል QR መለያ የሚቆጣጠር ሲስተም።'
                    : 'End-to-end digital lifecycle governance for public fixed and consumable assets.'}
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/10">
                <KeyRound size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300">
                  <span className="font-bold text-white block">
                    {language === 'AM' ? 'የመግቢያ መለያ' : 'Primary Identifier'}
                  </span>
                  {language === 'AM'
                    ? 'በተጠቃሚ ስም (Username)፣ በስልክ ቁጥር ወይም በኢሜይል መግባት ይችላሉ።'
                    : 'Sign in using your username, registered mobile phone number, or email.'}
                </div>
              </div>
            </div>
          </div>

          {/* Secure Production Portal Footer */}
          <div className="relative z-10 pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between text-slate-400 text-xs">
            <div className="flex items-center gap-2">
              <Lock size={14} className="text-blue-400" />
              <span className="font-medium text-[11px]">
                {language === 'AM' ? 'የተጠበቀ የመንግስት ንብረት አስተዳደር ፖርታል' : 'Secure Enterprise Property Management Portal'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 font-bold">v2.0</span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:w-1/2 p-8 md:p-12 lg:p-14 flex flex-col justify-center relative bg-slate-900/60">

          {/* Language Toggle */}
          <div className="absolute top-8 right-8 flex gap-1 p-1 bg-slate-800 rounded-xl border border-slate-700">
            <button
              id="login-lang-en"
              onClick={() => setLanguage('EN')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                language === 'EN' ? 'bg-blue-600 shadow-sm text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              id="login-lang-am"
              onClick={() => setLanguage('AM')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                language === 'AM' ? 'bg-blue-600 shadow-sm text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              አማርኛ
            </button>
          </div>

          <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-md w-full mx-auto">
            <div className="mb-8 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-lg flex items-center justify-center shrink-0">
                <img src={asmLogo} alt="ASM" className="w-full h-full object-contain rounded-xl" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white">
                  {language === 'AM' ? 'ይግቡ (Sign In)' : 'ASM Sign In'}
                </h2>
                <p className="text-slate-400 font-medium text-xs mt-1.5">
                  {language === 'AM'
                    ? 'ወደ ንብረት አስተዳደር ሲስተም ለመግባት መለያዎን ያስገቡ'
                    : 'Enter your phone number or email to access the asset portal.'}
                </p>
              </div>
            </div>

            <form id="login-form" onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Phone size={13} className="text-blue-400" />
                  <span>{language === 'AM' ? 'የተጠቃሚ ስም፣ ስልክ ቁጥር ወይም ኢሜይል *' : 'Username, Phone Number or Email *'}</span>
                </label>
                <input
                  id="input-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-slate-500"
                  placeholder={language === 'AM' ? 'AbeTech ወይም ስልክ / ኢሜይል' : 'AbeTech, phone or email'}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Lock size={13} className="text-blue-400" />
                  <span>{language === 'AM' ? 'የይለፍ ቃል *' : 'Password *'}</span>
                </label>
                <input
                  id="input-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-slate-500"
                  placeholder="••••••••••••"
                  required
                />
              </div>

              <div className="flex justify-end items-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                >
                  {t.forgotPassword}
                </button>
              </div>

              {error && (
                <div className="text-xs font-bold text-red-400 bg-red-950/40 p-3.5 rounded-xl border border-red-800/60 flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                id="btn-login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 transition-all flex items-center justify-center gap-2 group cursor-pointer mt-2"
              >
                {isLoading ? (
                  <span>{language === 'AM' ? 'በማረጋገጥ ላይ...' : 'Authenticating...'}</span>
                ) : (
                  <>
                    <span>{language === 'AM' ? 'ይግቡ (Sign In)' : 'Sign In'}</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Mandatory First-Time Password Change Modal (ከቪዲዮው ክፍል 1 እንደተገለጸው) */}
      {showForceChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 rounded-[2.5rem] max-w-md w-full p-8 shadow-2xl border border-slate-700 relative animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="bg-amber-500/20 text-amber-400 p-4 rounded-2xl mb-4 border border-amber-500/30">
                <KeyRound size={32} className="animate-pulse" />
              </div>

              <h3 className="text-xl font-black text-white mb-1">
                {language === 'AM' ? 'የመጀመሪያ ጊዜ የይለፍ ቃል መቀየሪያ' : 'Mandatory Password Reset'}
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                {language === 'AM'
                  ? 'እንኳን ደህና መጡ! በደህንነት መመሪያው መሰረት ጊዜያዊ የይለፍ ቃልዎን ወደ እርስዎ ሚስጥራዊ የይለፍ ቃል ይቀይሩ።'
                  : 'Welcome! For security compliance, please replace your temporary password with a secure password.'}
              </p>

              <form onSubmit={handleForcePasswordSubmit} className="w-full space-y-4 text-left">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                    {language === 'AM' ? 'አሁን የገቡበት ጊዜያዊ የይለፍ ቃል *' : 'Current Temporary Password *'}
                  </label>
                  <input
                    id="input-current-password"
                    type="password"
                    value={currentPasswordInput}
                    onChange={(e) => setCurrentPasswordInput(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3.5 text-xs text-white focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder={language === 'AM' ? 'ጊዜያዊ የይለፍ ቃልዎን ያስገቡ' : 'Enter temporary password'}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                    {language === 'AM' ? 'አዲስ ቋሚ የይለፍ ቃል (New Permanent Password) *' : 'New Permanent Password *'}
                  </label>
                  <input
                    id="input-new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3.5 text-xs text-white focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder={language === 'AM' ? 'ቢያንስ 6 ፊደላት ወይም ቁጥሮች' : 'Minimum 6 characters'}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                    {language === 'AM' ? 'አዲሱን የይለፍ ቃል ያረጋግጡ (Confirm Password) *' : 'Confirm New Password *'}
                  </label>
                  <input
                    id="input-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3.5 text-xs text-white focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder={language === 'AM' ? 'አዲሱን የይለፍ ቃል ድጋሚ ያስገቡ' : 'Re-enter new password'}
                    required
                  />
                </div>

                {changeError && (
                  <p className="text-xs font-bold text-red-400 bg-red-950/40 p-3 rounded-xl border border-red-800/60">
                    {changeError}
                  </p>
                )}

                {changeSuccess && (
                  <p className="text-xs font-bold text-emerald-400 bg-emerald-950/40 p-3 rounded-xl border border-emerald-800/60 flex items-center gap-1.5">
                    <CheckCircle2 size={15} />
                    <span>{changeSuccess}</span>
                  </p>
                )}

                <button
                  id="btn-submit-force-change"
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/30 transition-all cursor-pointer mt-2"
                >
                  {language === 'AM' ? 'የይለፍ ቃሌን ቀይርና ግባ' : 'Save New Password & Continue'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 rounded-[2.5rem] max-w-md w-full p-8 shadow-2xl border border-slate-700 relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-500/20 text-blue-400 p-4 rounded-2xl mb-4 border border-blue-500/30">
                <Shield size={32} />
              </div>

              <h3 className="text-xl font-black text-white mb-2">{t.forgotPassword}</h3>

              <div className="bg-slate-800/60 p-4 rounded-2xl text-left border border-slate-700/60 mb-6">
                <p className="text-xs font-medium leading-relaxed text-slate-300">
                  {language === 'AM'
                    ? 'የይለፍ ቃልዎን ከረሱ፣ እባክዎ ለተቋምዎ ሲስተም አድሚን (0923000001) ወይም ለዋናው ንብረት አስተዳደር ቢሮ በማሳወቅ እንዲስተካከልልዎ ይጠይቁ።'
                    : t.forgotPasswordInstructions}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                {language === 'AM' ? 'እሺ ገብቶኛል' : 'Okay, I understand'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login
