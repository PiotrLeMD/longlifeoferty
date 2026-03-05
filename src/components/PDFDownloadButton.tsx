"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { FileDown } from "lucide-react";
import { OfferPDF, generateOfferNumber, type OfferData } from "./OfferPDF";

interface PDFDownloadButtonProps {
  offerData: Omit<OfferData, "numerOferty"> & { numerOferty?: string };
  fileName?: string;
  className?: string;
  disabled?: boolean;
}

export function PDFDownloadButton({
  offerData,
  fileName = "oferta.pdf",
  className = "",
  disabled = false,
}: PDFDownloadButtonProps) {
  const logoUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/long_logo.png`
      : "";

  const fullOfferData: OfferData = {
    ...offerData,
    numerOferty: offerData.numerOferty ?? generateOfferNumber(),
    logoUrl: offerData.logoUrl ?? logoUrl,
  };

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className={`inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-md bg-gray-400 px-4 py-2 text-sm font-medium text-white opacity-50 ${className}`}
      >
        <FileDown className="size-4" />
        Pobierz Ofertę PDF
      </button>
    );
  }

  return (
    <PDFDownloadLink
      document={<OfferPDF offerData={fullOfferData} />}
      fileName={fileName}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 ${className}`}
      style={{ backgroundColor: "#ff003b" }}
    >
      {({ loading }) => (
        <>
          <FileDown className="size-4" />
          {loading ? "Przygotowywanie PDF..." : "Pobierz Ofertę PDF"}
        </>
      )}
    </PDFDownloadLink>
  );
}
