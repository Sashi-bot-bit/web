import { Body, Container, Head, Hr, Html, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

/** Shared email frame: black/white base, Arial, violet reserved for the single CTA. */
export const emailStyles = {
  body: { backgroundColor: "#f6f6f4", fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif', margin: 0, padding: "24px 0" },
  container: { backgroundColor: "#ffffff", maxWidth: "520px", margin: "0 auto", padding: "32px 28px", borderRadius: "10px" },
  brand: { fontSize: "16px", fontWeight: 700, color: "#000000", margin: "0 0 24px" },
  h1: { fontSize: "24px", lineHeight: "30px", fontWeight: 700, color: "#000000", margin: "0 0 12px" },
  text: { fontSize: "16px", lineHeight: "24px", color: "#000000", margin: "0 0 16px" },
  muted: { fontSize: "14px", lineHeight: "20px", color: "#5c6666", margin: "0 0 12px" },
  button: {
    backgroundColor: "#9a46cf",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 700,
    borderRadius: "10px",
    padding: "14px 22px",
    textDecoration: "none",
    display: "inline-block",
  },
  hr: { borderColor: "#dcdcd6", margin: "28px 0 16px" },
  h2: { fontSize: "16px", lineHeight: "22px", fontWeight: 700, color: "#000000", margin: "24px 0 8px" },
  row: { fontSize: "15px", lineHeight: "22px", color: "#000000", margin: 0 },
  small: { fontSize: "13px", lineHeight: "18px", color: "#5c6666", margin: "2px 0 0" },
  box: { backgroundColor: "#f6f6f4", borderRadius: "10px", padding: "14px 16px", margin: "16px 0" },
};

export function EmailLayout({ brand, preview, children, footer }: { brand: string; preview: string; children: ReactNode; footer?: string }) {
  return (
    <Html lang="en-GB">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <Text style={emailStyles.brand}>{brand}</Text>
          <Section>{children}</Section>
          <Hr style={emailStyles.hr} />
          <Text style={emailStyles.muted}>{footer ?? `You’re receiving this because of an action on your ${brand} account.`}</Text>
        </Container>
      </Body>
    </Html>
  );
}
