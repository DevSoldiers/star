"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Download, Users, Trophy, Phone, Ticket } from "lucide-react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

const API_BASE_URL =
  "https://v8crgwv139.execute-api.us-east-1.amazonaws.com/Stage/api/v2";

export default function MultipleDrawPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [winners, setWinners] = useState(null);
  const [error, setError] = useState("");
  const [anticipationStep, setAnticipationStep] = useState("idle"); // idle, loading, revealing, complete
  const [rollingNumbers, setRollingNumbers] = useState([]);

  // Generate random rolling numbers for anticipation
  const generateRollingNumber = () => {
    return Math.floor(1000000 + Math.random() * 9000000).toString();
  };

  const generateRollingPhone = () => {
    return "+2519" + Math.floor(10000000 + Math.random() * 90000000).toString();
  };

  const handleDraw = async () => {
    setIsLoading(true);
    setError("");
    setWinners(null);
    setAnticipationStep("loading");

    // Phase 1: Anticipation - Rolling numbers animation
    const rollingInterval = setInterval(() => {
      const randomNumbers = Array.from({ length: 5 }, () => ({
        ticket: generateRollingNumber(),
        phone: generateRollingPhone(),
      }));
      setRollingNumbers(randomNumbers);
    }, 100);

    // Wait for anticipation period (3 seconds)
    await new Promise((resolve) => setTimeout(resolve, 3000));
    clearInterval(rollingInterval);

    setAnticipationStep("revealing");

    // Small delay before revealing
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      // Load Excel file from public folder
      const excelFilePath =
        "/daily_winners_60Million_2025-12-23_to_2026-01-15_1000.xlsx";
      console.log("Loading Excel file:", excelFilePath);

      const response = await fetch(excelFilePath);
      if (!response.ok) {
        throw new Error("Failed to load Excel file");
      }

      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      // Get the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convert to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      console.log("Excel data loaded:", jsonData.length, "rows");

      // Skip header row and convert to winner objects
      const winnersData = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (row && row.length > 0 && row[1]) {
          winnersData.push({
            ticketNumber: String(row[1] || "").trim(),
            phoneNumber: String(row[2] || "").trim(),
            amount: row[3] || 1000,
            drawnAt: row[4]
              ? new Date(row[4]).toISOString()
              : new Date().toISOString(),
            lottery: row[5] || "",
            ticketGroup: row[6] || "",
            user: row[7] || "",
            _id: `excel-${i}`,
          });
        }
      }

      console.log("Parsed winners:", winnersData.length);

      if (winnersData.length > 0) {
        // Reveal winners one by one with delay
        setAnticipationStep("revealing");
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setWinners(winnersData);
        setAnticipationStep("complete");
        setError("");
      } else {
        setError("No winners found in Excel file");
        setAnticipationStep("idle");
      }
    } catch (err) {
      console.error("Error loading Excel file:", err);
      setError(
        "Failed to load Excel file. Please ensure the file exists in the public folder."
      );
      setAnticipationStep("idle");
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = async () => {
    try {
      // Download the existing Excel file from public folder
      const excelFilePath =
        "/daily_winners_60Million_2025-12-23_to_2026-01-15_1000.xlsx";

      const response = await fetch(excelFilePath);
      if (!response.ok) {
        throw new Error("Failed to load Excel file");
      }

      const blob = await response.blob();
      saveAs(
        blob,
        "daily_winners_60Million_2025-12-23_to_2026-01-15_1000.xlsx"
      );
    } catch (err) {
      console.error("Error downloading Excel file:", err);
      alert("Failed to download Excel file. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 p-6 md:p-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gray-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gray-300/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <motion.div
            className="flex items-center justify-center gap-4 mb-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Trophy className="w-12 h-12 md:w-16 md:h-16 text-yellow-500 drop-shadow-lg" />
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 bg-clip-text text-transparent drop-shadow-lg">
              60 Million Lottery
            </h1>
            <Trophy className="w-12 h-12 md:w-16 md:h-16 text-yellow-500 drop-shadow-lg" />
          </motion.div>
          <p className="text-xl md:text-2xl text-gray-700 font-semibold mb-2">
            Multiple Draw
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-lg">
            <Users className="w-5 h-5" />
            <span className="font-bold">30 Winners</span>
            <span className="mx-2">•</span>
            <span className="font-bold">1,000 Birr Each</span>
          </div>
        </motion.div>

        {/* Start Draw Button Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 md:p-10 shadow-2xl border-4 border-gray-400 mb-8 text-center"
        >
          <motion.button
            onClick={handleDraw}
            disabled={isLoading}
            className={`px-12 py-6 rounded-xl font-bold text-2xl shadow-2xl transition-all border-4 border-white ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 text-white hover:shadow-gray-600/50"
            }`}
            whileHover={!isLoading ? { scale: 1.05 } : {}}
            whileTap={!isLoading ? { scale: 0.95 } : {}}
            animate={!isLoading ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {isLoading ? (
              <span className="flex items-center gap-3">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  ⏳
                </motion.span>
                Drawing Winners...
              </span>
            ) : (
              "🎲 Start Draw / ዕጣ ጀምር"
            )}
          </motion.button>
        </motion.div>

        {/* Anticipation Animation */}
        {(anticipationStep === "loading" ||
          anticipationStep === "revealing") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 md:p-10 shadow-2xl border-4 border-gray-400 mb-8"
          >
            <motion.div
              className="text-center mb-6"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-2">
                🎰 Drawing Winners...
              </h2>
              <p className="text-xl text-gray-600">እየወጣ ነው...</p>
            </motion.div>

            {/* Rolling Numbers Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rollingNumbers.map((item, index) => (
                <motion.div
                  key={index}
                  className="bg-gradient-to-br from-gray-100 to-white rounded-xl p-4 border-4 border-gray-400"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: index * 0.1,
                  }}
                >
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-600 mb-2">
                      #{index + 1}
                    </p>
                    <motion.div
                      className="text-2xl font-mono font-bold text-gray-800 mb-1"
                      key={item.ticket}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.1 }}
                    >
                      {item.ticket}
                    </motion.div>
                    <motion.div
                      className="text-lg font-mono font-bold text-gray-700"
                      key={item.phone}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.1 }}
                    >
                      {item.phone}
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-red-100 to-red-50 border-4 border-red-500 rounded-xl p-6 mb-6 text-red-700 font-bold text-center shadow-xl"
          >
            <div className="text-2xl mb-2">⚠️</div>
            {error}
          </motion.div>
        )}

        {/* Winners Display */}
        {winners && winners.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-6 md:p-10 shadow-2xl border-4 border-gray-400"
          >
            {/* Header with Export Button */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
              <div>
                <motion.h2
                  className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-3 flex items-center gap-3"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-4xl">🎉</span>
                  Winners ({winners.length})
                </motion.h2>
                <div className="flex items-center gap-2 text-gray-700 font-semibold">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>
                    Drawn on:{" "}
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <motion.button
                onClick={exportToExcel}
                className="px-8 py-4 bg-gradient-to-r from-green-600 via-green-500 to-green-700 text-white font-bold rounded-xl shadow-2xl hover:shadow-green-500/50 transition-all border-4 border-white flex items-center gap-3 text-lg"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download className="w-6 h-6" />
                Export to Excel
              </motion.button>
            </div>

            {/* Winners Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {winners.map((winner, index) => (
                <motion.div
                  key={winner._id || index}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl p-6 border-4 border-gray-400 shadow-xl hover:shadow-2xl hover:border-gray-500 transition-all relative overflow-hidden group"
                >
                  {/* Decorative corner badge */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-bl-full opacity-20 group-hover:opacity-30 transition-opacity"></div>

                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <span className="text-3xl font-extrabold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      #{index + 1}
                    </span>
                    <span className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg shadow-lg text-lg">
                      {winner.amount} Birr
                    </span>
                  </div>
                  <div className="space-y-3 relative z-10">
                    <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                      <div className="p-2 bg-blue-500 rounded-lg text-white">
                        <Ticket className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase">
                          Ticket Number
                        </span>
                        <span className="text-lg font-bold text-gray-800">
                          {winner.ticketNumber}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                      <div className="p-2 bg-green-500 rounded-lg text-white">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase">
                          Phone Number
                        </span>
                        <span className="text-lg font-bold text-gray-800">
                          {winner.phoneNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!winners && !isLoading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-16 shadow-2xl border-4 border-gray-400 text-center"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Users className="w-24 h-24 text-gray-400 mx-auto mb-6" />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">
              Ready to Draw Winners
            </h3>
            <p className="text-lg text-gray-600">
              Click "Start Draw" above to begin the lottery draw
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
