"use client";

import type { TimeEntry, LeaveEntry } from "@/types/database";

interface ExportButtonsProps {
  entries: TimeEntry[];
  leaveEntries?: LeaveEntry[];
  monthName: string;
}

export default function ExportButtons({
  entries,
  leaveEntries = [],
  monthName,
}: ExportButtonsProps) {
  async function handleExcelExport() {
    try {
      const { exportToExcel } = await import(
        "@/lib/utils/exportExcel"
      );

      exportToExcel({
        entries,
        leaveEntries,
        monthName,
      });
    } catch (error) {
      console.error(error);
      alert("Nie udało się wygenerować pliku Excel.");
    }
  }

  async function handlePdfExport() {
    try {
      const { exportToPdf } = await import(
        "@/lib/utils/exportPdf"
      );

      exportToPdf({
        entries,
        leaveEntries,
        monthName,
      });
    } catch (error) {
      console.error(error);
      alert("Nie udało się wygenerować pliku PDF.");
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={handlePdfExport}
        className="rounded-card border border-brick-500 bg-brick-500/10 px-4 py-3 text-sm font-medium text-brick-400 transition-colors hover:bg-brick-500/20"
      >
        📄 Eksport PDF
      </button>

      <button
        onClick={handleExcelExport}
        className="rounded-card border border-moss-500 bg-moss-500/10 px-4 py-3 text-sm font-medium text-moss-400 transition-colors hover:bg-moss-500/20"
      >
        📊 Eksport Excel
      </button>
    </div>
  );
}
