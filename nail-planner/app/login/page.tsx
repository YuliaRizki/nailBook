"use client";
import React, { useState, useEffect } from "react";
import { m, AnimatePresence, Transition } from "framer-motion";
import {
  ArrowLeftRight,
  UserPlus,
  Gem,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isLoginView, setIsLoginView] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

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

  // Check screen size for responsive layout
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Clear messages on view switch
  useEffect(() => {
    setErrorMsg("");
    setSuccessMsg("");
  }, [isLoginView]);

  // 🎨 THEME COLORS (Adapted for NailBook)
  const loginColors = {
    accent: "#d4a373", // salon-accent
    accentLight: "#eac095",
    glow: "rgba(212, 163, 115, 0.4)",
    gradient: "linear-gradient(135deg, #d4a373 0%, #c29160 100%)",
  };

  const registerColors = {
    accent: "#bfa09e", // muted rose
    accentLight: "#f8e3e3", // salon-pink
    glow: "rgba(248, 227, 227, 0.5)",
    gradient: "linear-gradient(135deg, #bfa09e 0%, #d8b4b8 100%)",
  };

  const activeColors = isLoginView ? loginColors : registerColors;

  const syncSpring: Transition = {
    type: "spring",
    stiffness: 100,
    damping: 18,
  };

  const handleRegister = async () => {
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
        setTimeout(() => setIsLoginView(true), 800);
      }
    } catch (err: any) {
      console.error("Registration Error:", err);
      if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
        setErrorMsg(
          "Network Error: Could not connect to server. Please check your internet connection."
        );
      } else {
        setErrorMsg(
          err.message || "An unexpected error occurred during registration."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
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
          setErrorMsg(
            "⚠️ Go to Supabase > Auth > Providers > Email > Disable 'Confirm Email'."
          );
        } else {
          setErrorMsg(error.message);
        }
      } else if (data.user) {
        setUserInLocal(data.user);
        router.push("/");
      }
    } catch (err: any) {
      console.error("Error:", err);
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const setUserInLocal = (user: any) => {
    // Optional: Just a clear visual cue or logic hook if needed
    console.log("Logged in:", user.email);
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center relative overflow-hidden bg-salon-nude sm:p-10">
      {/* 🌤️ RICH ATMOSPHERIC BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Dynamic gradient orbs */}
        <m.div
          animate={{
            x: [0, 40, 0],
            y: [0, -30, 0],
            scale: isLoginView ? 1.1 : 0.9,
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-15%] left-[-10%] w-[700px] h-[700px] rounded-full blur-[150px]"
          style={{
            background: isLoginView
              ? "radial-gradient(circle, rgba(212, 163, 115, 0.2) 0%, rgba(249, 246, 242, 0) 70%)"
              : "radial-gradient(circle, rgba(248, 227, 227, 0.4) 0%, rgba(249, 246, 242, 0) 70%)",
          }}
        />
        <m.div
          animate={{
            x: [0, -35, 0],
            y: [0, 40, 0],
            scale: isLoginView ? 0.9 : 1.1,
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[130px]"
          style={{
            background: isLoginView
              ? "radial-gradient(circle, rgba(212, 163, 115, 0.15) 0%, transparent 60%)"
              : "radial-gradient(circle, rgba(212, 163, 115, 0.1) 0%, transparent 70%)",
          }}
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(212, 163, 115, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(212, 163, 115, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <AnimatePresence mode="wait">
        <m.div
          key="auth-container"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative w-full h-screen md:h-[600px] md:w-[1000px] flex flex-col md:block overflow-hidden z-10 bg-white/40 md:backdrop-blur-xl md:rounded-[40px] shadow-2xl border-0 md:border border-white/60"
        >
          {/* 🎨 SLIDING ACCENT PANEL */}
          <m.div
            // Desktop: Slide X. Mobile: Fixed Top or Slide Y?
            // Better Mobile UX: Keep it as a top banner that changes color
            animate={
              isMobile
                ? {
                    background: isLoginView
                      ? "linear-gradient(160deg, #fdfbf7 0%, #f4eadd 100%)"
                      : "linear-gradient(160deg, #fff0f0 0%, #fae1e1 100%)",
                  }
                : {
                    x: isLoginView ? 0 : 550, // 1000 - 450 = 550
                  }
            }
            transition={syncSpring}
            className="w-full h-[35%] md:absolute md:top-0 md:left-0 md:w-[450px] md:h-full z-20 flex flex-col items-center justify-center p-8 md:p-12 text-center overflow-hidden shadow-2xl relative"
            style={
              !isMobile
                ? {
                    background: isLoginView
                      ? "linear-gradient(160deg, #fdfbf7 0%, #f4eadd 100%)"
                      : "linear-gradient(160deg, #fff0f0 0%, #fae1e1 100%)",
                    borderRight: isLoginView
                      ? "1px solid rgba(212, 163, 115, 0.1)"
                      : "none",
                    borderLeft: !isLoginView
                      ? "1px solid rgba(248, 227, 227, 0.2)"
                      : "none",
                  }
                : {
                    // Mobile Styles handled in animate
                    borderBottom: "1px solid rgba(255,255,255,0.5)",
                  }
            }
          >
            {/* Animated glow */}
            <m.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-64 h-64 rounded-full blur-[80px]"
              style={{
                background: isLoginView
                  ? loginColors.glow
                  : registerColors.glow,
              }}
            />

            <div className="relative z-10 flex flex-col items-center">
              {/* Icon */}
              <m.div
                key={isLoginView ? "login-icon" : "reg-icon"}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  boxShadow: [
                    `0 0 20px ${activeColors.glow}`,
                    `0 0 40px ${activeColors.glow}`,
                    `0 0 20px ${activeColors.glow}`,
                  ],
                }}
                className="mb-4 md:mb-8 w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[32px] flex items-center justify-center bg-white/80 backdrop-blur-md"
                style={{
                  border: `1px solid ${activeColors.accent}30`,
                }}
              >
                {isLoginView ? (
                  <Gem
                    style={{ color: loginColors.accent }}
                    size={isMobile ? 28 : 42}
                    strokeWidth={1.5}
                  />
                ) : (
                  <UserPlus
                    style={{ color: registerColors.accent }}
                    size={isMobile ? 28 : 42}
                    strokeWidth={1.5}
                  />
                )}
              </m.div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif italic tracking-tight mb-2 md:mb-4 text-salon-dark">
                {isLoginView ? "Member Access" : "Join the List"}
              </h1>
              <p className="text-gray-500 text-xs md:text-sm font-medium leading-relaxed max-w-[260px] mx-auto hidden md:block">
                {isLoginView
                  ? "Manage your appointments and view styles."
                  : "Become a VIP member to track your history and book much faster."}
              </p>
            </div>
          </m.div>

          {/* 📝 FORMS CONTAINER */}
          {/* On Mobile: Flex column fill rest. On Desktop: Absolute inset */}
          <div className="flex-1 relative md:absolute md:inset-0 md:flex md:justify-between md:p-12 bg-white/60 md:bg-transparent">
            {/* REGISTER FORM */}
            <div
              className={`w-full h-full md:w-[450px] flex items-center justify-center p-6 md:p-0 transition-opacity duration-300 ${
                !isLoginView
                  ? "opacity-100 z-10"
                  : "opacity-0 md:opacity-100 z-0"
              } absolute inset-0 md:relative`}
            >
              <m.div
                animate={{
                  opacity: !isLoginView ? 1 : 0,
                  x: isMobile ? (!isLoginView ? 0 : -50) : 0,
                  pointerEvents: !isLoginView ? "auto" : "none",
                }}
                className="w-full max-w-sm space-y-4 md:space-y-6"
              >
                <div>
                  <h2 className="text-2xl md:text-3xl font-serif italic text-salon-dark mb-1">
                    New Client
                  </h2>
                  <p className="text-gray-400 text-xs uppercase tracking-widest font-bold">
                    Create your profile
                  </p>
                </div>

                {/* Error/Success Messages */}
                <AnimatePresence>
                  {errorMsg && (
                    <m.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-medium rounded-xl flex items-center gap-2"
                    >
                      <AlertCircle size={14} />
                      {errorMsg}
                    </m.div>
                  )}
                  {successMsg && (
                    <m.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-3 bg-green-50 border border-green-200 text-green-600 text-xs font-medium rounded-xl flex items-center gap-2"
                    >
                      <CheckCircle2 size={14} />
                      {successMsg}
                    </m.div>
                  )}
                </AnimatePresence>

                <div className="space-y-3 md:space-y-4">
                  <input
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="FULL NAME"
                    className="w-full p-4 bg-white/50 border border-salon-pink rounded-xl text-xs font-bold tracking-widest outline-none focus:border-salon-accent transition-colors"
                  />
                  <input
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="EMAIL ADDRESS"
                    className="w-full p-4 bg-white/50 border border-salon-pink rounded-xl text-xs font-bold tracking-widest outline-none focus:border-salon-accent transition-colors"
                  />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="PASSWORD"
                    className="w-full p-4 bg-white/50 border border-salon-pink rounded-xl text-xs font-bold tracking-widest outline-none focus:border-salon-accent transition-colors"
                  />
                </div>
                <button
                  onClick={handleRegister}
                  disabled={isLoading}
                  className="w-full py-4 bg-white text-salon-dark font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg hover:bg-salon-pink transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Creating..." : "Create Account"}
                </button>
              </m.div>
            </div>

            {/* LOGIN FORM */}
            <div
              className={`w-full h-full md:w-[450px] flex items-center justify-center p-6 md:p-0 transition-opacity duration-300 ${
                isLoginView
                  ? "opacity-100 z-10"
                  : "opacity-0 md:opacity-100 z-0"
              } absolute inset-0 md:relative ${
                !isMobile &&
                "md:order-last" /* Desktop trick to put it on right */
              }`}
            >
              <m.div
                animate={{
                  opacity: isLoginView ? 1 : 0,
                  x: isMobile ? (isLoginView ? 0 : 50) : 0,
                  pointerEvents: isLoginView ? "auto" : "none",
                }}
                className="w-full max-w-sm space-y-4 md:space-y-6"
              >
                <div>
                  <h2 className="text-2xl md:text-3xl font-serif italic text-salon-dark mb-1">
                    Welcome Back
                  </h2>
                  <p className="text-gray-400 text-xs uppercase tracking-widest font-bold">
                    Login to your account
                  </p>
                </div>

                {/* Error/Success Messages */}
                <AnimatePresence>
                  {errorMsg && (
                    <m.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-medium rounded-xl"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle size={14} />
                        <span>{errorMsg}</span>
                      </div>
                    </m.div>
                  )}
                  {successMsg && (
                    <m.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-3 bg-green-50 border border-green-200 text-green-600 text-xs font-medium rounded-xl flex items-center gap-2"
                    >
                      <CheckCircle2 size={14} />
                      {successMsg}
                    </m.div>
                  )}
                </AnimatePresence>

                <div className="space-y-3 md:space-y-4">
                  <input
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="EMAIL ADDRESS"
                    className="w-full p-4 bg-salon-nude/50 border border-salon-accent/20 rounded-xl text-xs font-bold tracking-widest outline-none focus:border-salon-accent transition-colors"
                  />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="PASSWORD"
                    className="w-full p-4 bg-salon-nude/50 border border-salon-accent/20 rounded-xl text-xs font-bold tracking-widest outline-none focus:border-salon-accent transition-colors"
                  />
                </div>
                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full py-4 bg-salon-accent text-white font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-salon-accent/20 hover:scale-[1.02] transition-transform disabled:opacity-50"
                >
                  {isLoading ? "Verifying..." : "Login Securely"}
                </button>
              </m.div>
            </div>
          </div>

          {/* 🔄 MODE SWITCHER */}
          <m.button
            animate={
              isMobile
                ? {
                    // Mobile: Floating at the visual seam or bottom right
                    bottom: "20px",
                    right: "20px",
                    x: 0,
                    rotate: isLoginView ? 0 : 180,
                  }
                : {
                    // Desktop: Slide with panel
                    x: isLoginView ? 0 : 500,
                    rotate: isLoginView ? 0 : 180,
                  }
            }
            transition={syncSpring}
            onClick={() => setIsLoginView(!isLoginView)}
            className={`absolute z-50 rounded-full flex items-center justify-center shadow-xl cursor-pointer hover:scale-110 active:scale-95 bg-white text-salon-accent border-4 border-salon-nude
                ${isMobile ? "w-14 h-14" : "w-16 h-16 left-[468px] top-[270px]"}
            `}
            style={isMobile ? { position: "absolute" } : {}}
          >
            <ArrowLeftRight size={isMobile ? 18 : 20} strokeWidth={2.5} />
          </m.button>
        </m.div>
      </AnimatePresence>
    </div>
  );
}
