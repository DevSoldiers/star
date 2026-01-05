"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Sparkles, Trophy } from "lucide-react";

// Optimized Firework component (reduced particles for performance)
function BigFirework({ x, y, color, delay, size = 1 }) {
  const particleCount = 12; // Reduced from 24
  const particles = Array.from({ length: particleCount }, (_, i) => ({
    angle: i * (360 / particleCount) * (Math.PI / 180),
    distance: (80 + Math.random() * 60) * size,
    size: (4 + Math.random() * 5) * size,
  }));

  return (
    <motion.div
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, duration: 0.1 }}
    >
      {/* Center explosion */}
      <motion.div
        className="absolute rounded-full -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 20 * size,
          height: 20 * size,
          backgroundColor: color,
          boxShadow: `0 0 ${40 * size}px ${color}, 0 0 ${80 * size}px ${color}`,
        }}
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ delay, duration: 0.8, ease: "easeOut" }}
      />

      {/* Main particles */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: color,
            boxShadow: `0 0 ${p.size * 2}px ${color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            opacity: 0,
            scale: 0,
          }}
          transition={{ delay: delay + 0.05, duration: 1.2, ease: "easeOut" }}
        />
      ))}
    </motion.div>
  );
}

// Massive fireworks display
function MassiveFireworksDisplay({ isActive }) {
  const [fireworks, setFireworks] = useState([]);
  const colors = [
    "#ff0000",
    "#ff3333", // Reds
    "#ffd700",
    "#ffaa00",
    "#ff8800", // Golds/Oranges
    "#00ff00",
    "#00ff88", // Greens
    "#00ffff",
    "#0088ff", // Cyans/Blues
    "#ff00ff",
    "#ff00aa", // Magentas
    "#ffffff", // White
  ];

  useEffect(() => {
    if (!isActive) {
      setFireworks([]);
      return;
    }

    const launchFirework = (isBig = false) => {
      const newFirework = {
        id: Date.now() + Math.random(),
        x: 5 + Math.random() * 90,
        y: 5 + Math.random() * 60,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: 0,
        size: isBig ? 1.2 + Math.random() * 0.5 : 0.7 + Math.random() * 0.3,
      };
      setFireworks((prev) => [...prev.slice(-8), newFirework]); // Keep only 8 active
    };

    // Initial burst - 5 fireworks (reduced from 10)
    for (let i = 0; i < 5; i++) {
      setTimeout(() => launchFirework(true), i * 200);
    }

    // Continuous fireworks - slower rate for better performance
    const interval = setInterval(() => {
      launchFirework(Math.random() > 0.6);
    }, 600); // Reduced from 150ms to 600ms

    return () => {
      clearInterval(interval);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Background flash - reduced intensity */}
      <motion.div
        className="absolute inset-0 bg-amber-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.15, 0, 0.1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
      />

      {fireworks.map((fw) => (
        <BigFirework
          key={fw.id}
          x={fw.x}
          y={fw.y}
          color={fw.color}
          delay={fw.delay}
          size={fw.size}
        />
      ))}
    </div>
  );
}

// Dramatic slot machine digit
function SlotDigit({ finalDigit, isRolling, revealDelay, index, isRevealed }) {
  const [displayDigit, setDisplayDigit] = useState("0");
  const [revealed, setRevealed] = useState(false);
  const rollSpeed = useRef(50);

  useEffect(() => {
    if (!isRolling) {
      setDisplayDigit("0");
      setRevealed(false);
      return;
    }

    const rollInterval = setInterval(() => {
      setDisplayDigit(Math.floor(Math.random() * 10).toString());
    }, rollSpeed.current);

    const revealTimer = setTimeout(() => {
      clearInterval(rollInterval);

      let slowCount = 0;
      const slowInterval = setInterval(() => {
        setDisplayDigit(Math.floor(Math.random() * 10).toString());
        slowCount++;
        if (slowCount > 5) {
          clearInterval(slowInterval);
          setDisplayDigit(finalDigit);
          setRevealed(true);
        }
      }, 150);
    }, revealDelay);

    return () => {
      clearInterval(rollInterval);
      clearTimeout(revealTimer);
    };
  }, [isRolling, finalDigit, revealDelay]);

  return (
    <motion.div
      className="relative"
      initial={{ scale: 0, rotateY: 180 }}
      animate={{ scale: 1, rotateY: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 200 }}
    >
      {revealed && (
        <motion.div
          className="absolute inset-0 rounded-xl blur-xl"
          style={{ backgroundColor: "#fbbf24" }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 0.8, 0.4], scale: [0.8, 1.3, 1.1] }}
          transition={{ duration: 0.5 }}
        />
      )}

      <motion.div
        className={`relative w-14 h-20 md:w-18 md:h-24 rounded-xl flex items-center justify-center overflow-hidden
          ${
            revealed
              ? "bg-gradient-to-b from-amber-400 to-amber-600 border-amber-300"
              : "bg-gradient-to-b from-gray-700 to-gray-900 border-gray-600"
          }
          border-4 shadow-2xl`}
        animate={isRolling && !revealed ? { y: [0, -3, 3, -2, 2, 0] } : {}}
        transition={{ repeat: Infinity, duration: 0.15 }}
      >
        <div className="absolute inset-1 rounded-lg bg-gradient-to-b from-white/20 to-transparent" />

        <motion.span
          className={`text-4xl md:text-5xl font-black ${
            revealed ? "text-black" : "text-amber-400"
          }`}
          style={{
            textShadow: revealed ? "none" : "0 0 20px rgba(251,191,36,0.8)",
          }}
          key={displayDigit}
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.05 }}
        >
          {displayDigit}
        </motion.span>

        {revealed && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ duration: 0.6, delay: 0.1 }}
          />
        )}
      </motion.div>

      {revealed && (
        <>
          <motion.div
            className="absolute -top-2 -right-2 text-xl"
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: [0, 1.5, 1], rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            ✨
          </motion.div>
          <motion.div
            className="absolute -bottom-2 -left-2 text-xl"
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: [0, 1.5, 1], rotate: -360 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            ⭐
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

// Phone number slots display
function PhoneNumberSlots({ phoneNumber, isRolling }) {
  const cleanNumber = phoneNumber.replace("+251", "0");
  const digits = cleanNumber.split("");

  return (
    <div className="flex flex-wrap justify-center gap-2 md:gap-3">
      {digits.map((digit, index) => (
        <SlotDigit
          key={index}
          finalDigit={digit}
          isRolling={isRolling}
          revealDelay={3000 + index * 600}
          index={index}
          isRevealed={false}
        />
      ))}
    </div>
  );
}

// Dramatic intro animation
function DrawingAnimation({ onComplete }) {
  const [stage, setStage] = useState(0);
  const stages = [
    { text: "3", emoji: "🎰" },
    { text: "2", emoji: "🎲" },
    { text: "1", emoji: "🎯" },
    { text: "GO!", emoji: "🚀" },
  ];

  useEffect(() => {
    const timers = [];

    stages.forEach((_, index) => {
      timers.push(
        setTimeout(() => {
          setStage(index);
          if (index === stages.length - 1) {
            setTimeout(onComplete, 600);
          }
        }, index * 800)
      );
    });

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute w-64 h-64 rounded-full border-4 border-amber-500/50"
        animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      />
      <motion.div
        className="absolute w-48 h-48 rounded-full border-4 border-amber-400/50"
        animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
      />
      <motion.div
        className="absolute w-32 h-32 rounded-full border-4 border-amber-300/50"
        animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
      />

      <motion.div
        key={stage}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 180 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        className="text-center z-10"
      >
        <motion.div
          className="text-8xl md:text-9xl mb-4"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 0.3 }}
        >
          {stages[stage].emoji}
        </motion.div>
        <motion.div
          className={`text-7xl md:text-9xl font-black ${
            stage === 3
              ? "bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent"
              : "text-white"
          }`}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 0.3 }}
        >
          {stages[stage].text}
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute left-10 top-1/2 -translate-y-1/2"
        animate={{ x: [-20, 20, -20], opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1 }}
      >
        <span className="text-6xl">🎵</span>
      </motion.div>
      <motion.div
        className="absolute right-10 top-1/2 -translate-y-1/2"
        animate={{ x: [20, -20, 20], opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1 }}
      >
        <span className="text-6xl">🎶</span>
      </motion.div>
    </motion.div>
  );
}

// Revealing animation
function RevealingDisplay({ phoneNumber, onRevealComplete }) {
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    setIsRolling(true);

    const completeTimer = setTimeout(() => {
      onRevealComplete();
    }, 10000);

    return () => clearTimeout(completeTimer);
  }, [onRevealComplete]);

  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          className="flex items-center justify-center gap-3 mb-2"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <Phone className="w-10 h-10 text-amber-400" />
          <span className="text-2xl md:text-3xl font-bold text-amber-300">
            THE WINNING NUMBER IS...
          </span>
          <Phone className="w-10 h-10 text-amber-400" />
        </motion.div>
        <p className="text-white/70 text-lg">አሸናፊው ቁጥር...</p>
      </motion.div>

      <motion.div
        className="bg-black/60 backdrop-blur-md rounded-3xl p-6 md:p-10 border-2 border-amber-500/50 inline-block"
        animate={{
          boxShadow: [
            "0 0 30px rgba(251,191,36,0.3)",
            "0 0 60px rgba(251,191,36,0.5)",
            "0 0 30px rgba(251,191,36,0.3)",
          ],
        }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <PhoneNumberSlots phoneNumber={phoneNumber} isRolling={isRolling} />
      </motion.div>

      <motion.p
        className="mt-6 text-xl text-amber-400"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1 }}
      >
        🥁 Revealing... / በማሳየት ላይ... 🥁
      </motion.p>
    </motion.div>
  );
}

export default function EleganceConcertLottery() {
  const [currentStep, setCurrentStep] = useState("idle");
  const [winner, setWinner] = useState(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [drawCount, setDrawCount] = useState(0);
  const [error, setError] = useState(null);
  const drawInProgress = useRef(false);

  const handleCountdownComplete = async () => {
    setShowCountdown(false);

    try {
      const response = await fetch(
        "https://v8crgwv139.execute-api.us-east-1.amazonaws.com/Stage/api/v2/user/drawByAffiliate/6954b5f318b12c4a74500798",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();
      console.log("API Response:", data);

      if (data.data && data.data.phoneNumber) {
        setWinner({
          phoneNumber: data.data.phoneNumber,
          userId: data.data.userId,
          drawnAt: new Date().toLocaleString(),
        });
        setCurrentStep("revealing");
      } else {
        throw new Error("Invalid response");
      }
    } catch (err) {
      console.error("API Error:", err);
      setError("Failed to draw winner. Please try again.");
      setCurrentStep("idle");
      drawInProgress.current = false;
    }
  };

  const handleRevealComplete = () => {
    setCurrentStep("winner");
    setShowFireworks(true);
    setDrawCount((prev) => prev + 1);
    drawInProgress.current = false;
    setTimeout(() => setShowFireworks(false), 10000);
  };

  const startDrawing = () => {
    if (drawInProgress.current) return;
    drawInProgress.current = true;
    setError(null);
    setWinner(null);
    setShowCountdown(true);
    setCurrentStep("countdown");
  };

  const resetDraw = () => {
    setCurrentStep("idle");
    setWinner(null);
    setShowFireworks(false);
    setShowCountdown(false);
    setError(null);
    drawInProgress.current = false;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <MassiveFireworksDisplay isActive={showFireworks} />

      <AnimatePresence>
        {showCountdown && (
          <DrawingAnimation onComplete={handleCountdownComplete} />
        )}
      </AnimatePresence>

      {/* Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/concert3.jpeg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/60" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <motion.header
          className="pt-6 px-4 text-center"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 animate-pulse" />
            <h1 className="text-3xl md:text-5xl font-extrabold">
              <span className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                ELEGANCE
              </span>
              <span className="text-white ml-2 italic font-light">Concert</span>
            </h1>
            <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 animate-pulse" />
          </div>
        </motion.header>

        {/* Main Area */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <AnimatePresence mode="wait">
            {/* Idle State - Just the button */}
            {currentStep === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: -50 }}
                className="text-center"
              >
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 mb-6 text-lg"
                  >
                    ❌ {error}
                  </motion.p>
                )}

                <motion.button
                  onClick={startDrawing}
                  className="relative px-14 md:px-20 py-6 md:py-8 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 rounded-full text-black font-bold text-2xl md:text-3xl shadow-2xl transition-all border-4 border-white/30 overflow-hidden"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    boxShadow: [
                      "0 0 40px rgba(251,191,36,0.5)",
                      "0 0 80px rgba(251,191,36,0.8)",
                      "0 0 40px rgba(251,191,36,0.5)",
                    ],
                  }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ["-200%", "200%"] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "linear",
                    }}
                  />
                  <span className="relative z-10">Start Draw</span>
                </motion.button>
              </motion.div>
            )}

            {/* Revealing State */}
            {currentStep === "revealing" && winner && (
              <motion.div
                key="revealing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <RevealingDisplay
                  phoneNumber={winner.phoneNumber}
                  onRevealComplete={handleRevealComplete}
                />
              </motion.div>
            )}

            {/* Winner State */}
            {currentStep === "winner" && winner && (
              <motion.div
                key="winner"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="text-center"
              >
                {/* Winner Banner */}
                <motion.div
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-6"
                >
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <motion.span
                      className="text-5xl md:text-6xl"
                      animate={{ rotate: [-20, 20, -20], scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    >
                      🎉
                    </motion.span>
                    <motion.h2
                      className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      WINNER!
                    </motion.h2>
                    <motion.span
                      className="text-5xl md:text-6xl"
                      animate={{ rotate: [20, -20, 20], scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    >
                      🎉
                    </motion.span>
                  </div>
                  <p className="text-3xl text-amber-300 font-bold">አሸናፊ!</p>
                </motion.div>

                {/* Winner Card */}
                <motion.div
                  className="bg-black/70 backdrop-blur-md rounded-3xl p-8 md:p-12 border-4 border-amber-500 shadow-2xl mb-8"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                  style={{
                    boxShadow: "0 0 100px rgba(251,191,36,0.6)",
                  }}
                >
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <Trophy className="w-12 h-12 text-amber-400" />
                    <p className="text-2xl md:text-3xl font-bold text-amber-300">
                      Winning Phone Number
                    </p>
                    <Trophy className="w-12 h-12 text-amber-400" />
                  </div>

                  <motion.div
                    className="text-5xl md:text-7xl font-mono font-black text-white tracking-wider mb-6"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    {winner.phoneNumber.replace("+251", "0")}
                  </motion.div>

                  <motion.p
                    className="text-xl text-amber-400 font-semibold mb-4"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    Happy New Year
                  </motion.p>

                  {/* <p className="text-white/60 text-sm">
                    Draw #{drawCount} • {winner.drawnAt}
                  </p> */}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <motion.footer
          className="py-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-white/50 text-sm">
            Ethiopian Lottery Service • Ethiolottery • 60 ሚሊዮን ብር ሎተሪ
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
