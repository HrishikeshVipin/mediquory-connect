import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-48 -right-48 w-96 h-96 bg-gradient-cosmic opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-48 -left-48 w-80 h-80 bg-gradient-sunset opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* Decorative Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 w-32 h-32 border-2 border-cyan-200 rounded-full opacity-20"></div>
        <div className="absolute bottom-1/3 right-20 w-24 h-24 border-2 border-amber-200 rounded-full opacity-20"></div>
      </div>

      {/* Navigation */}
      <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-2xl font-bold text-gradient uppercase tracking-tight">BHISHAK MED</div>
            <p className="text-xs text-slate-600 font-medium">Indian Telemedicine</p>
          </div>
          <div className="flex gap-4">
            <Link href="/doctor/login" className="px-6 py-2.5 rounded-xl font-semibold text-cyan-600 hover:bg-cyan-50 transition-all">
              Sign In
            </Link>
            <Link href="/doctor/signup" className="btn-modern btn-cosmic">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Content */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-100 text-cyan-700 font-medium text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              Platform live • Doctors verified daily
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">
              <span className="text-gradient uppercase tracking-tight">BHISHAK MED</span>
            </h1>
            <p className="text-2xl md:text-3xl font-semibold text-slate-700 mb-3">
              Indian Telemedicine
            </p>

            <p className="text-lg md:text-xl text-cyan-700 font-medium max-w-2xl mx-auto mb-8 leading-relaxed">
              Connecting You to Care, Anytime, Anywhere.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link href="/doctor/signup" className="btn-modern btn-cosmic px-8 py-3">
                Start Free Trial →
              </Link>
              <Link href="/admin/login" className="btn-modern btn-sunset px-8 py-3">
                Admin Portal
              </Link>
            </div>

            <p className="text-sm text-slate-500 mt-5">
              14-day free trial • No credit card required • 2 free patients
            </p>
          </div>

          {/* Bento Grid - Portals & Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {/* Doctor Portal - Large Card */}
            <div className="md:col-span-2 card-elevated group" style={{ animationDelay: '0.1s' }}>
              <div className="flex flex-col md:flex-row gap-8 h-full">
                <div className="flex-1">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-cosmic mb-6">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">
                    For Doctors
                  </h2>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    Complete practice management platform. Video consultations, patient records, digital prescriptions, and more.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/doctor/signup" className="btn-modern btn-ocean">
                      Register Now →
                    </Link>
                    <Link href="/doctor/login" className="px-6 py-3 rounded-xl border-2 border-cyan-200 text-cyan-700 font-semibold hover:bg-cyan-50 transition-all text-center">
                      Sign In
                    </Link>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-full md:w-48 h-48 rounded-2xl bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center">
                    <svg className="w-24 h-24 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Portal - Compact Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-8 group" style={{ animationDelay: '0.2s' }}>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-sunset mb-6">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Admin Control
              </h3>
              <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                Verify doctors, manage KYC, monitor platform analytics.
              </p>
              <Link href="/admin/login" className="inline-flex items-center text-amber-600 font-semibold hover:text-amber-700 transition-colors">
                Access Portal
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="max-w-6xl mx-auto mb-16">
            <div className="text-center mb-12">
              <h3 className="text-4xl font-bold text-slate-900 mb-3">
                Everything you need
              </h3>
              <p className="text-lg text-slate-600">
                Built for modern healthcare professionals
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Video Consultation */}
              <div className="bg-white border border-cyan-200 p-6 rounded-2xl hover:border-cyan-400 transition-colors">
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">
                  HD Video Calls
                </h4>
                <p className="text-slate-600 text-sm">
                  Crystal-clear consultations powered by Agora with real-time chat.
                </p>
              </div>

              {/* Doctor Verification */}
              <div className="bg-white border border-emerald-200 p-6 rounded-2xl hover:border-emerald-400 transition-colors">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">
                  Verified Doctors
                </h4>
                <p className="text-slate-600 text-sm">
                  Manual verification of licenses, certificates, and credentials.
                </p>
              </div>

              {/* Digital Prescriptions */}
              <div className="bg-white border border-blue-200 p-6 rounded-2xl hover:border-blue-400 transition-colors">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">
                  Digital Prescriptions
                </h4>
                <p className="text-slate-600 text-sm">
                  Professional PDF prescriptions with automatic formatting.
                </p>
              </div>

              {/* Patient Management */}
              <div className="bg-white border border-amber-200 p-6 rounded-2xl hover:border-amber-400 transition-colors">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">
                  Patient Management
                </h4>
                <p className="text-slate-600 text-sm">
                  Complete patient records & vitals tracking
                </p>
              </div>

              {/* Secure Payments */}
              <div className="bg-white border border-orange-200 p-6 rounded-2xl hover:border-orange-400 transition-colors">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">
                  Secure Payments
                </h4>
                <p className="text-slate-600 text-sm">
                  Direct UPI payments with verification
                </p>
              </div>

              {/* 14-Day Trial */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl">
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">
                  14-Day Free Trial
                </h4>
                <p className="text-slate-600 text-sm">
                  Test all features before subscribing
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="max-w-5xl mx-auto mb-16">
            <div className="bg-gradient-to-br from-cyan-600 via-teal-500 to-cyan-700 rounded-2xl p-12 text-center">
              <h3 className="text-4xl font-bold text-white mb-4">
                Start Your Journey Today
              </h3>
              <p className="text-cyan-100 text-lg mb-8 max-w-2xl mx-auto">
                Join the future of telemedicine. 14-day free trial with full access to all features.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/doctor/signup" className="px-8 py-3 bg-white text-cyan-700 rounded-xl hover:bg-amber-50 font-semibold transition-all">
                  Start Free Trial
                </Link>
                <Link href="/doctor/login" className="px-8 py-3 border-2 border-white text-white rounded-xl hover:bg-white/10 font-semibold transition-all">
                  Sign In
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-32 mb-12 text-center">
            <div className="flex items-center justify-center gap-8 mb-8">
              <Link href="/doctor/login" className="text-slate-600 hover:text-cyan-600 transition-colors font-medium">
                Doctor Portal
              </Link>
              <Link href="/admin/login" className="text-slate-600 hover:text-amber-600 transition-colors font-medium">
                Admin Portal
              </Link>
              <Link href="/doctor/signup" className="text-slate-600 hover:text-cyan-600 transition-colors font-medium">
                Sign Up
              </Link>
            </div>
            <div className="text-2xl font-bold text-gradient uppercase mb-2">BHISHAK MED</div>
            <p className="text-slate-600 font-medium text-sm mb-3">Indian Telemedicine</p>
            <p className="text-slate-500 text-sm">© 2024 Bhishak Med. Connecting You to Care, Anytime, Anywhere.</p>
          </div>
        </div>
    </main>
  );
}
