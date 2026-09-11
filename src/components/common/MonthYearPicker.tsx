import React from "react";

interface MonthYearPickerProps {
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onCurrentChange: (val: boolean) => void;
  currentCheckboxLabel?: string;
  startDateLabel?: string;
  endDateLabel?: string;
  idPrefix: string;
}

const MONTHS = [
  { value: "01", label: "Jan (01)" },
  { value: "02", label: "Feb (02)" },
  { value: "03", label: "Mar (03)" },
  { value: "04", label: "Apr (04)" },
  { value: "05", label: "May (05)" },
  { value: "06", label: "Jun (06)" },
  { value: "07", label: "Jul (07)" },
  { value: "08", label: "Aug (08)" },
  { value: "09", label: "Sep (09)" },
  { value: "10", label: "Oct (10)" },
  { value: "11", label: "Nov (11)" },
  { value: "12", label: "Dec (12)" },
];

// Generate years: from (currentYear + 6) down to 1970
const currentYearNum = new Date().getFullYear();
const YEARS: string[] = [];
for (let y = currentYearNum + 6; y >= 1970; y--) {
  YEARS.push(String(y));
}

/**
 * Parse an existing stored date string (e.g. "2024-01", "2024-1", "Jan 2024", "2024", or "")
 * into separate month and year components.
 */
export function parseDateComponents(dateStr: string | undefined | null): { month: string; year: string } {
  if (!dateStr || typeof dateStr !== "string") {
    return { month: "", year: "" };
  }

  const trimmed = dateStr.trim();
  if (!trimmed || trimmed.toLowerCase() === "present") {
    return { month: "", year: "" };
  }

  // 1. Check ISO / standard format: YYYY-MM
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})$/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, "0");
    return { month: m, year: y };
  }

  // 2. Check YYYY alone
  const yearMatch = trimmed.match(/^(\d{4})$/);
  if (yearMatch) {
    return { month: "", year: yearMatch[1] };
  }

  // 3. Check "Mon YYYY" or "Month YYYY" (e.g. "Jan 2024", "September 2022")
  const textMonthMap: Record<string, string> = {
    jan: "01", january: "01",
    feb: "02", february: "02",
    mar: "03", march: "03",
    apr: "04", april: "04",
    may: "05",
    jun: "06", june: "06",
    jul: "07", july: "07",
    aug: "08", august: "08",
    sep: "09", sept: "09", september: "09",
    oct: "10", october: "10",
    nov: "11", november: "11",
    dec: "12", december: "12",
  };

  const textMatch = trimmed.match(/^([a-zA-Z]+)\s+(\d{4})$/);
  if (textMatch) {
    const mStr = textMatch[1].toLowerCase();
    const yStr = textMatch[2];
    if (textMonthMap[mStr]) {
      return { month: textMonthMap[mStr], year: yStr };
    }
    return { month: "", year: yStr };
  }

  return { month: "", year: "" };
}

/**
 * Compose month and year into standard YYYY-MM or YYYY string
 */
function composeDate(month: string, year: string): string {
  if (year && month) {
    return `${year}-${month}`;
  }
  if (year) {
    return year;
  }
  return "";
}

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  startDate,
  endDate,
  isCurrent,
  onStartDateChange,
  onEndDateChange,
  onCurrentChange,
  currentCheckboxLabel = "I currently work here",
  startDateLabel = "Start Date",
  endDateLabel = "End Date",
  idPrefix,
}) => {
  const startParsed = parseDateComponents(startDate);
  const endParsed = parseDateComponents(endDate);

  const handleStartMonth = (newMonth: string) => {
    onStartDateChange(composeDate(newMonth, startParsed.year));
  };

  const handleStartYear = (newYear: string) => {
    onStartDateChange(composeDate(startParsed.month, newYear));
  };

  const handleEndMonth = (newMonth: string) => {
    onEndDateChange(composeDate(newMonth, endParsed.year));
  };

  const handleEndYear = (newYear: string) => {
    onEndDateChange(composeDate(endParsed.month, newYear));
  };

  return (
    <div className="space-y-2.5 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Start Date Field */}
        <div>
          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
            {startDateLabel}
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <select
              id={`${idPrefix}_start_month`}
              value={startParsed.month}
              onChange={(e) => handleStartMonth(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-slate-400">Month</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value} className="bg-slate-900 text-white">
                  {m.label}
                </option>
              ))}
            </select>

            <select
              id={`${idPrefix}_start_year`}
              value={startParsed.year}
              onChange={(e) => handleStartYear(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-slate-400">Year</option>
              {YEARS.map((y) => (
                <option key={y} value={y} className="bg-slate-900 text-white">
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* End Date Field */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-slate-300 block">
              {endDateLabel}
            </label>
            {isCurrent && (
              <span className="text-[10px] font-bold text-teal-400 bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-800/60">
                Present
              </span>
            )}
          </div>

          {isCurrent ? (
            <div className="w-full px-2.5 py-1.5 bg-slate-950/60 rounded-lg border border-dashed border-slate-800 text-xs text-slate-400 flex items-center justify-center font-medium">
              Present (Currently Active)
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              <select
                id={`${idPrefix}_end_month`}
                value={endParsed.month}
                onChange={(e) => handleEndMonth(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-slate-400">Month</option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value} className="bg-slate-900 text-white">
                    {m.label}
                  </option>
                ))}
              </select>

              <select
                id={`${idPrefix}_end_year`}
                value={endParsed.year}
                onChange={(e) => handleEndYear(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-slate-400">Year</option>
                {YEARS.map((y) => (
                  <option key={y} value={y} className="bg-slate-900 text-white">
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* "Currently working here" Checkbox */}
      <div className="pt-0.5">
        <label className="inline-flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
          <input
            type="checkbox"
            id={`${idPrefix}_current_checkbox`}
            checked={isCurrent}
            onChange={(e) => {
              const checked = e.target.checked;
              onCurrentChange(checked);
              if (checked) {
                onEndDateChange("Present");
              } else if (endDate === "Present") {
                onEndDateChange("");
              }
            }}
            className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-teal-500 focus:ring-0 cursor-pointer"
          />
          <span className="font-medium">{currentCheckboxLabel}</span>
        </label>
      </div>
    </div>
  );
};
