"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface AssessmentRecord {
  id: string;
  user_id: string | null;
  device_category: string;
  device_brand: string | null;
  device_model: string | null;
  computed_score: number;
  chosen_route: string;
  carbon_savings_kg_co2e: number;
  assessment_metadata: Record<string, unknown> | null;
  photo_url: string | null;
  diagnosis_summary: string | null;
  created_at: string;
  updated_at: string;
}

export default function HistoryPage() {
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssessments = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("assessments")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        setAssessments(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load assessment history");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  }

  function capitalizeFirst(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  function formatRoute(route: string) {
    return route
      .split("_")
      .map(capitalizeFirst)
      .join(" ");
  }

  return (
    <div className="p-8 md:p-10 pb-24 md:pb-10 max-w-6xl mx-auto">
      <header className="mb-8">
        <span className="p-label">Assessment History</span>
        <h1 className="text-2xl md:text-3xl font-bold text-[#15261F] mt-1">Past Assessments</h1>
        <p className="mt-2 text-[#4A5A4D]">
          View your previously submitted device assessments.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-6 p-4 bg-[#fff5f5] border border-[#ffc9c9] rounded-xl text-[#b3261e] text-sm font-medium"
        >
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4" role="status" aria-label="Loading assessments">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card-elevated-light p-6 animate-pulse">
              <div className="grid grid-cols-6 gap-4">
                <div className="col-span-2 h-5 bg-[#d5dbd8] rounded" />
                <div className="h-5 bg-[#d5dbd8] rounded" />
                <div className="h-5 bg-[#d5dbd8] rounded" />
                <div className="h-5 bg-[#d5dbd8] rounded" />
                <div className="h-5 bg-[#d5dbd8] rounded" />
                <div className="h-5 bg-[#d5dbd8] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : assessments.length === 0 ? (
        <div className="card-elevated-light text-center py-12 md:py-16">
          <svg
            className="mx-auto h-12 w-12 text-[#A3B8A8]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-[#15261F]">No assessments found</h2>
          <p className="mt-2 text-[#4A5A4D]">
            You haven't submitted any assessments yet.
          </p>
        </div>
      ) : (
        <div className="card-elevated-light overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" role="table">
              <thead>
                <tr className="bg-[#f5f5f5] border-b border-[#d5dbd8]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#4A5A4D] uppercase tracking-wider">
                    Brand & Model
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#4A5A4D] uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#4A5A4D] uppercase tracking-wider">
                    Condition Grade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#4A5A4D] uppercase tracking-wider">
                    Estimated Value ($)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#4A5A4D] uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#4A5A4D] uppercase tracking-wider">
                    Created Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d5dbd8]">
                {assessments.map((assessment) => {
                  const metadata = assessment.assessment_metadata as Record<string, unknown> | null;
                  const conditionGrade = metadata?.condition_grade as string | undefined;
                  const estimatedValue = metadata?.estimated_value_usd as number | undefined;

                  return (
                    <tr key={assessment.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="px-4 py-4 text-[#15261F]">
                        <div className="font-medium">
                          {assessment.device_brand || "Unknown"} {assessment.device_model || ""}
                        </div>
                        <div className="text-xs text-[#A3B8A8] truncate max-w-xs">
                          {assessment.diagnosis_summary || "No description"}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[#15261F]">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#f0f7f6] text-[#3A828F] border border-[#c4e0dc]">
                          {capitalizeFirst(assessment.device_category)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[#15261F]">
                        {conditionGrade ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#162a2a] text-white border border-[#2d5d68]">
                            Grade {conditionGrade}
                          </span>
                        ) : (
                          <span className="text-[#A3B8A8]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-[#15261F] font-mono tabular-nums">
                        {estimatedValue !== undefined ? formatCurrency(estimatedValue) : "—"}
                      </td>
                      <td className="px-4 py-4 text-[#15261F]">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#162a2a] text-white">
                          {formatRoute(assessment.chosen_route)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[#A3B8A8] whitespace-nowrap">
                        {formatDate(assessment.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-[#d5dbd8]">
            <p className="text-sm text-[#A3B8A8] text-center">
              Showing {assessments.length} assessment{assessments.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}