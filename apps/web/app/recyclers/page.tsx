"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface RecyclingPartner {
  id: string;
  name: string;
  slug: string;
  region: string;
  country_code: string | null;
  state_province: string | null;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  supported_materials: string[];
  certifications: string[];
  accepts_device_categories: string[];
  website_url: string | null;
  email: string | null;
  phone: string | null;
  contact_notes: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  partner_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export default function RecyclersPage() {
  const [partners, setPartners] = useState<RecyclingPartner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<RecyclingPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchPartners = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("recycling_partners")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true });

        if (fetchError) throw fetchError;

        setPartners(data || []);
        setFilteredPartners(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load recycling partners");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPartners();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPartners(partners);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = partners.filter(
      (partner) =>
        partner.name.toLowerCase().includes(query) ||
        partner.city?.toLowerCase().includes(query) ||
        partner.region.toLowerCase().includes(query) ||
        partner.state_province?.toLowerCase().includes(query)
    );
    setFilteredPartners(filtered);
  }, [searchQuery, partners]);

  return (
    <div className="p-8 md:p-10 pb-24 md:pb-10 max-w-6xl mx-auto">
      <header className="mb-8">
        <span className="p-label">Recycling Partners</span>
        <h1 className="text-2xl md:text-3xl font-bold text-[#15261F] mt-1">Find a Certified Recycler</h1>
        <p className="mt-2 text-[#4A5A4D]">
          Browse our directory of certified e-waste recycling partners worldwide.
        </p>
      </header>

      <div className="mb-8">
        <label htmlFor="search" className="sr-only">Search partners</label>
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3B8A8]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            id="search"
            type="search"
            placeholder="Search by name, city, or region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-white border border-[#d5dbd8] text-[#15261F] placeholder-[#A3B8A8] focus:border-[#3A828F] focus:ring-1 focus:ring-[#3A828F] pl-12 py-3 px-4 text-sm"
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 p-4 bg-[#fff5f5] border border-[#ffc9c9] rounded-xl text-[#b3261e] text-sm font-medium"
        >
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4" role="status" aria-label="Loading partners">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card-elevated-light p-6 animate-pulse">
              <div className="h-6 bg-[#d5dbd8] rounded w-1/4 mb-4" />
              <div className="h-4 bg-[#d5dbd8] rounded w-1/3 mb-2" />
              <div className="h-4 bg-[#d5dbd8] rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="text-center py-12">
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
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-[#15261F]">No partners found</h3>
          <p className="mt-1 text-[#4A5A4D]">
            {searchQuery
              ? `No partners match "${searchQuery}". Try a different search.`
              : "No active recycling partners available at this time."}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 p-btn2-light"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPartners.map((partner) => (
            <article
              key={partner.id}
              className="card-elevated-light p-6 hover:border-[#3A828F] transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-[#15261F] truncate">{partner.name}</h3>
                  {partner.is_featured && (
                    <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#e8f5f3] text-[#3A828F] border border-[#c4e0dc]">
                      Featured
                    </span>
                  )}
                </div>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-[#4A5A4D]">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <dt className="sr-only">City</dt>
                    <dd className="text-[#15261F]">{partner.city || "—"}</dd>
                  </div>
                  {partner.state_province && (
                    <>
                      <span aria-hidden="true">,</span>
                      <dd className="text-[#4A5A4D]">{partner.state_province}</dd>
                    </>
                  )}
                  {partner.country_code && (
                    <>
                      <span aria-hidden="true">,</span>
                      <dd className="text-[#4A5A4D] uppercase">{partner.country_code}</dd>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[#4A5A4D]">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <div>
                    <dt className="sr-only">Region</dt>
                    <dd className="text-[#15261F]">{partner.region}</dd>
                  </div>
                </div>

                {partner.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <dt className="sr-only">Certifications</dt>
                    {partner.certifications.slice(0, 4).map((cert) => (
                      <dd
                        key={cert}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#f0f7f6] text-[#3A828F] border border-[#c4e0dc]"
                      >
                        {cert}
                      </dd>
                    ))}
                    {partner.certifications.length > 4 && (
                      <dd className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#f5f5f5] text-[#A3B8A8] border border-[#d5dbd8]">
                        +{partner.certifications.length - 4} more
                      </dd>
                    )}
                  </div>
                )}

                {partner.accepts_device_categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <dt className="sr-only">Accepted Devices</dt>
                    {partner.accepts_device_categories.slice(0, 4).map((cat) => (
                      <dd
                        key={cat}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#162a2a] text-white border border-[#2d5d68]"
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </dd>
                    ))}
                    {partner.accepts_device_categories.length > 4 && (
                      <dd className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#1a3333] text-[#A3B8A8] border border-[#2d5d68]">
                        +{partner.accepts_device_categories.length - 4} more
                      </dd>
                    )}
                  </div>
                )}

                {partner.website_url && (
                  <div className="flex items-center gap-2">
                    <dt className="sr-only">Website</dt>
                    <a
                      href={partner.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#3A828F] hover:text-[#2D6B73] underline flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Visit Website
                    </a>
                  </div>
                )}

                {partner.email && (
                  <div className="flex items-center gap-2">
                    <dt className="sr-only">Email</dt>
                    <a
                      href={`mailto:${partner.email}`}
                      className="text-sm text-[#4A5A4D] hover:text-[#15261F] underline flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {partner.email}
                    </a>
                  </div>
                )}

                {partner.phone && (
                  <div className="flex items-center gap-2">
                    <dt className="sr-only">Phone</dt>
                    <a
                      href={`tel:${partner.phone}`}
                      className="text-sm text-[#4A5A4D] hover:text-[#15261F] underline flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {partner.phone}
                    </a>
                  </div>
                )}
              </dl>
            </article>
          ))}
        </div>
      )}

      {!isLoading && filteredPartners.length > 0 && (
        <p className="mt-8 text-center text-sm text-[#A3B8A8]">
          Showing {filteredPartners.length} of {partners.length} partner{partners.length !== 1 ? "s" : ""}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      )}
    </div>
  );
}