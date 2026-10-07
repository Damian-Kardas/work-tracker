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
      const { exportToExcel } = await import("@/lib/utils/exportExcel");
      exportToExcel({ entries, leaveEntries, monthName });
    } catch (error) {
      console.error(error);
      alert("Nie udało się wygenerować pliku Excel.");
    }
  }

  function handlePdfExport() {
    alert("PDF tymczasowo wyłączony.");
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={handlePdfExport}
        className="press-scale rounded-pill border border-hairline bg-canvas px-4 py-2.5 text-[14px] text-ink-muted-80"
      >
        Eksport PDF
      </button>

      <button
        onClick={handleExcelExport}
        className="press-scale rounded-pill bg-primary px-4 py-2.5 text-[14px] font-medium text-white"
      >
        Eksport Excel
      </button>
    </div>
  );
}
