import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout, emailStyles } from "./layout";

export function TicketReceivedEmail({ brand, name, number, subject, url }: { brand: string; name: string; number: string; subject: string; url: string }) {
  return (
    <EmailLayout brand={brand} preview={`We’ve received your message (${number})`}>
      <Heading as="h1" style={emailStyles.h1}>
        We’ve got your message
      </Heading>
      <Text style={emailStyles.text}>
        Hi {name}, thanks for getting in touch about “{subject}”. Your reference is <strong>{number}</strong>. We’ll reply as soon as we can.
      </Text>
      <Button href={url} style={emailStyles.button}>
        View your conversation
      </Button>
    </EmailLayout>
  );
}

export function TicketReplyEmail({ brand, name, number, reply, url }: { brand: string; name: string; number: string; reply: string; url: string }) {
  return (
    <EmailLayout brand={brand} preview={`New reply to ${number}`}>
      <Heading as="h1" style={emailStyles.h1}>
        We’ve replied to {number}
      </Heading>
      <Text style={emailStyles.text}>Hi {name},</Text>
      <Text style={{ ...emailStyles.box, ...emailStyles.text, whiteSpace: "pre-wrap" }}>{reply}</Text>
      <Button href={url} style={emailStyles.button}>
        Reply or view the conversation
      </Button>
    </EmailLayout>
  );
}
