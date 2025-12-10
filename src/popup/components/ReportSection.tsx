import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface DuplicateInfo {
  value: string;
  count: number;
}

interface AttributeReport {
  totalCount: number;
  duplicates: DuplicateInfo[];
}

interface Props {
  attribute: string;
}

export const ReportSection: React.FC<Props> = ({ attribute }) => {
  const [report, setReport] = useState<AttributeReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeValue, setActiveValue] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (tab.id) {
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: "getAttributeReport",
        });
        setReport(response);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [attribute]);

  const handleShowDuplicates = async (attributeValue: string) => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (tab.id) {
        if (activeValue === attributeValue) {
          // Hide if clicking the same value
          await chrome.tabs.sendMessage(tab.id, { action: "hideDuplicates" });
          setActiveValue(null);
        } else {
          // Show new duplicates
          await chrome.tabs.sendMessage(tab.id, {
            action: "showDuplicates",
            attributeValue,
          });
          setActiveValue(attributeValue);
        }
      }
    } catch (error) {
      console.error("Error showing duplicates:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-3 bg-card border border-border rounded-lg">
        <p className="text-xs text-muted-foreground">Loading report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-3 bg-card border border-border rounded-lg">
        <p className="text-xs text-muted-foreground">
          Unable to fetch report. Make sure you're on an active page.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 bg-card border border-border rounded-lg flex flex-col gap-2.5">
      <h3 className="text-[13px] font-semibold text-foreground">
        Attribute Report
      </h3>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Total elements:</span>
        <span className="font-medium text-foreground">{report.totalCount}</span>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Unique values:</span>
        <span className="font-medium text-foreground">
          {report.totalCount -
            report.duplicates.reduce((acc, d) => acc + d.count - 1, 0)}
        </span>
      </div>

      {report.duplicates.length > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          <div className="flex items-center gap-1.5">
            <WarningIcon />
            <span className="text-xs font-medium text-amber-600">
              {report.duplicates.length} duplicate
              {report.duplicates.length > 1 ? "s" : ""} found
            </span>
          </div>

          <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto">
            {report.duplicates.map((duplicate) => (
              <div
                key={duplicate.value}
                className="flex items-center justify-between gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs"
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <WarningIcon className="shrink-0" />
                  <span
                    className="font-mono text-amber-800 break-all"
                    title={duplicate.value}
                  >
                    {duplicate.value}
                  </span>
                  <span className="text-amber-600 shrink-0">
                    ×{duplicate.count}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant={
                    activeValue === duplicate.value ? "default" : "outline"
                  }
                  className="h-6 px-2 text-[10px] shrink-0"
                  onClick={() => handleShowDuplicates(duplicate.value)}
                >
                  {activeValue === duplicate.value ? "Hide" : "Show"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.duplicates.length === 0 && (
        <div className="flex items-center gap-1.5">
          <CheckIcon />
          <span className="text-xs text-green-600">No duplicates found</span>
        </div>
      )}

      <Button
        size="sm"
        variant="ghost"
        className="w-full h-7 text-xs"
        onClick={fetchReport}
      >
        Refresh Report
      </Button>
    </div>
  );
};

const WarningIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`w-3.5 h-3.5 text-amber-500 ${className || ""}`}
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-3.5 h-3.5 text-green-500"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
