'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useState, useRef } from 'react';

// Dynamic import for Three.js scene (client-side only)
const Medical3DScene = dynamic(() => import('@/components/Medical3DScene'), {
  ssr: false,
});

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mouse tracking for interactive elements
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Interactive particle network canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }> = [];

    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
      });
    }

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.fill();
      });

      // Draw connections
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(6, 182, 212, ${0.2 * (1 - distance / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/40">
      {/* 3D Medical Objects Scene */}
      <Medical3DScene />

      {/* Interactive Particle Network Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none opacity-60"
      />

      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Floating Gradient Orbs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-blob" />
      <div className="absolute top-40 right-10 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-gradient-to-br from-cyan-300/20 to-blue-300/20 rounded-full blur-3xl animate-blob animation-delay-4000" />

      {/* Mouse Follow Gradient */}
      <div
        className="absolute w-[600px] h-[600px] bg-gradient-radial from-cyan-200/30 via-blue-200/20 to-transparent rounded-full blur-2xl pointer-events-none transition-all duration-700 ease-out"
        style={{
          left: mousePosition.x - 300,
          top: mousePosition.y - 300,
        }}
      />

      {/* Floating Medical Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          { icon: '💊', top: '10%', left: '15%', delay: 0 },
          { icon: '🏥', top: '20%', right: '20%', delay: 1 },
          { icon: '🩺', bottom: '30%', left: '10%', delay: 2 },
          { icon: '💉', top: '60%', right: '15%', delay: 3 },
          { icon: '🔬', bottom: '15%', right: '25%', delay: 4 },
        ].map((item, i) => (
          <div
            key={i}
            className="absolute text-4xl opacity-10 animate-float-slow"
            style={{
              ...item,
              animationDelay: `${item.delay}s`,
              transform: `translateY(${Math.sin(scrollY * 0.01 + i) * 20}px)`,
            }}
          >
            {item.icon}
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        {/* Header - Logo and Branding */}
        <div className="text-center mb-20 animate-fade-in-up">
          {/* Logo with Parallax Effect */}
          <div
            className="inline-flex items-center justify-center mb-8 group"
            style={{
              transform: `translateY(${scrollY * 0.1}px)`,
            }}
          >
            <div className="relative">
              {/* Animated Rings */}
              <div className="absolute -inset-8 rounded-full animate-ping-slow">
                <div className="absolute inset-0 border-2 border-cyan-400/30 rounded-full" />
              </div>
              <div className="absolute -inset-8 rounded-full animate-ping-slow animation-delay-1000">
                <div className="absolute inset-0 border-2 border-blue-400/30 rounded-full" />
              </div>

              {/* Actual Logo Image */}
              <div className="relative group-hover:scale-110 transition-transform duration-500">
                <img
                  src="/logo.png"
                  alt="Mediquory Connect Logo"
                  className="w-48 h-auto drop-shadow-2xl"
                />
              </div>
            </div>
          </div>

          <h1 className="text-7xl md:text-8xl font-black mb-6 bg-gradient-to-r from-blue-900 via-cyan-600 to-blue-900 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto] drop-shadow-sm">
            MEDIQUORY CONNECT
          </h1>
          <div className="inline-block px-6 py-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full border border-cyan-500/20 backdrop-blur-sm mb-4">
            <p className="text-xl font-semibold text-blue-900 tracking-wide">
              Next-Generation Telemedicine Platform
            </p>
          </div>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
            Experience the future of healthcare. Connect with certified medical professionals instantly through our advanced telehealth ecosystem.
          </p>
        </div>

        {/* Features Grid - Glassmorphic Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {[
            {
              icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
              title: 'HD Video Consultations',
              description: 'Crystal-clear video calls with real-time diagnostics and seamless communication',
              gradient: 'from-cyan-500 to-blue-600',
            },
            {
              icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
              title: 'Smart Health Records',
              description: 'Secure medical records with intelligent analysis and instant access anywhere',
              gradient: 'from-blue-500 to-cyan-600',
            },
            {
              icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
              title: 'Digital Prescriptions',
              description: 'Instant e-prescriptions with drug interaction alerts and pharmacy integration',
              gradient: 'from-cyan-500 to-blue-600',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="group relative bg-white/60 backdrop-blur-xl border border-cyan-200/50 rounded-3xl p-8 hover:bg-white/80 hover:border-cyan-400/60 hover:scale-105 hover:-translate-y-2 transition-all duration-500 shadow-lg shadow-cyan-500/10 hover:shadow-2xl hover:shadow-cyan-500/20"
              style={{
                animationDelay: `${i * 100}ms`,
              }}
            >
              {/* Animated Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative">
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl mb-6 shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-500/50 group-hover:scale-110 transition-all duration-500`}>
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-blue-900 mb-3 group-hover:text-cyan-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 group-hover:text-gray-700 transition-colors leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Corner Accent */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-400/20 to-transparent rounded-tr-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>

        {/* CTA Section - Split for Patients and Doctors */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 mb-20">
          {/* Patient Portal */}
          <div className="relative bg-gradient-to-br from-white/80 to-cyan-50/80 backdrop-blur-2xl border border-cyan-300/50 rounded-3xl p-10 shadow-2xl shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-500 group">
            {/* Decorative Blob */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

            <div className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/40">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-blue-900">For Patients</h2>
              </div>
              <p className="text-gray-700 mb-8 leading-relaxed text-lg">
                Access world-class healthcare from anywhere. Find specialists, book consultations, and manage your health journey.
              </p>
              <div className="space-y-4">
                <Link href="/patient/login" className="block">
                  <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 hover:-translate-y-1 flex items-center justify-center gap-3 group/btn">
                    <svg className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Patient Login
                  </button>
                </Link>
                <Link href="/patient/signup" className="block">
                  <button className="w-full bg-white/80 hover:bg-white text-cyan-600 hover:text-cyan-700 font-semibold px-8 py-4 rounded-xl border-2 border-cyan-500/30 hover:border-cyan-500/60 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 hover:-translate-y-1 flex items-center justify-center gap-3 group/btn">
                    <svg className="w-5 h-5 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    New Patient Signup
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Doctor Portal */}
          <div className="relative bg-gradient-to-br from-white/80 to-blue-50/80 backdrop-blur-2xl border border-blue-300/50 rounded-3xl p-10 shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-500 group">
            {/* Decorative Blob */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

            <div className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/40">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-blue-900">For Doctors</h2>
              </div>
              <p className="text-gray-700 mb-8 leading-relaxed text-lg">
                Join our network of healthcare professionals. Expand your practice with cutting-edge telehealth tools.
              </p>
              <div className="space-y-4">
                <Link href="/doctor/login" className="block">
                  <button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 hover:-translate-y-1 flex items-center justify-center gap-3 group/btn">
                    <svg className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Doctor Login
                  </button>
                </Link>
                <Link href="/doctor/signup" className="block">
                  <button className="w-full bg-white/80 hover:bg-white text-blue-600 hover:text-blue-700 font-semibold px-8 py-4 rounded-xl border-2 border-blue-500/30 hover:border-blue-500/60 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 hover:-translate-y-1 flex items-center justify-center gap-3 group/btn">
                    <svg className="w-5 h-5 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Register as Doctor
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section with 3D Effect */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {[
            { label: 'Active Doctors', value: '500+', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', color: 'cyan' },
            { label: 'Consultations', value: '10K+', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'blue' },
            { label: 'Satisfaction', value: '98%', icon: 'M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5', color: 'cyan' },
            { label: 'Specializations', value: '25+', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', color: 'blue' },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-6 text-center hover:bg-white/90 hover:border-cyan-300/60 hover:scale-110 hover:-translate-y-2 transition-all duration-500 shadow-lg hover:shadow-2xl hover:shadow-cyan-500/20 group"
              style={{
                transform: typeof window !== 'undefined'
                  ? `perspective(1000px) rotateY(${(mousePosition.x - window.innerWidth / 2) * 0.01}deg)`
                  : undefined,
              }}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-${stat.color}-500 to-${stat.color === 'cyan' ? 'blue' : 'cyan'}-600 rounded-xl mb-4 shadow-lg shadow-${stat.color}-500/30 group-hover:scale-110 transition-transform`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-900 to-cyan-600 bg-clip-text text-transparent mb-2">{stat.value}</div>
              <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center pt-16 border-t border-gray-200/50">
          <div className="inline-flex items-center gap-3 mb-6 group">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <div className="relative">
                <div className="w-1 h-6 bg-white rounded-full" />
                <div className="absolute top-0 left-1/2 w-3 h-1 bg-white rounded-full transform -translate-x-1/2" />
              </div>
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-cyan-600 bg-clip-text text-transparent">
              MEDIQUORY CONNECT
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-4 font-medium">Next-Generation Telemedicine Platform</p>
          <p className="text-gray-500 text-xs">© 2024 Mediquory Connect. Transforming Healthcare Access Worldwide.</p>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx global>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        .animate-ping-slow {
          animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .animate-gradient {
          animation: gradient 8s ease infinite;
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out;
        }
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </main>
  );
}
