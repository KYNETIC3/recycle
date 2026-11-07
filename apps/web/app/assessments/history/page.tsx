"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUserAssessments } from "@/app/actions/assessments";
import { Assessment, CircularRoute, DeviceCategory } from "@/types/database";
import { ArrowRight, ChevronRight, Loader2 } from "lucide-react";

const cardBg = "#3c454a";
const textColor = "#e2effa";
const accent = "#c2dbf0";
const accentHover = "#a8c8e8";
const mutedText = "#8b9ba8";
const borderColor = "#4a5568";
const rowHoverBg = "#2d3748";

const routeColors: Record<CircularRoute, string> = {
  Repair: "#276749",
  Reuse: "#b7791f",
  Recycle: "#742a2a",
};

const routeBgColors: Record<CircularRoute, string> = {
  Repair: "#276749",
  Reuse: "#b7791f",
  Recycle: "#742a2a",
};

const categoryLabels: Record<DeviceCategory, string> = {
  smartphone: "Smartphone",
  laptop: "Laptop",
  tablet: "Tablet",
  wearable: "Wearable",
  audio: "Audio",
  console: "Console",
  other: "Other",
};

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRoute(route: CircularRoute): string {
  return route;
}

export default function AssessmentHistoryPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssessments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getUserAssessments(100);
        if (!result.success) {
          throw new Error(result.error?.message || "Failed to fetch assessments");
        }
        setAssessments(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load assessments");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssessments();
  }, []);

  const routeBadgeColor = (route: CircularRoute) => {
    return routeColors[route] || "#4a5568";
  };

  const routeBadgeBg = (route: CircularRoute) => {
    return routeBgColors[route] || "#2d3748";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: cardBg,
        color: textColor,
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              letterSpacing: "-0.5px",
              marginBottom: "8px",
            }}
          >
            Assessment History
          </h1>
          <p style={{ color: mutedText, fontSize: "15px" }}>
            View and manage your device assessments
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div
            style={{
              backgroundColor: "#742a2a",
              color: "#feb2b2",
              padding: "16px 20px",
              borderRadius: "8px",
              marginBottom: "24px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <Loader2
              size={28}
              className="animate-spin"
              style={{ color: accent }}
            />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && assessments.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
              backgroundColor: "#2d3748",
              borderRadius: "12px",
              border: `1px solid ${borderColor}`,
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                backgroundColor: "rgba(194, 219, 240, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                border: `1px solid ${accent}`,
              }}
            >
              <ArrowRight size={28} style={{ color: accent }} />
            </div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                marginBottom: "8px",
                color: textColor,
              }}
            >
              No assessments yet
            </h2>
            <p style={{ color: mutedText, marginBottom: "24px", maxWidth: "400px", margin: "0 auto 24px" }}>
              Start by creating your first device assessment to see it appear here.
            </p>
            <Link
              href="/assessments?action=camera"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "14px 28px",
                backgroundColor: accent,
                color: "#1e293b",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "14px",
                textDecoration: "none",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = accentHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = accent;
              }}
            >
              <ArrowRight size={18} />
              New Assessment
            </Link>
          </div>
        )}

        {/* Assessments Table */}
        {!isLoading && !error && assessments.length > 0 && (
          <div
            style={{
              backgroundColor: "#2d3748",
              borderRadius: "12px",
              border: `1px solid ${borderColor}`,
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#1a202c",
                      borderBottom: `1px solid ${borderColor}`,
                    }}
                  >
                    <th
                      style={{
                        padding: "16px 20px",
                        textAlign: "left",
                        fontWeight: "600",
                        fontSize: "13px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: mutedText,
                      }}
                    >
                      Device
                    </th>
                    <th
                      style={{
                        padding: "16px 20px",
                        textAlign: "left",
                        fontWeight: "600",
                        fontSize: "13px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: mutedText,
                      }}
                    >
                      Condition
                    </th>
                    <th
                      style={{
                        padding: "16px 20px",
                        textAlign: "left",
                        fontWeight: "600",
                        fontSize: "13px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: mutedText,
                      }}
                    >
                      Score
                    </th>
                    <th
                      style={{
                        padding: "16px 20px",
                        textAlign: "left",
                        fontWeight: "600",
                        fontSize: "13px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: mutedText,
                      }}
                    >
                      Est. Value
                    </th>
                    <th
                      style={{
                        padding: "16px 20px",
                        textAlign: "left",
                        fontWeight: "600",
                        fontSize: "13px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: mutedText,
                      }}
                    >
                      Route
                    </th>
                    <th
                      style={{
                        padding: "16px 20px",
                        textAlign: "left",
                        fontWeight: "600",
                        fontSize: "13px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: mutedText,
                      }}
                    >
                      Date
                    </th>
                    <th
                      style={{
                        padding: "16px 20px",
                        textAlign: "right",
                        fontWeight: "600",
                        fontSize: "13px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: mutedText,
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((assessment) => {
                    const metadata = assessment.assessment_metadata as Record<string, unknown> | null;
                    const conditionGrade = metadata?.condition_grade as string | undefined;
                    const estimatedValue = metadata?.estimated_value_usd as number | undefined;

                    return (
                      <tr
                        key={assessment.id}
                        style={{
                          borderBottom: `1px solid ${borderColor}`,
                          transition: "background-color 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = rowHoverBg;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ fontWeight: "500", fontSize: "14px" }}>
                              {assessment.device_brand && assessment.device_model
                                ? `${assessment.device_brand} ${assessment.device_model}`
                                : assessment.device_model || assessment.device_brand || "Unknown Device"}
                            </span>
                            <span style={{ fontSize: "12px", color: mutedText }}>
                              {categoryLabels[assessment.device_category as DeviceCategory] || assessment.device_category}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          {conditionGrade ? (
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                backgroundColor: "rgba(194, 219, 240, 0.1)",
                                color: accent,
                                fontSize: "12px",
                                fontWeight: "600",
                                fontFamily: "monospace",
                              }}
                            >
                              Grade {conditionGrade}
                            </span>
                          ) : (
                            <span style={{ color: mutedText, fontSize: "13px" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span
                              style={{
                                fontSize: "20px",
                                fontWeight: "700",
                                fontFamily: "monospace",
                                color: textColor,
                              }}
                            >
                              {assessment.computed_score}
                            </span>
                            <span style={{ fontSize: "12px", color: mutedText }}>/100</span>
                          </div>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          {estimatedValue ? (
                            <span style={{ fontWeight: "500", fontSize: "14px" }}>
                              ${estimatedValue.toLocaleString()}
                            </span>
                          ) : (
                            <span style={{ color: mutedText, fontSize: "13px" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              backgroundColor: routeBadgeBg(assessment.chosen_route as CircularRoute),
                              color: "#fff",
                              fontSize: "12px",
                              fontWeight: "600",
                              textTransform: "capitalize",
                            }}
                          >
                            {formatRoute(assessment.chosen_route as CircularRoute)}
                          </span>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <span style={{ color: mutedText, fontSize: "13px" }}>
                            {formatDate(assessment.created_at)}
                          </span>
                        </td>
                        <td style={{ padding: "16px 20px", textAlign: "right" }}>
                          <Link
                            href={`/assessments?id=${assessment.id}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "8px 12px",
                              backgroundColor: "transparent",
                              color: accent,
                              border: `1px solid ${accent}`,
                              borderRadius: "6px",
                              fontSize: "13px",
                              fontWeight: "500",
                              textDecoration: "none",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = accent;
                              e.currentTarget.style.color = "#1e293b";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "transparent";
                              e.currentTarget.style.color = accent;
                            }}
                          >
                            View
                            <ChevronRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}