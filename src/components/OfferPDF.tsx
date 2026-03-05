"use client";

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";

export interface OfferDataClient {
  firma: string;
  adres: string;
  kontakt: string;
  email: string;
}

export interface OfferDataHandlowiec {
  imie: string;
  stanowisko: string;
  email: string;
  telefon: string;
}

export interface OfferDataItem {
  usluga: string;
  cenaBrutto: number;
  cenaPerCapita: number;
  ilosc?: number;
  /** Opis realizacji: lokalizacje z przypisaną ilością pacjentów */
  opis?: string;
}

export interface OfferData {
  client: OfferDataClient;
  handlowiec: OfferDataHandlowiec;
  items: OfferDataItem[];
  totalBrutto: number;
  dataWystawienia: string;
  numerOferty: string;
  /** URL logo (np. /long_logo.svg) – zalecane PNG dla PDF */
  logoUrl?: string;
}

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: 700,
    },
  ],
});

const COLORS = {
  navy: "#212c52",
  red: "#ff003b",
  grayLight: "#f5f5f5",
  grayMedium: "#9ca3af",
  grayDark: "#4b5563",
  white: "#ffffff",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 10,
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 40,
  },
  header: {
    backgroundColor: COLORS.navy,
    color: COLORS.white,
    padding: 20,
    marginHorizontal: -40,
    marginTop: -50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
  },
  headerLogo: {
    width: 280,
    height: 112,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  headerLogoImage: {
    width: 280,
    height: 112,
    objectFit: "contain" as const,
  },
  headerMeta: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.red,
    paddingBottom: 8,
  },
  headerMetaText: {
    fontSize: 9,
    color: COLORS.grayDark,
  },
  dataSectionsRow: {
    marginTop: 20,
    flexDirection: "row",
    gap: 16,
  },
  dataSection: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.grayLight,
    borderRadius: 4,
  },
  clientTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.navy,
    marginBottom: 8,
  },
  clientLine: {
    fontSize: 10,
    color: COLORS.grayDark,
    marginBottom: 4,
  },
  table: {
    marginTop: 24,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.grayMedium,
    color: COLORS.white,
    fontWeight: 700,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCol1: { flex: 4 },
  tableHeaderCol2: { flex: 1, textAlign: "right" },
  tableHeaderCol3: { flex: 1, textAlign: "right" },
  tableHeaderCol4: { flex: 1, textAlign: "right" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableRowZebra: {
    backgroundColor: COLORS.grayLight,
  },
  tableCol1: { flex: 4, minWidth: 0 },
  tableCol1Opis: {
    fontSize: 7,
    color: COLORS.grayDark,
    marginTop: 2,
  },
  tableCol2: { flex: 1, textAlign: "right" },
  tableCol3: { flex: 1, textAlign: "right" },
  tableCol4: { flex: 1, textAlign: "right" },
  warunkiRealizacji: {
    marginTop: 20,
    paddingHorizontal: 4,
    fontSize: 8,
    color: COLORS.grayDark,
  },
  summaryBox: {
    marginTop: 12,
    borderWidth: 3,
    borderColor: COLORS.red,
    padding: 16,
    backgroundColor: "#fff5f5",
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.red,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 700,
    color: COLORS.navy,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.navy,
    color: COLORS.white,
    padding: 12,
    marginHorizontal: 40,
    fontSize: 7,
    textAlign: "center",
  },
});

function generateOfferNumber(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `OFF-${y}${m}${day}-${random}`;
}

export function OfferPDF({ offerData }: { offerData: OfferData }) {
  const {
    client,
    handlowiec,
    items,
    totalBrutto,
    dataWystawienia,
    numerOferty,
    logoUrl,
  } = offerData;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>OFERTA HANDLOWA</Text>
          <View style={styles.headerLogo}>
            {logoUrl ? (
              <Image src={logoUrl} style={styles.headerLogoImage} />
            ) : (
              <Text style={{ fontSize: 8, color: COLORS.white }}>LOGO</Text>
            )}
          </View>
        </View>

        <View style={styles.headerMeta}>
          <Text style={styles.headerMetaText}>
            Data wystawienia: {dataWystawienia}
          </Text>
          <Text style={styles.headerMetaText}>Numer oferty: {numerOferty}</Text>
        </View>

        <View style={styles.dataSectionsRow}>
          <View style={styles.dataSection}>
            <Text style={styles.clientTitle}>Dane Klienta</Text>
            <Text style={styles.clientLine}>
              {client.firma || "—"}
            </Text>
            {client.adres && (
              <Text style={styles.clientLine}>Adres: {client.adres}</Text>
            )}
            {client.kontakt && (
              <Text style={styles.clientLine}>
                Osoba kontaktowa: {client.kontakt}
              </Text>
            )}
            {client.email && (
              <Text style={styles.clientLine}>Email: {client.email}</Text>
            )}
          </View>
          <View style={styles.dataSection}>
            <Text style={styles.clientTitle}>Dane Handlowca</Text>
            <Text style={styles.clientLine}>
              {handlowiec.imie || "—"}
            </Text>
            {handlowiec.stanowisko && (
              <Text style={styles.clientLine}>Stanowisko: {handlowiec.stanowisko}</Text>
            )}
            {handlowiec.email && (
              <Text style={styles.clientLine}>Email: {handlowiec.email}</Text>
            )}
            {handlowiec.telefon && (
              <Text style={styles.clientLine}>Telefon: {handlowiec.telefon}</Text>
            )}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderCol1}>Nazwa usługi</Text>
            <Text style={styles.tableHeaderCol2}>Ilość</Text>
            <Text style={styles.tableHeaderCol3}>Cena jedn.</Text>
            <Text style={styles.tableHeaderCol4}>Wartość netto</Text>
          </View>
          {items.map((item, idx) => (
            <View
              key={idx}
              style={
                idx % 2 === 1
                  ? [styles.tableRow, styles.tableRowZebra]
                  : styles.tableRow
              }
            >
              <View style={styles.tableCol1}>
                <Text>{item.usluga}</Text>
                {item.opis && (
                  <Text style={styles.tableCol1Opis}>
                    {item.opis
                      .replace(/\*\*/g, "")
                      .replace(/>\s*/g, "")
                      .split("\n")
                      .map((l) => l.trim())
                      .filter(Boolean)
                      .join(" | ")}
                  </Text>
                )}
              </View>
              <Text style={styles.tableCol2}>
                {item.ilosc ?? 1}
              </Text>
              <Text style={styles.tableCol3}>
                {item.cenaBrutto.toFixed(2)} PLN
              </Text>
              <Text style={styles.tableCol4}>
                {item.cenaBrutto.toFixed(2)} PLN
              </Text>
            </View>
          ))}
        </View>

        <View wrap={false}>
          <Text style={styles.warunkiRealizacji}>
            Oferta ważna 30 dni od daty wystawienia. Ceny brutto (zw. z VAT –
            usługi medyczne zwolnione z VAT). Warunki realizacji ustalane
            indywidualnie.
          </Text>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>ŁĄCZNIE DO ZAPŁATY (Brutto)</Text>
            <Text style={styles.summaryAmount}>
              {totalBrutto.toFixed(2)} PLN
            </Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={{ marginBottom: 4 }}>
            Long Life S.A. 00-728 Warszawa, ul. Bobrowiecka 8 | NIP:
            9512531254 | REGON: 520678780 | KRS: 0000937259
          </Text>
          <Text style={{ marginTop: 4 }}>
            Kontakt: {handlowiec.imie || "—"} | {handlowiec.email || "—"}
            {handlowiec.telefon ? ` | ${handlowiec.telefon}` : ""}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export { generateOfferNumber };
