import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-teal-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Logo and Branding */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 bg-clip-text text-transparent">
            BHISHAK MED
          </h1>
          <p className="text-xl font-semibold mb-3 bg-gradient-to-r from-navy-600 via-teal-600 to-navy-600 bg-clip-text text-transparent">
            Indian Telemedicine
          </p>
          <p className="text-base text-navy-600 max-w-xl mx-auto">
            Connecting You to Care, Anytime, Anywhere.
          </p>
        </div>

        {/* Features - 3 Cards with Circular Icons */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Video Consultations */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-navy-900 mb-2">
                Video Consultations
              </h3>
              <p className="text-navy-600 text-sm">
                High-quality video calls with real-time communication
              </p>
            </div>
          </div>

          {/* Patient Management */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-navy-900 mb-2">
                Patient Management
              </h3>
              <p className="text-navy-600 text-sm">
                Comprehensive patient records and history tracking
              </p>
            </div>
          </div>

          {/* Digital Prescriptions */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-navy-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-navy-900 mb-2">
                Digital Prescriptions
              </h3>
              <p className="text-navy-600 text-sm">
                Generate and share prescriptions instantly
              </p>
            </div>
          </div>
        </div>

        {/* Get Started Section */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-navy-900 mb-6 text-center">
              Get Started
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <Link href="/doctor/login" className="block">
                <button className="w-full bg-primary-500 hover:bg-primary-600 text-white shadow-md hover:shadow-lg px-4 py-2 text-base font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Doctor Login
                </button>
              </Link>

              <Link href="/admin/login" className="block">
                <button className="w-full bg-navy-100 hover:bg-navy-200 text-navy-800 px-4 py-2 text-base font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin Login
                </button>
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-navy-600 mb-4 text-center">New doctor?</p>
              <Link href="/doctor/signup" className="block">
                <button className="bg-teal-500 hover:bg-teal-600 text-white shadow-md hover:shadow-lg px-6 py-3 text-lg font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto mx-auto">
                  Register Now
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 bg-clip-text text-transparent uppercase mb-2">BHISHAK MED</div>
          <p className="text-navy-600 font-medium text-sm mb-3">Indian Telemedicine</p>
          <p className="text-navy-500 text-sm">© 2024 Bhishak Med. Connecting You to Care, Anytime, Anywhere.</p>
        </div>
      </div>
    </main>
  );
}
