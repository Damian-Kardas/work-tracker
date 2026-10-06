import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type {
  LeaveEntry,
  TimeEntry,
} from "@/types/database";

import {
  diffSeconds,
  formatDuration,
  formatHm,
} from "./time";

interface ExportPdfParams {
  entries: TimeEntry[];
  leaveEntries?: LeaveEntry[];
  monthName: string;
}

export function exportToPdf({
  entries,
  leaveEntries = [],
  monthName,
}: ExportPdfParams) {
  const pdf = new jsPDF();

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

  pdf.setFontSize(18);
  pdf.text(
    "WORK TRACKER",
    14,
    20
  );

  pdf.setFontSize(14);
  pdf.text(
    `Raport miesieczny: ${monthName}`,
    14,
    32
  );

  pdf.setFontSize(11);

  pdf.text(
    `Przepracowano: ${formatDuration(
      totalWorkedSeconds
    )}`,
    14,
    48
  );

  pdf.text(
    `Liczba wpisow: ${entries.length}`,
    14,
    56
  );

  pdf.text(
    `Urlop: ${leaveDays} dni`,
    14,
    64
  );

  const rows = entries.map(
    (entry) => {
      const duration =
        entry.end_time
          ? formatDuration(
              diffSeconds(
                entry.start_time,
                entry.end_time
              )
            )
          : "w toku";

      return [
        entry.entry_date,

        formatHm(
          new Date(
            entry.start_time
          )
        ),

        entry.end_time
          ? formatHm(
              new Date(
                entry.end_time
              )
            )
          : "w toku",

        duration,

        entry.location_label,

        entry.notes ?? "",
      ];
    }
  );

  autoTable(pdf, {
    startY: 75,

    head: [
      [
        "Data",
        "Start",
        "Koniec",
        "Czas",
        "Lokalizacja",
        "Notatka",
      ],
    ],

    body: rows,

    theme: "grid",

    styles: {
      fontSize: 8,
    },

    headStyles: {
      fillColor: [232, 163, 61],
      textColor: [20, 23, 27],
    },
  });

  pdf.save(
    `Raport_${monthName}.pdf`
  );
}
