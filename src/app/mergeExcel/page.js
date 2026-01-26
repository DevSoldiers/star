"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { Download, Upload, Phone, FileSpreadsheet, Merge } from "lucide-react";

export default function MergeExcelPage() {
  const [files, setFiles] = useState([]);
  const [mergedPhones, setMergedPhones] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState(null);

  // Handle file upload
  const handleFileUpload = (event) => {
    const uploadedFiles = Array.from(event.target.files);
    setFiles(uploadedFiles);
    setMergedPhones([]);
    setStats(null);
  };

  // Extract all phone numbers from a cell value
  const extractPhoneNumbers = (value) => {
    if (!value) return [];

    const str = String(value).trim();
    if (!str) return [];

    // Ethiopian phone number patterns
    // Matches: 09XXXXXXXX, +251XXXXXXXXX, 251XXXXXXXXX, 07XXXXXXXX, etc.
    const phoneRegex = /(?:\+?251|0)?[79]\d{8}/g;
    const matches = str.match(phoneRegex);

    if (matches) {
      return matches.map((phone) => {
        // Normalize to 09XXXXXXXX format
        phone = phone.replace(/\s+/g, "");
        if (phone.startsWith("+251")) {
          phone = "0" + phone.slice(4);
        } else if (phone.startsWith("251")) {
          phone = "0" + phone.slice(3);
        }
        // Ensure the number starts with 0
        if (!phone.startsWith("0")) {
          phone = "0" + phone;
        }
        return phone;
      });
    }

    // If no regex match but looks like a phone number (10 digits starting with 0)
    if (/^0[79]\d{8}$/.test(str)) {
      return [str];
    }

    return [];
  };

  // Process all files and merge phone numbers
  const processFiles = async () => {
    setIsProcessing(true);
    const allPhones = new Set(); // Use Set to avoid duplicates
    let totalFiles = 0;
    let totalSheets = 0;
    let totalColumns = 0;

    try {
      for (const file of files) {
        totalFiles++;
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });

        // Process each sheet in the workbook
        workbook.SheetNames.forEach((sheetName) => {
          totalSheets++;
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // Process each row
          jsonData.forEach((row) => {
            if (Array.isArray(row)) {
              // Process each cell in the row
              row.forEach((cell) => {
                const phones = extractPhoneNumbers(cell);
                phones.forEach((phone) => allPhones.add(phone));
              });
            }
          });

          // Count columns
          const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
          totalColumns += range.e.c - range.s.c + 1;
        });
      }

      const phoneArray = Array.from(allPhones).sort();
      setMergedPhones(phoneArray);
      setStats({
        files: totalFiles,
        sheets: totalSheets,
        columns: totalColumns,
        totalPhones: phoneArray.length,
      });
    } catch (error) {
      console.error("Error processing files:", error);
      alert(
        "Error processing files. Please make sure they are valid Excel/CSV files."
      );
    }

    setIsProcessing(false);
  };

  // Download merged phone numbers as Excel
  const downloadExcel = () => {
    if (mergedPhones.length === 0) return;

    const worksheet = XLSX.utils.aoa_to_sheet([
      ["Phone Number"],
      ...mergedPhones.map((phone) => [phone]),
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Merged Phones");

    XLSX.writeFile(workbook, `merged_phones_${Date.now()}.xlsx`);
  };

  // Download as CSV
  const downloadCSV = () => {
    if (mergedPhones.length === 0) return;

    const csvContent = "Phone Number\n" + mergedPhones.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `merged_phones_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <FileSpreadsheet className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Excel Phone Number Merger
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Merge phone numbers from multiple Excel/CSV files into one column
          </p>
          <p className="text-gray-500 text-sm mt-1">
            የስልክ ቁጥሮችን ከተለያዩ ኤክሴል ፋይሎች ወደ አንድ አምድ ያዋህዱ
          </p>
        </motion.div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6"
        >
          <div className="border-4 border-dashed border-blue-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
            <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <span className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full font-semibold inline-block hover:shadow-lg transition-shadow">
                📁 Choose Excel/CSV Files
              </span>
            </label>
            <p className="text-gray-500 mt-4">
              Select one or more Excel (.xlsx, .xls) or CSV files
            </p>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6"
            >
              <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Selected Files ({files.length})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                ))}
              </div>

              {/* Process Button */}
              <motion.button
                onClick={processFiles}
                disabled={isProcessing}
                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                whileTap={{ scale: isProcessing ? 1 : 0.98 }}
              >
                {isProcessing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        ease: "linear",
                      }}
                    >
                      🔄
                    </motion.div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Merge className="w-5 h-5" />
                    Merge Phone Numbers
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {mergedPhones.length > 0 && stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Statistics */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Phone className="w-6 h-6 text-blue-600" />
                  Merge Statistics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-xl text-center">
                    <div className="text-3xl font-black text-blue-600">
                      {stats.files}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Files</div>
                  </div>
                  <div className="bg-cyan-50 p-4 rounded-xl text-center">
                    <div className="text-3xl font-black text-cyan-600">
                      {stats.sheets}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Sheets</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl text-center">
                    <div className="text-3xl font-black text-green-600">
                      {stats.columns}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Columns</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl text-center">
                    <div className="text-3xl font-black text-purple-600">
                      {stats.totalPhones}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Unique Phones
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone Numbers Preview */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Merged Phone Numbers (Preview)
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto font-mono text-sm">
                  {mergedPhones.slice(0, 50).map((phone, index) => (
                    <div
                      key={index}
                      className="py-1 border-b border-gray-200 last:border-0"
                    >
                      {phone}
                    </div>
                  ))}
                  {mergedPhones.length > 50 && (
                    <div className="text-gray-500 text-center mt-2">
                      ... and {mergedPhones.length - 50} more
                    </div>
                  )}
                </div>
              </div>

              {/* Download Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.button
                  onClick={downloadExcel}
                  className="px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-5 h-5" />
                  Download Excel (.xlsx)
                </motion.button>
                <motion.button
                  onClick={downloadCSV}
                  className="px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-5 h-5" />
                  Download CSV (.csv)
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-blue-50 rounded-xl p-6"
        >
          <h3 className="font-bold text-blue-900 mb-3">How to Use:</h3>
          <ol className="space-y-2 text-blue-800 text-sm">
            <li>
              1. Click "Choose Excel/CSV Files" and select one or more files
            </li>
            <li>2. Click "Merge Phone Numbers" to process the files</li>
            <li>
              3. The tool will extract all phone numbers from all sheets and
              columns
            </li>
            <li>4. Duplicates are automatically removed</li>
            <li>5. Download the result as Excel or CSV format</li>
          </ol>
          <p className="text-blue-700 mt-3 text-xs">
            ℹ️ Supports Ethiopian phone formats: 09XXXXXXXX, +251XXXXXXXXX,
            07XXXXXXXX
          </p>
        </motion.div>
      </div>
    </div>
  );
}
