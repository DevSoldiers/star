"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { Trophy, Phone, Ticket, Sparkles, Star, Award } from "lucide-react";

// Prize configuration
const PRIZES = [
  {
    id: 1,
    place: "1st Prize",
    amount: "50,000",
    color: "from-yellow-400 via-yellow-500 to-orange-500",
    icon: Trophy,
    bgGlow: "bg-yellow-500/20",
    borderColor: "border-yellow-400",
    textColor: "text-yellow-400",
    confettiColors: ["#FFD700", "#FFA500", "#FF8C00", "#FFFF00"],
    showFullNumber: true,
    showPhone: true,
  },
  {
    id: 2,
    place: "2nd Prize",
    amount: "15,000",
    color: "from-cyan-400 via-blue-400 to-cyan-500",
    icon: Award,
    bgGlow: "bg-cyan-400/20",
    borderColor: "border-cyan-400",
    textColor: "text-cyan-400",
    confettiColors: ["#22D3EE", "#38BDF8", "#60A5FA", "#93C5FD"],
    showFullNumber: true,
    showPhone: true,
  },
  {
    id: 3,
    place: "3rd Prize",
    amount: "5,000",
    color: "from-orange-400 via-orange-500 to-red-500",
    icon: Star,
    bgGlow: "bg-orange-500/20",
    borderColor: "border-orange-400",
    textColor: "text-orange-400",
    confettiColors: ["#CD7F32", "#FF6B35", "#FF8C42", "#FFA85C"],
    showFullNumber: true,
    showPhone: true,
  },
  {
    id: 4,
    place: "4th Prize",
    amount: "5",
    amountLabel: "5 Birr each",
    subtitle: "5,000 Winners",
    color: "from-purple-400 via-purple-500 to-pink-500",
    icon: Sparkles,
    bgGlow: "bg-purple-500/20",
    borderColor: "border-purple-400",
    textColor: "text-purple-400",
    confettiColors: ["#9333EA", "#C084FC", "#E879F9", "#F0ABFC"],
    showFullNumber: false, // Only show last digit
    showPhone: false, // Don't show phone number
  },
];

export default function DailyLotteryPage() {
  const [currentStep, setCurrentStep] = useState("idle"); // idle, drawing-1, winner-1, drawing-2, winner-2, drawing-3, winner-3, complete
  const [winners, setWinners] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiColors, setConfettiColors] = useState([]);
  const [windowSize, setWindowSize] = useState({ width: 600, height: 600 });
  const [rollingNumber, setRollingNumber] = useState("");
  const [rollingPhone, setRollingPhone] = useState("");
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);

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

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      // Clean up any running intervals
    };
  }, []);

  // Simulate number rolling effect
  const startRolling = (showFullNumber = true) => {
    const interval = setInterval(() => {
      if (showFullNumber) {
        // Generate random lottery number (6 digits)
        const randomLottery = Math.floor(100000 + Math.random() * 900000);
        setRollingNumber(randomLottery.toString());
      } else {
        // Generate random single digit (0-9)
        const randomDigit = Math.floor(Math.random() * 10);
        setRollingNumber(randomDigit.toString());
      }
      // Generate random phone number (09XXXXXXXX)
      const randomPhone =
        "09" + Math.floor(10000000 + Math.random() * 90000000);
      setRollingPhone(randomPhone);
    }, 50);
    return interval;
  };

  // Start drawing for a specific prize
  const startDrawing = async (prizeIndex) => {
    console.log("Starting draw for prize index:", prizeIndex);
    const prize = PRIZES[prizeIndex];
    setCurrentPrizeIndex(prizeIndex);
    setCurrentStep(`drawing-${prizeIndex + 1}`);
    setShowConfetti(false);

    // Start rolling animation (full number or last digit only)
    const interval = startRolling(prize.showFullNumber);

    // Wait for 5 seconds with rolling animation
    console.log("Rolling numbers for 5 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    try {
      // Use different API endpoint for 4th prize (consolation prize)
      const is4thPrize = prizeIndex === 3;
      const apiUrl = is4thPrize
        ? "https://v8crgwv139.execute-api.us-east-1.amazonaws.com/Stage/api/v2/ticket/drawConsolationPrize/Daily"
        : "https://v8crgwv139.execute-api.us-east-1.amazonaws.com/Stage/api/v2/ticket/drawLottery/Daily";

      console.log(`Calling API for prize ${prizeIndex + 1}:`, apiUrl);

      // All prizes use POST request with amount in body
      const fetchOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseInt(prize.amount.replace(/,/g, "")), // Remove commas and convert to number (5 for 4th prize)
        }),
      };

      const response = await fetch(apiUrl, fetchOptions);
      const data = await response.json();
      console.log("API Response:", data);

      clearInterval(interval);

      if (data.status === "SUCCESS") {
        let winnerData;

        if (is4thPrize && data.randomDigit !== undefined) {
          // Handle 4th prize (consolation prize) response
          winnerData = {
            lotteryNumber: data.randomDigit, // Store the digit
            displayNumber: data.randomDigit, // Show the digit
            phoneNumber: "", // No phone number for 4th prize
            drawnAt:
              data.winners && data.winners.length > 0
                ? data.winners[0].drawnAt
                : new Date().toISOString(),
            amount: 5,
            totalWinners: data.winners ? data.winners.length : 0,
          };
        } else if (data.winner) {
          // Handle regular prize response
          const fullLotteryNumber = data.winner.ticketNumber;
          const displayNumber = prize.showFullNumber
            ? fullLotteryNumber
            : fullLotteryNumber.slice(-1); // Last digit only

          winnerData = {
            lotteryNumber: fullLotteryNumber,
            displayNumber: displayNumber,
            phoneNumber: data.winner.phoneNumber,
            drawnAt: data.winner.drawnAt,
            amount: data.winner.amount,
          };
        } else {
          throw new Error("Invalid API response format");
        }

        console.log("Winner data:", winnerData);
        setRollingNumber(winnerData.displayNumber);
        setRollingPhone(winnerData.phoneNumber);

        setWinners((prev) => ({
          ...prev,
          [prizeIndex]: winnerData,
        }));

        setCurrentStep(`winner-${prizeIndex + 1}`);
        setConfettiColors(PRIZES[prizeIndex].confettiColors);
        setShowConfetti(true);

        // Auto hide confetti after 5 seconds
        setTimeout(() => {
          setShowConfetti(false);
        }, 5000);
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

  // Start the entire draw sequence
  const startFullSequence = () => {
    setWinners({});
    setCurrentPrizeIndex(0);
    startDrawing(0);
  };

  // Move to next prize
  const nextPrize = () => {
    const nextIndex = currentPrizeIndex + 1;
    if (nextIndex < PRIZES.length) {
      startDrawing(nextIndex);
    } else {
      setCurrentStep("complete");
    }
  };

  // Reset everything
  const resetDraw = () => {
    setCurrentStep("idle");
    setWinners({});
    setShowConfetti(false);
    setCurrentPrizeIndex(0);
    setRollingNumber("");
    setRollingPhone("");
  };

  const currentPrize = PRIZES[currentPrizeIndex];
  const isDrawing = currentStep.includes("drawing");
  const isWinnerShown = currentStep.includes("winner");

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-800 to-green-900 text-white flex flex-col items-center justify-center px-4 py-6 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-lime-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <motion.div
        className="mb-4 text-center z-10"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-300 bg-clip-text text-transparent">
            Daily Lottery Draw
          </h1>
          <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
        </div>
        <p className="text-lg text-gray-300">ዕለታዊ የእጣ ማውጫ</p>
      </motion.div>

      {/* Main Content */}
      <div className="w-full max-w-6xl z-10">
        {/* Idle State - Show all prizes */}
        {currentStep === "idle" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {PRIZES.map((prize, index) => (
                <motion.div
                  key={prize.id}
                  className={`bg-white/10 backdrop-blur-lg rounded-3xl p-6 border-2 ${prize.borderColor} shadow-2xl`}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex flex-col items-center text-center">
                    <prize.icon
                      className={`w-16 h-16 mb-4 ${prize.textColor}`}
                    />
                    <h3 className="text-2xl font-bold mb-2">{prize.place}</h3>
                    <div
                      className={`text-4xl font-extrabold bg-gradient-to-r ${prize.color} bg-clip-text text-transparent mb-2`}
                    >
                      {prize.amountLabel || `${prize.amount} Birr`}
                    </div>
                    {prize.subtitle ? (
                      <p className="text-yellow-300 text-sm font-bold mb-1">
                        {prize.subtitle}
                      </p>
                    ) : (
                      <p className="text-gray-300 text-sm">Prize Money</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-center">
              <motion.button
                onClick={startFullSequence}
                className="px-12 py-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-full text-white font-bold text-2xl shadow-2xl hover:shadow-yellow-500/50 transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                🎲 Start Draw / ዕጣ ጀምር
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Drawing State */}
        {isDrawing && currentPrize && (
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Prize Title */}
            <motion.div
              className={`mb-4 text-center p-4 rounded-2xl bg-gradient-to-r ${currentPrize.color} shadow-2xl`}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <currentPrize.icon className="w-12 h-12 mx-auto mb-2 text-white" />
              <h2 className="text-2xl font-extrabold text-white mb-1">
                {currentPrize.place}
              </h2>
              <p className="text-4xl font-black text-white">
                {currentPrize.amountLabel || `${currentPrize.amount} Birr`}
              </p>
              {currentPrize.subtitle && (
                <p className="text-lg font-semibold text-yellow-200 mt-1">
                  {currentPrize.subtitle}
                </p>
              )}
            </motion.div>

            {/* Drawing Animation */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border-4 border-white/30 shadow-2xl w-full max-w-4xl">
              <motion.div
                className="text-center mb-4"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <p className="text-2xl font-bold text-yellow-400 mb-2">
                  🎰 Drawing in Progress...
                </p>
                <p className="text-lg text-gray-300">እየወጣ ነው...</p>
              </motion.div>

              {/* Rolling Numbers Display - Side by Side */}
              <div
                className={`grid grid-cols-1 ${
                  currentPrize.showPhone ? "md:grid-cols-2" : ""
                } gap-4`}
              >
                {/* Lottery Number */}
                <div
                  className={`bg-black/50 rounded-2xl p-4 border-2 border-yellow-400 ${
                    !currentPrize.showPhone ? "mx-auto max-w-md" : ""
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Ticket className="w-5 h-5 text-yellow-400" />
                    <p className="text-base text-gray-300">
                      {currentPrize.showFullNumber
                        ? "Lottery Number"
                        : "Last Digit"}
                    </p>
                  </div>
                  <motion.div
                    className={`${
                      currentPrize.showFullNumber ? "text-5xl" : "text-7xl"
                    } font-mono font-bold text-yellow-400 text-center tracking-widest`}
                    key={rollingNumber}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.1 }}
                  >
                    {rollingNumber ||
                      (currentPrize.showFullNumber ? "------" : "-")}
                  </motion.div>
                </div>

                {/* Phone Number - Only show if prize includes it */}
                {currentPrize.showPhone && (
                  <div className="bg-black/50 rounded-2xl p-4 border-2 border-green-400">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Phone className="w-5 h-5 text-green-400" />
                      <p className="text-base text-gray-300">Phone Number</p>
                    </div>
                    <motion.div
                      className="text-4xl font-mono font-bold text-green-400 text-center tracking-wider"
                      key={rollingPhone}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.1 }}
                    >
                      {rollingPhone || "09--------"}
                    </motion.div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Winner Revealed State */}
        {isWinnerShown && currentPrize && winners[currentPrizeIndex] && (
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            {/* Winner Announcement */}
            <motion.div
              className="mb-4 text-center"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="inline-block"
                >
                  <span className="text-4xl">🎉</span>
                </motion.div>
                <h2 className="text-3xl font-extrabold text-yellow-400">
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
              className={`mb-4 p-4 rounded-2xl bg-gradient-to-r ${currentPrize.color} shadow-2xl border-4 border-white`}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <currentPrize.icon className="w-12 h-12 mx-auto mb-2 text-white" />
              <h3 className="text-xl font-bold text-white text-center mb-1">
                {currentPrize.place}
              </h3>
              <p className="text-4xl font-black text-white text-center">
                {currentPrize.amountLabel || `${currentPrize.amount} Birr`}
              </p>
              {currentPrize.subtitle && (
                <p className="text-base font-semibold text-yellow-200 text-center mt-1">
                  {currentPrize.subtitle}
                </p>
              )}
            </motion.div>

            {/* Winner Details - Compact Side by Side */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border-4 border-white/30 shadow-2xl w-full max-w-4xl mb-4">
              <div
                className={`grid grid-cols-1 ${
                  currentPrize.showPhone ? "md:grid-cols-2" : ""
                } gap-4`}
              >
                {/* Lottery Number */}
                <motion.div
                  className={`bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-4 border-4 border-yellow-400 ${
                    !currentPrize.showPhone ? "mx-auto max-w-md" : ""
                  }`}
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Ticket className="w-6 h-6 text-yellow-400" />
                    <p className="text-lg font-bold text-yellow-400">
                      {currentPrize.showFullNumber
                        ? "Lottery Number"
                        : "Last Digit"}
                    </p>
                  </div>
                  <div
                    className={`${
                      currentPrize.showFullNumber ? "text-5xl" : "text-7xl"
                    } font-mono font-black text-white text-center tracking-widest`}
                  >
                    {winners[currentPrizeIndex].displayNumber}
                  </div>
                  {!currentPrize.showFullNumber && (
                    <p className="text-center text-gray-300 text-sm mt-2">
                      Winners with tickets ending in this digit
                    </p>
                  )}
                </motion.div>

                {/* Phone Number - Only show if prize includes it */}
                {currentPrize.showPhone && (
                  <motion.div
                    className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl p-4 border-4 border-green-400"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Phone className="w-6 h-6 text-green-400" />
                      <p className="text-lg font-bold text-green-400">
                        Phone Number
                      </p>
                    </div>
                    <div className="text-4xl font-mono font-black text-white text-center tracking-wider">
                      {winners[currentPrizeIndex].phoneNumber}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              {currentPrizeIndex < PRIZES.length - 1 ? (
                <motion.button
                  onClick={nextPrize}
                  className="px-8 py-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full text-white font-bold text-lg shadow-2xl hover:shadow-green-500/50 transition-all"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                >
                  Next Prize ➡️
                </motion.button>
              ) : (
                <motion.button
                  onClick={() => setCurrentStep("complete")}
                  className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full text-white font-bold text-lg shadow-2xl hover:shadow-yellow-500/50 transition-all"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                >
                  Show All Winners 🏆
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* Complete State - Show all winners */}
        {currentStep === "complete" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="text-center mb-8"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 1 }}
            >
              <h2 className="text-5xl font-extrabold text-yellow-400 mb-4">
                🎊 All Winners Revealed! 🎊
              </h2>
              <p className="text-2xl text-gray-300">ሁሉም አሸናፊዎች!</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {PRIZES.map((prize, index) => (
                <motion.div
                  key={prize.id}
                  className={`bg-white/10 backdrop-blur-lg rounded-3xl p-6 border-4 ${prize.borderColor} shadow-2xl`}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <prize.icon
                    className={`w-12 h-12 mx-auto mb-4 ${prize.textColor}`}
                  />
                  <h3 className="text-xl font-bold text-center mb-2">
                    {prize.place}
                  </h3>
                  <div
                    className={`text-3xl font-extrabold bg-gradient-to-r ${prize.color} bg-clip-text text-transparent text-center mb-2`}
                  >
                    {prize.amountLabel || `${prize.amount} Birr`}
                  </div>
                  {prize.subtitle && (
                    <p className="text-yellow-300 text-xs font-semibold text-center mb-2">
                      {prize.subtitle}
                    </p>
                  )}

                  {winners[index] && (
                    <div className="space-y-3">
                      <div className="bg-black/50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">
                          {prize.showFullNumber ? "Lottery #" : "Last Digit"}
                        </p>
                        <p
                          className={`${
                            prize.showFullNumber ? "text-2xl" : "text-4xl"
                          } font-mono font-bold text-yellow-400`}
                        >
                          {winners[index].displayNumber}
                        </p>
                      </div>
                      {prize.showPhone && (
                        <div className="bg-black/50 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Phone</p>
                          <p className="text-xl font-mono font-bold text-blue-400">
                            {winners[index].phoneNumber}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="flex justify-center">
              <motion.button
                onClick={resetDraw}
                className="px-10 py-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-white font-bold text-xl shadow-2xl hover:shadow-red-500/50 transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
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
          numberOfPieces={300}
          recycle={false}
          gravity={0.3}
          wind={0.01}
          initialVelocityY={30}
          colors={confettiColors}
        />
      )}
    </div>
  );
}
