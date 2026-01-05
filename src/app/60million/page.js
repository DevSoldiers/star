"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { Trophy, Phone, Ticket, Sparkles, Star, Crown } from "lucide-react";

export default function MillionLotteryPage() {
  const [currentStep, setCurrentStep] = useState("idle"); // idle, drawing, winner
  const [winner, setWinner] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 600, height: 600 });
  const [rollingNumber, setRollingNumber] = useState("");
  const [rollingPhone, setRollingPhone] = useState("");

  // Prize configuration
  const PRIZE = {
    amount: "1,000,000",
    title: "GRAND PRIZE",
    titleAmharic: "ታላቅ ሽልማት",
    confettiColors: ["#DC2626", "#EF4444", "#FFFFFF", "#FCA5A5", "#FEE2E2"],
  };

  // Load window size for confetti
  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateSize = () =>
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      updateSize();
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }
  }, []);

  // Simulate number rolling effect
  const startRolling = () => {
    const interval = setInterval(() => {
      // Generate random lottery number (6 digits)
      const randomLottery = Math.floor(100000 + Math.random() * 900000);
      setRollingNumber(randomLottery.toString());
      // Generate random phone number (09XXXXXXXX)
      const randomPhone =
        "09" + Math.floor(10000000 + Math.random() * 90000000);
      setRollingPhone(randomPhone);
    }, 50);
    return interval;
  };

  // Start drawing
  const startDrawing = async () => {
    console.log("Starting million birr draw");
    setCurrentStep("drawing");
    setShowConfetti(false);

    // Start rolling animation
    const interval = startRolling();

    // Wait for 5 seconds with rolling animation
    console.log("Rolling numbers for 5 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    try {
      const apiUrl =
        "https://v8crgwv139.execute-api.us-east-1.amazonaws.com/Stage/api/v2/ticket/drawLottery/60Million";

      console.log("Calling API:", apiUrl);

      const fetchOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 1000000,
          startDate: "2025-12-29",
          endDate: "2026-01-04"
        }),
      };

      const response = await fetch(apiUrl, fetchOptions);
      const data = await response.json();
      console.log("API Response:", data);

      clearInterval(interval);

      if (data.status === "SUCCESS" && data.winner) {
        const winnerData = {
          lotteryNumber: data.winner.ticketNumber,
          phoneNumber: data.winner.phoneNumber,
          drawnAt: data.winner.drawnAt,
          amount: data.winner.amount,
        };

        console.log("Winner data:", winnerData);
        setRollingNumber(winnerData.lotteryNumber);
        setRollingPhone(winnerData.phoneNumber);
        setWinner(winnerData);

        setCurrentStep("winner");
        setShowConfetti(true);

        // Auto hide confetti after 8 seconds
        setTimeout(() => {
          setShowConfetti(false);
        }, 8000);
      } else {
        // Handle API error
        console.error("API returned error:", data);
        clearInterval(interval);
        alert(`Failed to draw winner: ${data.message || "Unknown error"}`);
        setCurrentStep("idle");
      }
    } catch (error) {
      // Handle network error
      console.error("Failed to fetch winner from API:", error);
      clearInterval(interval);
      alert("Network error. Please check your connection and try again.");
      setCurrentStep("idle");
    }
  };

  // Reset everything
  const resetDraw = () => {
    setCurrentStep("idle");
    setWinner(null);
    setShowConfetti(false);
    setRollingNumber("");
    setRollingPhone("");
  };

  const isDrawing = currentStep === "drawing";
  const isWinnerShown = currentStep === "winner";

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-white to-gray-50 text-gray-900 flex flex-col items-center justify-center px-4 py-3 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <motion.div
        className="mb-4 text-center z-10"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <Crown className="w-8 h-8 text-red-600 animate-pulse" />
          <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent drop-shadow-lg">
            60 Million Lottery
          </h1>
          <Crown className="w-8 h-8 text-red-600 animate-pulse" />
        </div>
        <p className="text-xl text-red-700 font-semibold">
          1 Million Birr Lottery Draw
        </p>
      </motion.div>

      {/* Main Content */}
      <div className="w-full max-w-6xl z-10">
        {/* Idle State */}
        {currentStep === "idle" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            {/* Prize Display */}
            <motion.div
              className="bg-white rounded-3xl p-8 border-4 border-red-500 shadow-2xl mb-6 w-full max-w-2xl"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex flex-col items-center text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  <Trophy className="w-20 h-20 mb-4 text-red-600" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-3 text-gray-800">
                  {PRIZE.title}
                </h2>
                <div className="text-6xl font-extrabold bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent mb-3">
                  {PRIZE.amount}
                </div>
                <p className="text-2xl font-bold text-red-600 mb-2">Birr</p>
                <p className="text-lg text-gray-600">{PRIZE.titleAmharic}</p>
              </div>
            </motion.div>

            {/* Start Button */}
            <motion.button
              onClick={startDrawing}
              className="px-12 py-4 bg-gradient-to-r from-red-600 via-red-500 to-red-700 rounded-full text-white font-bold text-2xl shadow-2xl hover:shadow-red-500/50 transition-all border-4 border-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              🎲 Start Draw / ዕጣ ጀምር
            </motion.button>
          </motion.div>
        )}

        {/* Drawing State */}
        {isDrawing && (
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Prize Title */}
            <motion.div
              className="mb-4 text-center p-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-red-700 shadow-2xl border-4 border-white"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Trophy className="w-12 h-12 mx-auto mb-2 text-white" />
              <h2 className="text-2xl font-extrabold text-white mb-1">
                {PRIZE.title}
              </h2>
              <p className="text-5xl font-black text-white">
                {PRIZE.amount} Birr
              </p>
            </motion.div>

            {/* Drawing Animation */}
            <div className="bg-white rounded-3xl p-6 border-4 border-red-500 shadow-2xl w-full max-w-4xl">
              <motion.div
                className="text-center mb-4"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <p className="text-2xl font-bold text-red-600 mb-1">
                  🎰 Drawing in Progress...
                </p>
                <p className="text-lg text-gray-600">እየወጣ ነው...</p>
              </motion.div>

              {/* Rolling Numbers Display - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lottery Number */}
                <div className="bg-gradient-to-br from-red-50 to-white rounded-2xl p-4 border-4 border-red-600 shadow-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Ticket className="w-6 h-6 text-red-600" />
                    <p className="text-lg font-bold text-gray-700">
                      Lottery Number
                    </p>
                  </div>
                  <motion.div
                    className="text-5xl font-mono font-bold text-red-600 text-center tracking-widest"
                    key={rollingNumber}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.1 }}
                  >
                    {rollingNumber || "------"}
                  </motion.div>
                </div>

                {/* Phone Number */}
                <div className="bg-gradient-to-br from-red-50 to-white rounded-2xl p-4 border-4 border-red-600 shadow-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Phone className="w-6 h-6 text-red-600" />
                    <p className="text-lg font-bold text-gray-700">
                      Phone Number
                    </p>
                  </div>
                  <motion.div
                    className="text-4xl font-mono font-bold text-red-600 text-center tracking-wider"
                    key={rollingPhone}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.1 }}
                  >
                    {rollingPhone || "09--------"}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Winner Revealed State */}
        {isWinnerShown && winner && (
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            {/* Winner Announcement */}
            <motion.div
              className="mb-3 text-center"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="inline-block"
                >
                  <span className="text-4xl">🎉</span>
                </motion.div>
                <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent">
                  WINNER! / አሸናፊ!
                </h2>
                <motion.div
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="inline-block"
                >
                  <span className="text-4xl">🎉</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Prize Card */}
            <motion.div
              className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-red-700 shadow-2xl border-4 border-white"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Trophy className="w-12 h-12 mx-auto mb-2 text-white" />
              <h3 className="text-xl font-bold text-white text-center mb-1">
                {PRIZE.title}
              </h3>
              <p className="text-5xl font-black text-white text-center">
                {PRIZE.amount}
              </p>
              <p className="text-xl font-bold text-white text-center mt-1">
                Birr
              </p>
            </motion.div>

            {/* Winner Details */}
            <div className="bg-white rounded-3xl p-4 border-4 border-red-500 shadow-2xl w-full max-w-4xl mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lottery Number */}
                <motion.div
                  className="bg-gradient-to-br from-red-100 to-red-50 rounded-2xl p-4 border-4 border-red-600 shadow-lg"
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Ticket className="w-6 h-6 text-red-600" />
                    <p className="text-lg font-bold text-red-700">
                      Winning Ticket
                    </p>
                  </div>
                  <div className="text-5xl font-mono font-black text-red-600 text-center tracking-widest">
                    {winner.lotteryNumber}
                  </div>
                </motion.div>

                {/* Phone Number */}
                <motion.div
                  className="bg-gradient-to-br from-red-100 to-red-50 rounded-2xl p-4 border-4 border-red-600 shadow-lg"
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Phone className="w-6 h-6 text-red-600" />
                    <p className="text-lg font-bold text-red-700">
                      Contact Number
                    </p>
                  </div>
                  <div className="text-4xl font-mono font-black text-red-600 text-center tracking-wider">
                    {winner.phoneNumber}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-6">
              <motion.button
                onClick={resetDraw}
                className="px-10 py-3 bg-gradient-to-r from-red-600 via-red-500 to-red-700 rounded-full text-white font-bold text-xl shadow-2xl hover:shadow-red-500/50 transition-all border-4 border-white"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                🔄 New Draw / አዲስ ዕጣ
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={500}
          recycle={false}
          gravity={0.3}
          wind={0.01}
          initialVelocityY={30}
          colors={PRIZE.confettiColors}
        />
      )}
    </div>
  );
}
