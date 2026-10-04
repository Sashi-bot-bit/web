import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout, emailStyles } from "./layout";

export function VerifyEmail({ brand, name, url }: { brand: string; name: string; url: string }) {
  return (
    <EmailLayout brand={brand} preview="Confirm your email address">
      <Heading as="h1" style={emailStyles.h1}>
        Confirm your email
      </Heading>
      <Text style={emailStyles.text}>Hi {name}, confirm this is your email address to finish setting up your account.</Text>
      <Button href={url} style={emailStyles.button}>
        Confirm email
      </Button>
      <Text style={{ ...emailStyles.muted, marginTop: "20px" }}>This link expires in 24 hours. If you didn’t create an account, ignore this email.</Text>
    </EmailLayout>
  );
}

export function ResetPasswordEmail({ brand, name, url }: { brand: string; name: string; url: string }) {
  return (
    <EmailLayout brand={brand} preview="Reset your password">
      <Heading as="h1" style={emailStyles.h1}>
        Reset your password
      </Heading>
      <Text style={emailStyles.text}>Hi {name}, use the button below to choose a new password.</Text>
      <Button href={url} style={emailStyles.button}>
        Choose a new password
      </Button>
      <Text style={{ ...emailStyles.muted, marginTop: "20px" }}>
        This link expires in 1 hour. If you didn’t ask to reset your password, you can ignore this email. Your password won’t change.
      </Text>
    </EmailLayout>
  );
}
