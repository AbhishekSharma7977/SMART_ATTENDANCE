import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Bus, Users, Bell, Brain, ChevronRight, 
  ArrowRight, CheckCircle, Award, Activity, Navigation
} from 'lucide-react';
import { ROUTES } from '../lib/constants';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-100 selection:text-blue-700">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-blue-600" size={28} />
              <span className="font-bold text-xl text-slate-900 tracking-tight">SafeRoute</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">How it works</a>
              <a href="#about" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">About</a>
            </div>

            <div className="flex items-center gap-4">
              <Link to={ROUTES.LOGIN} className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors">
                Log in
              </Link>
              <Link to={ROUTES.SIGNUP} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mx-auto">
              <Award size={12} fill="currentColor" />
              Trusted by 50+ Schools
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Smart School Transport & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Student Safety Platform.
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg text-slate-500 leading-relaxed">
              SafeRoute provides enterprise-grade tracking, face-recognition attendance, 
              and real-time alerts to ensure every student arrives safely, every day.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to={ROUTES.SIGNUP} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 group transition-all">
                Create Account
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to={ROUTES.LOGIN} className="w-full sm:w-auto bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-8 py-4 rounded-2xl font-bold transition-all shadow-sm">
                Dashboard Login
              </Link>
            </div>
          </div>

          {/* Hero Image Mockup */}
          <div className="mt-20 relative max-w-5xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 blur-3xl rounded-[3rem] -z-10" />
            <div className="bg-slate-900 rounded-[2.5rem] p-2 shadow-2xl border border-white/10 overflow-hidden aspect-[16/9]">
              <div className="h-full w-full bg-slate-800 flex items-center justify-center relative group">
                <div className="absolute top-4 left-4 flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                </div>
                <ShieldCheck size={80} className="text-blue-500/20 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">Everything you need for student safety</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Powerful features designed for administrators, teachers, and parents.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Bus, title: "Live Bus Tracking", desc: "Real-time GPS updates and route optimization for every school bus.", color: "bg-blue-50 text-blue-600" },
              { icon: Users, title: "Face Recognition", desc: "Biometric attendance marking with 99.9% accuracy for students.", color: "bg-emerald-50 text-emerald-600" },
              { icon: Bell, title: "Instant Alerts", desc: "Push notifications and SMS alerts for pickup, drop, and emergencies.", color: "bg-amber-50 text-amber-600" },
              { icon: Brain, title: "AI Assistant", desc: "Intelligent chatbot to answer student-related queries 24/7.", color: "bg-purple-50 text-purple-600" },
              { icon: ShieldCheck, title: "Data Security", desc: "Bank-grade encryption and privacy controls for student data.", color: "bg-red-50 text-red-600" },
              { icon: CheckCircle, title: "Role Management", desc: "Granular access control for Admins, Staff, and Parents.", color: "bg-indigo-50 text-indigo-600" },
            ].map((f, i) => (
              <div key={i} className="p-8 rounded-3xl border border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all group">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${f.color}`}>
                  <f.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-white pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2 space-y-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-blue-400" size={32} />
                <span className="font-bold text-2xl tracking-tight">SafeRoute</span>
              </div>
              <p className="text-slate-400 max-w-sm leading-relaxed">
                Empowering schools with technology that puts student safety first. 
                Built for the next generation of smart educational institutions.
              </p>
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer"><Navigation size={18} /></div>
                <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer"><Activity size={18} /></div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-6 text-slate-200">Product</h4>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-slate-200">Company</h4>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-500 text-xs">
              &copy; {new Date().getFullYear()} SafeRoute Platform. All rights reserved. Built with ❤️ for School Safety.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
