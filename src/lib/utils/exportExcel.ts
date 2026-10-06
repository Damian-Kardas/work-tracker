import * as XLSX from "xlsx";

import type {
  LeaveEntry,
  TimeEntry,
} from "@/types/database";

import {
  diffSeconds,
  formatDuration,
  formatHm,
} from "./time";

interface ExportExcelParams {
  entries: TimeEntry[];
  leaveEntries?: LeaveEntry[];
  monthName: string;
}

export function exportToExcel({
  entries,
  leaveEntries = [],
  monthName,
}: ExportExcelParams) {
  const rows = entries.map((entry) => {
    const workedSeconds =
      entry.end_time
        ? diffSeconds(
            entry.start_time,
            entry.end_time
          )
        : 0;

    return {
      Data: entry.entry_date,

      Start: formatHm(
        new Date(entry.start_time)
      ),

      Koniec: entry.end_time
        ? formatHm(
            new Date(entry.end_time)
          )
        : "w toku",

      "Czas pracy":
        formatDuration(workedSeconds),

      Lokalizacja:
        entry.location_label,

      Notatka:
        entry.notes ?? "",
    };
  });

  const totalWorkedSeconds =
    entries.reduce((sum, entry) => {
      if (!entry.end_time) return sum;

      return (
        sum +
        diffSeconds(
          entry.start_time,
          entry.end_time
        )
      );
    }, 0);

  const leaveDays =
    leaveEntries.reduce(
      (sum, leave) =>
        sum +
        Number(
          leave.days_count ?? 0
        ),
      0
    );

  const summarySheet = XLSX.utils.json_to_sheet([
    {
      Miesiac: monthName,
      Przepracowano:
        formatDuration(
          totalWorkedSeconds
        ),
      Wpisow: entries.length,
      Urlop: `${leaveDays} dni`,
    },
  ]);

  const entriesSheet =
    XLSX.utils.json_to_sheet(rows);

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    summarySheet,
    "Podsumowanie"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    entriesSheet,
    "Wpisy"
  );

  XLSX.writeFile(
    workbook,
    `Raport_${monthName}.xlsx`
  );
}
