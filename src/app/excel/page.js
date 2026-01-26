"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Papa from "papaparse";

export default function ExcelCsvSplitter() {
  const [chunkSize, setChunkSize] = useState(1000000);
  const [loading, setLoading] = useState(false);
  const [fileNamePrefix, setFileNamePrefix] = useState("Newchunk");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [outputFormat, setOutputFormat] = useState("csv"); // csv or excel

  const exportChunkAsync = async (dataChunk, index, format = "csv") => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (format === "csv") {
            // CSV export - much smaller file size and faster
            const header = "Phone\n";
            const csvContent =
              header + dataChunk.map((row) => row[0]).join("\n");
            const blob = new Blob([csvContent], {
              type: "text/csv;charset=utf-8;",
            });
            saveAs(blob, `${fileNamePrefix}_${index}.csv`);
          } else {
            // Excel export - larger files but better compatibility
            const MAX_ROWS = 500000;

            if (dataChunk.length > MAX_ROWS) {
              // Split large chunk into sub-chunks
              const subChunks = Math.ceil(dataChunk.length / MAX_ROWS);

              for (let i = 0; i < subChunks; i++) {
                const start = i * MAX_ROWS;
                const end = Math.min(start + MAX_ROWS, dataChunk.length);
                const subChunk = dataChunk.slice(start, end);

                const header = [["Phone"]];
                const finalData = header.concat(subChunk);
                const ws = XLSX.utils.aoa_to_sheet(finalData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, `Chunk_${index}_${i + 1}`);
                const wbout = XLSX.write(wb, {
                  bookType: "xlsx",
                  type: "array",
                  compression: true, // Enable compression to reduce file size
                });
                const blob = new Blob([wbout], {
                  type: "application/octet-stream",
                });
                saveAs(blob, `${fileNamePrefix}_${index}_part${i + 1}.xlsx`);
              }
            } else {
              // Normal export for smaller chunks
              const header = [["Phone"]];
              const finalData = header.concat(dataChunk);
              const ws = XLSX.utils.aoa_to_sheet(finalData);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, `Chunk_${index}`);
              const wbout = XLSX.write(wb, {
                bookType: "xlsx",
                type: "array",
                compression: true, // Enable compression to reduce file size
              });
              const blob = new Blob([wbout], {
                type: "application/octet-stream",
              });
              saveAs(blob, `${fileNamePrefix}_${index}.xlsx`);
            }
          }
          resolve();
        } catch (error) {
          console.error("Export error:", error);
          reject(error);
        }
      }, 0);
    });
  };

  const handleExcelUpload = async (file) => {
    console.log("Starting Excel upload handler");
    setLoading(true);
    setProgress("Reading Excel file...");
    setError("");

    const reader = new FileReader();
    reader.onload = async (e) => {
      console.log("FileReader onload triggered");
      try {
        const data = e.target.result;
        console.log("Data loaded, buffer length:", data.byteLength);

        setProgress("Parsing Excel file...");

        // Read as array buffer for better memory efficiency
        const workbook = XLSX.read(data, {
          type: "array",
          cellDates: false,
          cellNF: false,
          cellText: false,
          cellStyles: false,
          sheetStubs: false, // Skip empty cells
          bookVBA: false, // Skip VBA
          bookDeps: false, // Skip dependencies
        });

        // Get the first sheet
        console.log("Workbook sheets:", workbook.SheetNames);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
          throw new Error("No worksheet found in the Excel file.");
        }

        console.log("Worksheet found:", firstSheetName);

        // Get the range to understand data size
        const range = XLSX.utils.decode_range(worksheet["!ref"]);
        const totalRows = range.e.r - range.s.r; // End row - Start row
        console.log("Total rows in sheet:", totalRows);

        if (totalRows === 0) {
          throw new Error("Excel file appears to be empty.");
        }

        setProgress(
          `Found approximately ${totalRows.toLocaleString()} rows. Processing in batches...`
        );

        const totalChunks = Math.ceil(totalRows / chunkSize);
        let chunkIndex = 1;
        let processedRows = 0;

        // Process in batches to avoid memory overflow
        const BATCH_SIZE = Math.min(chunkSize, 100000); // Process max 100k rows at a time

        for (
          let startRow = range.s.r + 1;
          startRow <= range.e.r;
          startRow += chunkSize
        ) {
          const endRow = Math.min(startRow + chunkSize - 1, range.e.r);
          const chunkData = [];

          // Read rows in smaller batches within the chunk
          for (
            let batchStart = startRow;
            batchStart <= endRow;
            batchStart += BATCH_SIZE
          ) {
            const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, endRow);

            setProgress(
              `Processing chunk ${chunkIndex} of ${totalChunks} (rows ${batchStart} to ${batchEnd})...`
            );

            // Extract data for this batch
            for (let rowNum = batchStart; rowNum <= batchEnd; rowNum++) {
              const cellAddress = XLSX.utils.encode_cell({
                r: rowNum,
                c: range.s.c,
              });
              const cell = worksheet[cellAddress];

              if (cell && cell.v !== undefined && cell.v !== null) {
                const value = String(cell.v).trim();
                if (value !== "") {
                  chunkData.push([value]);
                }
              }
            }

            // Allow UI to breathe
            await new Promise((resolve) => setTimeout(resolve, 10));
          }

          if (chunkData.length > 0) {
            setProgress(
              `Exporting chunk ${chunkIndex} of ${totalChunks} (${chunkData.length.toLocaleString()} rows)...`
            );

            await exportChunkAsync(chunkData, chunkIndex, outputFormat);
            processedRows += chunkData.length;
            chunkIndex++;
          }

          // Force garbage collection hint
          if (typeof global !== "undefined" && global.gc) {
            global.gc();
          }

          // Allow browser to free memory
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        setProgress(
          `✅ Complete! Created ${
            chunkIndex - 1
          } file(s) from ${processedRows.toLocaleString()} rows.`
        );
        setLoading(false);
        setFileInputKey(Date.now());
        setTimeout(() => setProgress(""), 5000);
      } catch (error) {
        console.error("Excel parsing error:", error);
        let errorMsg = error.message || "Failed to parse the Excel file.";

        // Detect memory errors
        if (
          error.message &&
          (error.message.includes("memory") ||
            error.message.includes("allocation"))
        ) {
          errorMsg =
            "File too large for browser memory. Try using a smaller file or split it externally first.";
        }

        setError(errorMsg);
        setLoading(false);
        setProgress("");
      }
    };

    reader.onerror = () => {
      console.error("FileReader error");
      setError("Failed to read the file. Please try again.");
      setLoading(false);
      setProgress("");
    };

    // Read as array buffer for better memory efficiency
    console.log("Starting to read file as array buffer");
    reader.readAsArrayBuffer(file);
  };

  const handleCsvUpload = (file) => {
    console.log("Starting CSV upload handler with streaming");
    setLoading(true);
    setProgress("Reading CSV file...");
    setError("");

    let currentChunk = [];
    let chunkIndex = 1;
    let totalRows = 0;
    let isFirstRow = true;

    Papa.parse(file, {
      worker: true, // Use web worker for better performance
      step: async function (results, parser) {
        // Skip empty rows and header
        if (isFirstRow) {
          isFirstRow = false;
          return;
        }

        const row = results.data;
        if (row && row[0] && String(row[0]).trim() !== "") {
          currentChunk.push([String(row[0]).trim()]);
          totalRows++;

          // When chunk is full, export it
          if (currentChunk.length >= chunkSize) {
            parser.pause(); // Pause parsing while we export

            setProgress(
              `Exporting chunk ${chunkIndex} (${currentChunk.length.toLocaleString()} rows)...`
            );

            await exportChunkAsync(currentChunk, chunkIndex, outputFormat);
            chunkIndex++;
            currentChunk = []; // Clear chunk

            // Allow UI to breathe
            await new Promise((resolve) => setTimeout(resolve, 100));

            parser.resume(); // Resume parsing
          }
        }
      },
      complete: async function () {
        console.log("CSV streaming parse complete");
        try {
          // Export any remaining data in the last chunk
          if (currentChunk.length > 0) {
            setProgress(
              `Exporting final chunk ${chunkIndex} (${currentChunk.length.toLocaleString()} rows)...`
            );
            await exportChunkAsync(currentChunk, chunkIndex, outputFormat);
          }

          if (totalRows === 0) {
            throw new Error("No valid data rows found in the CSV file.");
          }

          setProgress(
            `✅ Complete! Created ${chunkIndex} file(s) from ${totalRows.toLocaleString()} rows.`
          );
          setLoading(false);
          setFileInputKey(Date.now());
          setTimeout(() => setProgress(""), 5000);
        } catch (error) {
          console.error("CSV processing error:", error);
          const errorMsg = error.message || "Failed to process the CSV file.";
          setError(errorMsg);
          setLoading(false);
          setProgress("");
        }
      },
      error: function (err) {
        console.error("PapaParse error:", err);
        setError(
          "Failed to parse the CSV file. Please ensure it's a valid CSV file."
        );
        setLoading(false);
        setProgress("");
      },
      skipEmptyLines: true,
      fastMode: true, // Use fast mode for better performance
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }

    console.log("File selected:", file.name, "Size:", file.size, "bytes");

    // Clear previous error and progress
    setError("");
    setProgress("");

    const fileExtension = file.name.split(".").pop().toLowerCase();
    console.log("File extension:", fileExtension);

    if (fileExtension === "csv") {
      console.log("Processing as CSV");
      handleCsvUpload(file);
    } else if (fileExtension === "xlsx" || fileExtension === "xls") {
      console.log("Processing as Excel");
      handleExcelUpload(file);
    } else {
      setError("Please upload a valid CSV or Excel file (.csv, .xlsx, .xls)");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md dark:bg-gray-900">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
        📞 Excel/CSV File Splitter
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Upload an Excel (.xlsx, .xls) or CSV file and split it into chunks of
        your desired size
      </p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Chunk Size (rows per file)
        </label>
        <input
          type="number"
          min={1}
          value={chunkSize}
          onChange={(e) => setChunkSize(Number(e.target.value))}
          placeholder="Enter chunk size (e.g. 500000)"
          className="border border-gray-300 dark:border-gray-700 rounded px-4 py-2 w-full dark:bg-gray-800 dark:text-white"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Example: Enter 500000 to split 1,000,000 rows into 2 files
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Output File Prefix
        </label>
        <input
          type="text"
          value={fileNamePrefix}
          onChange={(e) => setFileNamePrefix(e.target.value)}
          placeholder="File prefix (e.g. chunk)"
          className="border border-gray-300 dark:border-gray-700 rounded px-4 py-2 w-full dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Output Format
        </label>
        <div className="flex gap-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              value="csv"
              checked={outputFormat === "csv"}
              onChange={(e) => setOutputFormat(e.target.value)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              CSV (Smaller, ~5-10MB per 500K rows) ⚡ Recommended
            </span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              value="excel"
              checked={outputFormat === "excel"}
              onChange={(e) => setOutputFormat(e.target.value)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Excel (Larger, ~40MB per 500K rows)
            </span>
          </label>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          CSV files are 5-10x smaller and faster to create. Excel files are more
          compatible with some tools.
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select File
        </label>
        <input
          key={fileInputKey}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          disabled={loading}
          className="block w-full text-sm text-gray-900 dark:text-gray-300 
                     file:mr-4 file:py-2 file:px-4
                     file:rounded file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100
                     dark:file:bg-blue-900 dark:file:text-blue-300"
        />
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 font-medium">
            ❌ {error}
          </p>
        </div>
      )}

      {loading && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <p className="text-blue-600 dark:text-blue-400 font-medium">
            🔄 {progress || "Processing..."}
          </p>
        </div>
      )}

      {!loading && progress && !error && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900 rounded-lg">
          <p className="text-green-600 dark:text-green-400 font-medium">
            {progress}
          </p>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          📋 Instructions:
        </h3>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
          <li>Supports Excel (.xlsx, .xls) and CSV input files</li>
          <li>Default chunk size is 1,000,000 rows</li>
          <li>
            <strong>CSV output (recommended):</strong> 5-10x smaller files,
            faster processing
          </li>
          <li>
            <strong>Excel output:</strong> Larger files (40MB per 500K rows) but
            better compatibility
          </li>
          <li>For 2M+ rows, CSV output is highly recommended</li>
          <li>Files will download automatically as they're created</li>
          <li>Each file will have a "Phone" header column</li>
        </ul>
      </div>
    </div>
  );
}
