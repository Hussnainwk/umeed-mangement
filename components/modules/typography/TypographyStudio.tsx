"use client";
import React, { useState } from "react";
import { Card, CardInset, Label, Badge, useToast } from "@/components/ui";
import { useTypography } from "@/context/providers";

export interface FontFamilyMeta {
  id: string;
  name: string;
  classification:
    | "Modern Geometric Sans"
    | "Humanist Sans"
    | "Editorial Serif"
    | "Classic Serif"
    | "Condensed Display";
  weights: { label: string; value: number }[];
  description: string;
  cssFamily: string;
  tag: string;
}

export const FONT_FAMILIES: FontFamilyMeta[] = [
  {
    id: "Manrope",
    name: "Manrope",
    classification: "Modern Geometric Sans",
    weights: [
      { label: "Light (300)", value: 300 },
      { label: "Regular (400)", value: 400 },
      { label: "Medium (500)", value: 500 },
      { label: "SemiBold (600)", value: 600 },
      { label: "Bold (700)", value: 700 },
      { label: "ExtraBold (800)", value: 800 },
    ],
    description:
      "Default brand font. Clean, modern geometric proportions with open apertures for maximum UI clarity.",
    cssFamily: "'Manrope', sans-serif",
    tag: "Brand Default",
  },
  {
    id: "Montserrat",
    name: "Montserrat",
    classification: "Modern Geometric Sans",
    weights: [
      { label: "Regular (400)", value: 400 },
      { label: "Medium (500)", value: 500 },
      { label: "SemiBold (600)", value: 600 },
      { label: "Bold (700)", value: 700 },
      { label: "ExtraBold (800)", value: 800 },
    ],
    description:
      "Inspired by mid-century urban Buenos Aires signage, high x-height, vibrant and authoritative.",
    cssFamily: "'Montserrat', sans-serif",
    tag: "Contemporary",
  },
  {
    id: "Inter",
    name: "Inter",
    classification: "Humanist Sans",
    weights: [
      { label: "Light (300)", value: 300 },
      { label: "Regular (400)", value: 400 },
      { label: "Medium (500)", value: 500 },
      { label: "SemiBold (600)", value: 600 },
      { label: "Bold (700)", value: 700 },
    ],
    description:
      "World-class interface workhorse with tall x-height and optical corrections for dense data screens.",
    cssFamily: "'Inter', sans-serif",
    tag: "Interface Standard",
  },
  {
    id: "Plus Jakarta Sans",
    name: "Plus Jakarta Sans",
    classification: "Modern Geometric Sans",
    weights: [
      { label: "Regular (400)", value: 400 },
      { label: "Medium (500)", value: 500 },
      { label: "SemiBold (600)", value: 600 },
      { label: "Bold (700)", value: 700 },
    ],
    description:
      "Sophisticated neo-grotesque with clean geometry and a friendly, premium tech personality.",
    cssFamily: "'Plus Jakarta Sans', sans-serif",
    tag: "Premium Tech",
  },
  {
    id: "DM Sans",
    name: "DM Sans",
    classification: "Modern Geometric Sans",
    weights: [
      { label: "Regular (400)", value: 400 },
      { label: "Medium (500)", value: 500 },
      { label: "Bold (700)", value: 700 },
    ],
    description:
      "Low-contrast geometric grotesque tailored for high legibility at small sizes on dense dashboards.",
    cssFamily: "'DM Sans', sans-serif",
    tag: "Minimalist",
  },
  {
    id: "Playfair Display",
    name: "Playfair Display",
    classification: "Editorial Serif",
    weights: [
      { label: "Regular (400)", value: 400 },
      { label: "SemiBold (600)", value: 600 },
      { label: "Bold (700)", value: 700 },
      { label: "Black (800)", value: 800 },
    ],
    description:
      "Transitional serif with high contrast and delicate hairlines. Luxurious for editorial titles.",
    cssFamily: "'Playfair Display', serif",
    tag: "Editorial Luxury",
  },
  {
    id: "Cormorant Garamond",
    name: "Cormorant Garamond",
    classification: "Classic Serif",
    weights: [
      { label: "Regular (400)", value: 400 },
      { label: "SemiBold (600)", value: 600 },
      { label: "Bold (700)", value: 700 },
    ],
    description:
      "Traditional Garamond-heritage letterforms, refined grace, poetic rhythm and literary distinction.",
    cssFamily: "'Cormorant Garamond', serif",
    tag: "Classical Heritage",
  },
  {
    id: "Bebas Neue",
    name: "Bebas Neue",
    classification: "Condensed Display",
    weights: [{ label: "Regular (400)", value: 400 }],
    description:
      "Bold all-caps condensed display font. High-impact headlines, telemetry, and banner callouts.",
    cssFamily: "'Bebas Neue', sans-serif",
    tag: "High Impact",
  },
  {
    id: "Oswald",
    name: "Oswald",
    classification: "Condensed Display",
    weights: [
      { label: "Light (300)", value: 300 },
      { label: "Regular (400)", value: 400 },
      { label: "Medium (500)", value: 500 },
      { label: "Bold (700)", value: 700 },
    ],
    description:
      "Reworking of classic gothic sans-serifs, optimized for digital screens and modern data columns.",
    cssFamily: "'Oswald', sans-serif",
    tag: "Architectural",
  },
  {
    id: "Lora",
    name: "Lora",
    classification: "Classic Serif",
    weights: [
      { label: "Regular (400)", value: 400 },
      { label: "Medium (500)", value: 500 },
      { label: "SemiBold (600)", value: 600 },
      { label: "Bold (700)", value: 700 },
    ],
    description:
      "Contemporary serif with brushed curves and calligraphy roots, balanced for prolonged reading.",
    cssFamily: "'Lora', serif",
    tag: "Editorial Book",
  },
];

export default function TypographyStudio() {
  const { currentFont, setFont, currentWeight, setWeight } = useTypography();
  const { addToast } = useToast();

  const [previewText, setPreviewText] = useState("Befal");
  const [fontSize, setFontSize] = useState(48);
  const [filterClass, setFilterClass] = useState<string>("all");

  const selectedFontMeta =
    FONT_FAMILIES.find((f) => f.name === currentFont) || FONT_FAMILIES[0];

  const handleApplyFont = (fontName: string, weight?: number) => {
    setFont(fontName);
    if (weight) setWeight(weight);
    addToast(
      "success",
      "Brand Typography Applied",
      `Global application font switched to ${fontName}`,
    );
  };

  const filteredFonts =
    filterClass === "all"
      ? FONT_FAMILIES
      : FONT_FAMILIES.filter((f) =>
          f.classification.toLowerCase().includes(filterClass.toLowerCase()),
        );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Studio Header Card */}
      <Card
        title={
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
              Umeed Typography Studio
            </span>
            <Badge variant="primary">Brand Font System</Badge>
          </div>
        }
        subtitle="Explore, test, and dynamically apply any of the 10 curated typeface families across the entire Befal interface."
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Active: <strong>{currentFont}</strong> ({currentWeight})
            </span>
            <button
              onClick={() => handleApplyFont("Manrope", 600)}
              className="neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-[#3A0F34] dark:text-[#f6f1f7] hover:text-[#EAAA00] cursor-pointer"
            >
              Reset to Manrope Default
            </button>
          </div>
        }
      >
        {/* Interactive Controls Bar */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end pt-2">
          <Label text="Custom Preview Text">
            <input
              type="text"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="Type word to preview..."
              className="w-full rounded-xl neu-inset px-3.5 py-2 text-sm text-[#3A0F34] dark:text-[#f6f1f7] focus:outline-none focus:ring-2 focus:ring-[#EAAA00]"
            />
          </Label>

          <Label text={`Font Size: ${fontSize}px`}>
            <input
              type="range"
              min="24"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-[#EAAA00] cursor-pointer"
            />
          </Label>

          <Label text="Filter by Style">
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full rounded-xl neu-inset px-3.5 py-2 text-sm text-[#3A0F34] dark:text-[#f6f1f7] focus:outline-none focus:ring-2 focus:ring-[#EAAA00]"
            >
              <option value="all">All Font Styles (10 Families)</option>
              <option value="sans">Sans-Serif (Geometric & Humanist)</option>
              <option value="serif">Serif (Editorial & Classical)</option>
              <option value="display">Condensed Display</option>
            </select>
          </Label>

          <Label text={`Active Font Weight (${selectedFontMeta.name})`}>
            <select
              value={currentWeight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full rounded-xl neu-inset px-3.5 py-2 text-sm text-[#3A0F34] dark:text-[#f6f1f7] focus:outline-none focus:ring-2 focus:ring-[#EAAA00]"
            >
              {selectedFontMeta.weights.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </Label>
        </div>
      </Card>

      {/* Hero Live Specimen Showcase */}
      <Card className="border border-[#EAAA00]/30">
        <div className="grid lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="primary">{selectedFontMeta.tag}</Badge>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {selectedFontMeta.classification}
              </span>
            </div>

            <div
              style={{
                fontFamily: selectedFontMeta.cssFamily,
                fontWeight: currentWeight,
                fontSize: `${fontSize}px`,
                lineHeight: 1.1,
              }}
              className="text-[#3A0F34] dark:text-[#f6f1f7] tracking-tight transition-all py-2"
            >
              {previewText || "Befal"}
            </div>

            <p className="text-sm text-slate-600 dark:text-[#bdaec2] max-w-xl">
              {selectedFontMeta.description}
            </p>
          </div>

          <div className="lg:col-span-5 neu-inset p-5 rounded-2xl space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Live Component Preview ({selectedFontMeta.name})
            </p>

            <div
              className="space-y-3"
              style={{ fontFamily: selectedFontMeta.cssFamily }}
            >
              <div>
                <h3 className="text-base font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
                  Heading Level 3 Specimen
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#bdaec2] mt-0.5">
                  Body paragraph showing text contrast and legibility at
                  standard sizes.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  style={{ fontWeight: Math.min(currentWeight, 600) }}
                  className="neu-btn bg-[#EAAA00] text-[#190617] px-3.5 py-1.5 rounded-xl text-xs font-semibold"
                >
                  Action Button
                </button>
                <button
                  style={{ fontWeight: currentWeight }}
                  className="neu-btn bg-[#DDE3E8] dark:bg-[#200f23] text-[#3A0F34] dark:text-[#f6f1f7] px-3.5 py-1.5 rounded-xl text-xs"
                >
                  Secondary Pill
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid of all 10 Font Families with "Befal" specimen */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Available Typeface Families ({filteredFonts.length})
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Click &quot;Apply as Brand Font&quot; to update the entire app
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {filteredFonts.map((font) => {
            const isCurrent = currentFont === font.name;
            return (
              <div
                key={font.id}
                className={`neu-card p-5 transition-all ${
                  isCurrent
                    ? "ring-2 ring-[#EAAA00] shadow-lg dark:ring-[#EAAA00]"
                    : "neu-card-hover"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-[#3A0F34] dark:text-[#f6f1f7]">
                        {font.name}
                      </h4>
                      {isCurrent && (
                        <Badge variant="primary">Active Brand Font</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {font.classification}
                    </p>
                  </div>

                  <button
                    onClick={() => handleApplyFont(font.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isCurrent
                        ? "neu-inset text-[#EAAA00] font-bold"
                        : "neu-btn bg-[#EAAA00] text-[#190617] hover:bg-[#d49a00]"
                    }`}
                  >
                    {isCurrent ? "Active" : "Apply as Brand Font"}
                  </button>
                </div>

                {/* "Befal" Word Display Specimen */}
                <div className="neu-inset p-4 rounded-xl my-3">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Specimen Preview
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {font.weights.length} weights available
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: font.cssFamily,
                      fontSize: "36px",
                      lineHeight: "1.1",
                    }}
                    className="text-[#3A0F34] dark:text-[#f6f1f7] tracking-tight truncate py-1"
                  >
                    {previewText || "Umeed"}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-[#bdaec2] line-clamp-2">
                  {font.description}
                </p>

                {/* Weights quick selector pills */}
                <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2 border-t border-white/60 dark:border-[#38163f]/60">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-1">
                    Weights:
                  </span>
                  {font.weights.map((w) => (
                    <button
                      key={w.value}
                      onClick={() => handleApplyFont(font.name, w.value)}
                      className={`text-[10px] px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        isCurrent && currentWeight === w.value
                          ? "bg-[#EAAA00] text-[#190617] font-bold shadow-xs"
                          : "neu-btn text-slate-600 dark:text-slate-300 hover:text-[#EAAA00]"
                      }`}
                    >
                      {w.value}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
