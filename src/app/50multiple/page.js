"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Download, Users, Trophy, Phone, Ticket } from "lucide-react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

const API_BASE_URL =
  "https://v8crgwv139.execute-api.us-east-1.amazonaws.com/Stage/api/v2";

export default function FiftyMultiplePage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [winners, setWinners] = useState(null);
  const [error, setError] = useState("");
  const [drawInfo, setDrawInfo] = useState(null);

  const drawDates = [
    { startDate: "2025-12-24", endDate: "2025-12-25" },
    { startDate: "2025-12-26", endDate: "2025-12-27" },
    { startDate: "2025-12-28", endDate: "2025-12-29" },
    { startDate: "2025-12-31", endDate: "2026-01-01" },
    { startDate: "2026-01-02", endDate: "2026-01-03" },
    { startDate: "2026-01-04", endDate: "2026-01-05" },
    { startDate: "2026-01-07", endDate: "2026-01-08" },
    { startDate: "2026-01-09", endDate: "2026-01-10" },
    { startDate: "2026-01-11", endDate: "2026-01-12" },
  ];

  // Set default dates (today as end date, 7 days ago as start date)
  useEffect(() => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    setEndDate(today.toISOString().split("T")[0]);
    setStartDate(sevenDaysAgo.toISOString().split("T")[0]);
  }, []);

  const handleDraw = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
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

      console.log("Calling API:", apiUrl);
      console.log("Processing", drawDates.length, "date ranges");

      // Create an array of promises for all API calls
      const apiPromises = drawDates.map(async (dDate) => {
        console.log("Request body:", {
          amount: 50000,
          startDate: dDate.startDate,
          endDate: dDate.endDate,
        });

        try {
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              amount: 50000,
              startDate: dDate.startDate,
              endDate: dDate.endDate,
            }),
          });

          const data = await response.json();
          console.log(
            "API Response for",
            dDate.startDate,
            "to",
            dDate.endDate,
            ":",
            data
          );

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
            console.warn(
              "API call failed for",
              dDate.startDate,
              "to",
              dDate.endDate,
              ":",
              data.message
            );
            return [];
          }
        } catch (err) {
          console.error(
            "Error calling API for",
            dDate.startDate,
            "to",
            dDate.endDate,
            ":",
            err
          );
          return [];
        }
      });

      // Wait for all API calls to complete
      const allResults = await Promise.all(apiPromises);

      // Flatten all winners into a single array
      const allWinners = allResults.flat();

      console.log("Total winners collected:", allWinners.length);
      console.log("Winners list:", allWinners);

      if (allWinners.length > 0) {
        setWinners(allWinners);
        setDrawInfo({
          startDate: drawDates[0].startDate,
          endDate: drawDates[drawDates.length - 1].endDate,
        });
        setError("");
      } else {
        setError("No winners found from any date range");
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
      Amount: winner.amount || 50000,
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

    const fileName = `50K_Winners_${startDate.replace(
      /-/g,
      "_"
    )}_to_${endDate.replace(/-/g, "_")}.xlsx`;
    saveAs(blob, fileName);
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
            50,000 Birr Prize Draw
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-lg">
            <Calendar className="w-5 h-5" />
            <span className="font-bold">Date Range Draw</span>
          </div>
        </motion.div>

        {/* Date Selection Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 md:p-10 shadow-2xl border-4 border-gray-400 mb-8"
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
                  className="w-full px-5 py-4 border-4 border-gray-400 rounded-xl text-lg font-semibold text-gray-800 bg-white focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-200 transition-all shadow-lg"
                  style={{
                    colorScheme: "light",
                    backgroundColor: "white",
                  }}
                />
                <style jsx>{`
                  input[type="date"]::-webkit-calendar-picker-indicator {
                    cursor: pointer;
                    background-color: #10b981;
                    border-radius: 4px;
                    padding: 4px;
                    margin-right: 4px;
                  }
                  input[type="date"]::-webkit-calendar-picker-indicator:hover {
                    background-color: #059669;
                  }
                  input[type="date"] {
                    color: #1f2937;
                  }
                  input[type="date"]:focus {
                    border-color: #10b981;
                    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
                  }
                `}</style>
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
                  className="w-full px-5 py-4 border-4 border-gray-400 rounded-xl text-lg font-semibold text-gray-800 bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all shadow-lg"
                  style={{
                    colorScheme: "light",
                    backgroundColor: "white",
                  }}
                />
                <style jsx>{`
                  input[type="date"]::-webkit-calendar-picker-indicator {
                    cursor: pointer;
                    background-color: #3b82f6;
                    border-radius: 4px;
                    padding: 4px;
                    margin-right: 4px;
                  }
                  input[type="date"]::-webkit-calendar-picker-indicator:hover {
                    background-color: #2563eb;
                  }
                  input[type="date"] {
                    color: #1f2937;
                  }
                  input[type="date"]:focus {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
                  }
                `}</style>
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
          </div>

          {/* Draw Button */}
          <div className="flex justify-center">
            <motion.button
              onClick={handleDraw}
              disabled={isLoading || !startDate || !endDate}
              className={`px-10 py-4 rounded-xl font-bold text-xl shadow-2xl transition-all border-4 border-white min-w-[180px] ${
                isLoading || !startDate || !endDate
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : "bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 text-white hover:shadow-gray-600/50 hover:scale-105 active:scale-95"
              }`}
              whileHover={
                !isLoading && startDate && endDate ? { scale: 1.05 } : {}
              }
              whileTap={
                !isLoading && startDate && endDate ? { scale: 0.95 } : {}
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
                      Prize: 50,000 Birr Each
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
                  className="bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl p-6 border-4 border-gray-400 shadow-xl hover:shadow-2xl hover:border-gray-500 transition-all relative overflow-hidden group"
                >
                  {/* Decorative corner badge */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-bl-full opacity-20 group-hover:opacity-30 transition-opacity"></div>

                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <span className="text-3xl font-extrabold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      #{index + 1}
                    </span>
                    <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg shadow-lg text-lg">
                      {winner.amount || 50000} Birr
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
                        <span className="text-lg font-bold text-gray-800 block">
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
              Select start and end dates above and click "Start Draw" to begin
              the lottery draw
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
