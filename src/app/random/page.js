"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Download,
  Users,
  Trophy,
  Phone,
  Ticket,
  DollarSign,
  Hash,
} from "lucide-react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

const API_BASE_URL =
  "https://v8crgwv139.execute-api.us-east-1.amazonaws.com/Stage/api/v2";

export default function RandomLotteryPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [amount, setAmount] = useState("");
  const [numberOfWinners, setNumberOfWinners] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [winners, setWinners] = useState(null);
  const [error, setError] = useState("");
  const [drawInfo, setDrawInfo] = useState(null);

  // Set default dates (today as end date, 7 days ago as start date)
  useEffect(() => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    setEndDate(today.toISOString().split("T")[0]);
    setStartDate(sevenDaysAgo.toISOString().split("T")[0]);
  }, []);

  const handleDraw = async () => {
    // Validation
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!numberOfWinners || parseInt(numberOfWinners) <= 0) {
      setError("Please enter a valid number of winners");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date must be before or equal to end date");
      return;
    }

    setIsLoading(true);
    setError("");
    setWinners(null);
    setDrawInfo(null);

    try {
      const apiUrl = `${API_BASE_URL}/ticket/drawLottery/60Million`;
      const winnersCount = parseInt(numberOfWinners);
      const prizeAmount = parseFloat(amount);

      console.log("Calling API:", apiUrl);
      console.log("Drawing", winnersCount, "winners");
      console.log("Amount:", prizeAmount);
      console.log("Date range:", startDate, "to", endDate);

      // Create an array of promises for all API calls (one per winner)
      const apiPromises = Array.from(
        { length: winnersCount },
        async (_, index) => {
          console.log(`API Call ${index + 1}/${winnersCount}:`, {
            amount: prizeAmount,
            startDate: startDate,
            endDate: endDate,
          });

          try {
            const response = await fetch(apiUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                amount: prizeAmount,
                startDate: startDate,
                endDate: endDate,
              }),
            });

            const data = await response.json();
            console.log(`API Response ${index + 1}:`, data);

            if (data.status === "SUCCESS" || data.status === "success") {
              // Handle both single winner and multiple winners
              let winnersFromThisCall = [];
              if (data.winner) {
                winnersFromThisCall = [data.winner];
              } else if (data.winners && Array.isArray(data.winners)) {
                winnersFromThisCall = data.winners;
              } else if (data.data && Array.isArray(data.data)) {
                winnersFromThisCall = data.data;
              }
              return winnersFromThisCall;
            } else {
              console.warn(`API call ${index + 1} failed:`, data.message);
              return [];
            }
          } catch (err) {
            console.error(`Error calling API ${index + 1}:`, err);
            return [];
          }
        }
      );

      // Wait for all API calls to complete
      const allResults = await Promise.all(apiPromises);

      // Flatten all winners into a single array
      const allWinners = allResults.flat();

      console.log("Total winners collected:", allWinners.length);
      console.log("Winners list:", allWinners);

      if (allWinners.length > 0) {
        setWinners(allWinners);
        setDrawInfo({
          startDate: startDate,
          endDate: endDate,
          amount: prizeAmount,
          requestedWinners: winnersCount,
        });
        setError("");
      } else {
        setError(
          "No winners found. Please try again with different parameters."
        );
      }
    } catch (err) {
      console.error("Error calling API:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!winners || winners.length === 0) {
      alert("No winners to export");
      return;
    }

    // Prepare data for Excel
    const excelData = winners.map((winner, index) => ({
      "S.No": index + 1,
      "Ticket Number": winner.ticketNumber,
      "Phone Number": winner.phoneNumber,
      Amount: winner.amount || amount,
      "Drawn At": winner.drawnAt
        ? new Date(winner.drawnAt).toLocaleString()
        : new Date().toLocaleString(),
      "Lottery ID": winner.lottery || "",
      "Ticket Group": winner.ticketGroup || "",
      "User ID": winner.user || "",
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Winners");

    // Set column widths
    const columnWidths = [
      { wch: 8 }, // S.No
      { wch: 15 }, // Ticket Number
      { wch: 18 }, // Phone Number
      { wch: 12 }, // Amount
      { wch: 25 }, // Drawn At
      { wch: 30 }, // Lottery ID
      { wch: 30 }, // Ticket Group
      { wch: 30 }, // User ID
    ];
    worksheet["!cols"] = columnWidths;

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    // Create blob and download
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const fileName = `Lottery_Winners_${amount}_Birr_${startDate.replace(
      /-/g,
      "_"
    )}_to_${endDate.replace(/-/g, "_")}.xlsx`;
    saveAs(blob, fileName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-blue-50 p-6 md:p-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl"></div>
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
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-800 via-blue-700 to-purple-900 bg-clip-text text-transparent drop-shadow-lg">
              General Lottery Draw
            </h1>
            <Trophy className="w-12 h-12 md:w-16 md:h-16 text-yellow-500 drop-shadow-lg" />
          </motion.div>
          <p className="text-xl md:text-2xl text-gray-700 font-semibold mb-2">
            Custom Amount & Multiple Winners
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-full shadow-lg">
            <Calendar className="w-5 h-5" />
            <span className="font-bold">Flexible Draw System</span>
          </div>
        </motion.div>

        {/* Input Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-white to-purple-50 rounded-3xl p-8 md:p-10 shadow-2xl border-4 border-purple-400 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Start Date */}
            <div className="flex-1 w-full">
              <label className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg text-white">
                  <Calendar className="w-5 h-5" />
                </div>
                <span>Start Date</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate || new Date().toISOString().split("T")[0]}
                  className="w-full px-5 py-4 border-4 border-purple-400 rounded-xl text-lg font-semibold text-gray-800 bg-white focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-200 transition-all shadow-lg"
                  style={{
                    colorScheme: "light",
                    backgroundColor: "white",
                  }}
                />
              </div>
              {startDate && (
                <p className="mt-2 text-sm text-gray-600 font-medium">
                  Start:{" "}
                  {new Date(startDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>

            {/* End Date */}
            <div className="flex-1 w-full">
              <label className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white">
                  <Calendar className="w-5 h-5" />
                </div>
                <span>End Date</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-5 py-4 border-4 border-purple-400 rounded-xl text-lg font-semibold text-gray-800 bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all shadow-lg"
                  style={{
                    colorScheme: "light",
                    backgroundColor: "white",
                  }}
                />
              </div>
              {endDate && (
                <p className="mt-2 text-sm text-gray-600 font-medium">
                  End:{" "}
                  {new Date(endDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>

            {/* Amount Field */}
            <div className="flex-1 w-full">
              <label className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg text-white">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span>Prize Amount (Birr)</span>
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (e.g., 50000)"
                min="1"
                step="1"
                className="w-full px-5 py-4 border-4 border-purple-400 rounded-xl text-lg font-semibold text-gray-800 bg-white focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-200 transition-all shadow-lg"
              />
              {amount && parseFloat(amount) > 0 && (
                <p className="mt-2 text-sm text-gray-600 font-medium">
                  Prize: {parseFloat(amount).toLocaleString()} Birr per winner
                </p>
              )}
            </div>

            {/* Number of Winners Field */}
            <div className="flex-1 w-full">
              <label className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg text-white">
                  <Hash className="w-5 h-5" />
                </div>
                <span>Number of Winners</span>
              </label>
              <input
                type="number"
                value={numberOfWinners}
                onChange={(e) => setNumberOfWinners(e.target.value)}
                placeholder="Enter number (e.g., 5)"
                min="1"
                step="1"
                className="w-full px-5 py-4 border-4 border-purple-400 rounded-xl text-lg font-semibold text-gray-800 bg-white focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all shadow-lg"
              />
              {numberOfWinners && parseInt(numberOfWinners) > 0 && (
                <p className="mt-2 text-sm text-gray-600 font-medium">
                  Will draw {numberOfWinners} winner
                  {parseInt(numberOfWinners) > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          {/* Draw Button */}
          <div className="flex justify-center">
            <motion.button
              onClick={handleDraw}
              disabled={
                isLoading ||
                !startDate ||
                !endDate ||
                !amount ||
                !numberOfWinners
              }
              className={`px-10 py-4 rounded-xl font-bold text-xl shadow-2xl transition-all border-4 border-white min-w-[200px] ${
                isLoading ||
                !startDate ||
                !endDate ||
                !amount ||
                !numberOfWinners
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : "bg-gradient-to-r from-purple-800 via-blue-700 to-purple-900 text-white hover:shadow-purple-600/50 hover:scale-105 active:scale-95"
              }`}
              whileHover={
                !isLoading && startDate && endDate && amount && numberOfWinners
                  ? { scale: 1.05 }
                  : {}
              }
              whileTap={
                !isLoading && startDate && endDate && amount && numberOfWinners
                  ? { scale: 0.95 }
                  : {}
              }
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
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
                  Drawing...
                </span>
              ) : (
                "🎲 Start Draw"
              )}
            </motion.button>
          </div>
        </motion.div>

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
            className="bg-gradient-to-br from-white to-purple-50 rounded-3xl p-6 md:p-10 shadow-2xl border-4 border-purple-400"
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
                {drawInfo && (
                  <div className="space-y-1 text-gray-700 font-semibold">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <span>
                        Period:{" "}
                        {new Date(drawInfo.startDate).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}{" "}
                        -{" "}
                        {new Date(drawInfo.endDate).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      Prize: {drawInfo.amount.toLocaleString()} Birr Each
                    </div>
                    <div className="text-sm text-gray-600">
                      Requested: {drawInfo.requestedWinners} winner
                      {drawInfo.requestedWinners > 1 ? "s" : ""} | Found:{" "}
                      {winners.length}
                    </div>
                  </div>
                )}
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
                  key={winner._id || winner.ticketNumber || index}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gradient-to-br from-white via-purple-50 to-white rounded-2xl p-6 border-4 border-purple-400 shadow-xl hover:shadow-2xl hover:border-purple-500 transition-all relative overflow-hidden group"
                >
                  {/* Decorative corner badge */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-bl-full opacity-20 group-hover:opacity-30 transition-opacity"></div>

                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <span className="text-3xl font-extrabold bg-gradient-to-r from-purple-800 to-blue-600 bg-clip-text text-transparent">
                      #{index + 1}
                    </span>
                    <span className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold rounded-lg shadow-lg text-lg">
                      {winner.amount || amount} Birr
                    </span>
                  </div>
                  <div className="space-y-3 relative z-10">
                    <div className="flex items-center gap-3 p-3 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors">
                      <div className="p-2 bg-blue-500 rounded-lg text-white">
                        <Ticket className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase">
                          Ticket Number
                        </span>
                        <span className="text-lg font-bold text-gray-800 block">
                          {winner.ticketNumber}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors">
                      <div className="p-2 bg-green-500 rounded-lg text-white">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase">
                          Phone Number
                        </span>
                        <span className="text-lg font-bold text-gray-800 block">
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
            className="bg-gradient-to-br from-white to-purple-50 rounded-3xl p-16 shadow-2xl border-4 border-purple-400 text-center"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Users className="w-24 h-24 text-purple-400 mx-auto mb-6" />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">
              Ready to Draw Winners
            </h3>
            <p className="text-lg text-gray-600">
              Enter the date range, prize amount, and number of winners, then
              click "Start Draw" to begin
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
