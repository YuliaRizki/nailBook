"use client";
import React, { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<"login" | "register">("login");

  // Register State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Clear messages on view switch
  useEffect(() => {
    setErrorMsg("");
    setSuccessMsg("");
  }, [view]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (regPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          data: {
            full_name: regName,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else if (data.user) {
        setSuccessMsg("Registration successful! Please login.");
        setLoginEmail(regEmail);
        setTimeout(() => setView("login"), 1000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setErrorMsg("⚠️ Check your email for confirmation.");
        } else {
          setErrorMsg(error.message);
        }
      } else if (data.user) {
        router.push("/");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🎨 THEME TRANSITIONS
  const theme = {
    login: {
      bg: "bg-[#F9F6F2]", // Salon Nude
      accent: "text-salon-accent",
      button: "bg-salon-dark hover:bg-black",
      panel: "bg-salon-dark",
      panelText: "text-salon-nude",
    },
    register: {
      bg: "bg-[#FFF0F5]", // Lavender Blush / Light Pink
      accent: "text-rose-400",
      button: "bg-rose-400 hover:bg-rose-500",
      panel: "bg-rose-900", // Deep Rose
      panelText: "text-rose-50",
    },
  };

  const currentTheme = theme[view];

  return (
    <m.div
      initial={false}
      animate={{ backgroundColor: view === "login" ? "#F9F6F2" : "#FFF0F5" }}
      className="w-full min-h-screen flex items-center justify-center p-4 md:p-8 transition-colors duration-500"
    >
      {/* Container Card */}
      <div className="w-full max-w-[1000px] bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] md:h-[650px] border border-white/50">
        {/* 🎨 LEFT SIDE: Editorial / Brand */}
        <m.div
          animate={{
            backgroundColor: view === "login" ? "#2D2D2D" : "#881337",
          }}
          className="relative w-full md:w-[45%] min-h-[240px] md:h-full overflow-hidden flex flex-col justify-between p-8 md:p-12 transition-colors duration-500"
        >
          {/* Abstract CSS shapes */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-white/5 blur-[80px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[200px] h-[200px] rounded-full bg-white/5 blur-[60px] translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div
              className={`flex items-center gap-2 mb-4 opacity-80 ${currentTheme.panelText}`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold">
                NailBook Experience
              </span>
            </div>
            <h1
              className={`font-serif italic text-3xl md:text-5xl leading-tight ${currentTheme.panelText}`}
            >
              {view === "login" ? (
                <>
                  Curating <br />
                  <span className="text-salon-accent">Beauty</span> & <br />
                  Structure.
                </>
              ) : (
                <>
                  Join the <br />
                  <span className="text-rose-300">Inner</span> <br />
                  Circle.
                </>
              )}
            </h1>
          </div>

          <div className="relative z-10 hidden md:block">
            <p
              className={`text-xs leading-relaxed max-w-[250px] opacity-60 ${currentTheme.panelText}`}
            >
              Join the exclusive list of clients managing their style journey
              with precision and ease.
            </p>
          </div>
        </m.div>

        {/* 📝 RIGHT SIDE: Form Area */}
        <div className="flex-1 relative bg-white p-6 md:p-16 flex flex-col justify-center">
          {/* Tab Switcher */}
          <div className="absolute top-6 right-6 md:top-8 md:right-8 flex bg-stone-100 p-1 rounded-full z-20">
            <button
              onClick={() => setView("login")}
              className={`px-4 md:px-5 py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                view === "login"
                  ? "bg-white text-salon-dark shadow-sm"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setView("register")}
              className={`px-4 md:px-5 py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                view === "register"
                  ? "bg-white text-salon-dark shadow-sm"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="max-w-xs mx-auto w-full mt-12 md:mt-0">
            <AnimatePresence mode="wait">
              {view === "login" ? (
                <m.form
                  key="login-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleLogin}
                  className="space-y-5"
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-serif text-salon-dark mb-1">
                      Welcome Back
                    </h2>
                    <p className="text-stone-400 text-sm">
                      Please enter your details.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-salon-dark/60 ml-1">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-salon-accent/20 focus:border-salon-accent transition-all"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-salon-dark/60 ml-1">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-salon-accent/20 focus:border-salon-accent transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 p-3 rounded-lg">
                      <AlertCircle size={14} /> {errorMsg}
                    </div>
                  )}

                  <button
                    disabled={isLoading}
                    type="submit"
                    className={`w-full text-white rounded-xl py-4 font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${currentTheme.button}`}
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                      "Sign In"
                    )}
                    {!isLoading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </m.form>
              ) : (
                <m.form
                  key="register-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleRegister}
                  className="space-y-5"
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-serif text-salon-dark mb-1">
                      Create Account
                    </h2>
                    <p className="text-stone-400 text-sm">
                      Begin your journey.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-salon-dark/60 ml-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-salon-dark/60 ml-1">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-salon-dark/60 ml-1">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 p-3 rounded-lg">
                      <AlertCircle size={14} /> {errorMsg}
                    </div>
                  )}
                  {successMsg && (
                    <div className="flex items-center gap-2 text-green-600 text-xs bg-green-50 p-3 rounded-lg">
                      <CheckCircle2 size={14} /> {successMsg}
                    </div>
                  )}

                  <button
                    disabled={isLoading}
                    type="submit"
                    className={`w-full text-white rounded-xl py-4 font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${currentTheme.button}`}
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                      "Create Account"
                    )}
                    {!isLoading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </m.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer Text */}
    </m.div>
  );
}
