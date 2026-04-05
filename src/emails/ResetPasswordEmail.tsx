import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Text,
} from "@react-email/components";
import * as React from "react";

interface ResetPasswordEmailProps {
    userEmail: string;
    resetLink: string;
}

export const ResetPasswordEmail = ({
    userEmail,
    resetLink,
}: ResetPasswordEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Reset your Swarna Collection password</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Heading style={heading}>Swarna Collection</Heading>
                    </Section>

                    <Section style={content}>
                        <Text style={text}>Hello,</Text>
                        <Text style={text}>
                            We received a request to reset the password for your Swarna Collection account (<strong>{userEmail}</strong>).
                        </Text>
                        <Text style={text}>
                            Click the button below to set a new password. This link will expire in 60 minutes for your security.
                        </Text>
                        <Section style={buttonContainer}>
                            <Button style={button} href={resetLink}>
                                Reset Password
                            </Button>
                        </Section>
                        <Text style={text}>
                            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                        </Text>
                        <Hr style={hr} />
                        <Text style={smallText}>
                            If you're having trouble clicking the "Reset Password" button, copy and paste the URL below into your web browser:
                        </Text>
                        <Link href={resetLink} style={link}>
                            {resetLink}
                        </Link>
                    </Section>

                    <Section style={footer}>
                        <Text style={footerText}>
                            If you have any questions, please contact us at <Link href="mailto:info@swarnacollection.in" style={link}>info@swarnacollection.in</Link>.
                        </Text>
                        <Text style={footerText}>
                            © {new Date().getFullYear()} Swarna Collection. All rights reserved.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

const main = {
    backgroundColor: "#f6f9fc",
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "20px 0 48px",
    marginBottom: "64px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    borderRadius: "8px",
};

const header = {
    padding: "32px 48px",
    textAlign: "center" as const,
    backgroundColor: "#111827",
};

const heading = {
    margin: "0",
    color: "#ffffff",
    fontSize: "24px",
    fontWeight: "bold",
    letterSpacing: "4px",
    textTransform: "uppercase" as const,
};

const content = {
    padding: "40px 48px",
};

const text = {
    color: "#374151",
    fontSize: "16px",
    lineHeight: "24px",
    textAlign: "left" as const,
};

const buttonContainer = {
    textAlign: "center" as const,
    margin: "32px 0",
};

const button = {
    backgroundColor: "#d4af37",
    borderRadius: "6px",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "bold",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "12px 24px",
};

const hr = {
    borderColor: "#e5e7eb",
    margin: "20px 0",
};

const smallText = {
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "20px",
};

const link = {
    color: "#d4af37",
    textDecoration: "underline",
};

const footer = {
    padding: "0 48px",
};

const footerText = {
    margin: "0 0 12px",
    color: "#6b7280",
    fontSize: "14px",
    textAlign: "center" as const,
};

export default ResetPasswordEmail;
