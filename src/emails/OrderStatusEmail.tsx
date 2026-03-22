import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Section,
    Text,
} from "@react-email/components";
import * as React from "react";
import { getOrderReference } from "@/lib/order-reference";

interface OrderStatusEmailProps {
    orderId: string;
    orderNumber?: string | null;
    customerName: string;
    status: string;
}

export const OrderStatusEmail = ({
    orderId,
    orderNumber,
    customerName,
    status,
}: OrderStatusEmailProps) => {
    const orderRef = getOrderReference({ orderNumber, orderId });

    return (
        <Html>
            <Head />
            <Preview>Swarna Collection: Order {status}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Heading style={heading}>Swarna Collection</Heading>
                    </Section>

                    <Section style={message}>
                        <Text style={text}>Hi {customerName},</Text>
                        <Text style={text}>
                            We have an update regarding your Swarna Collection order <strong>{orderRef}</strong>!
                        </Text>
                        <Text style={text}>
                            Your order status is now: <strong style={{ color: '#b8860b' }}>{status}</strong>.
                        </Text>
                    </Section>

                    <Section style={footer}>
                        <Text style={footerText}>
                            If you have any questions about your order, please reply to this email or contact us at <Link href="mailto:info@swarnacollection.in">info@swarnacollection.in</Link>.
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

const message = {
    padding: "24px 48px",
};

const text = {
    color: "#374151",
    fontSize: "16px",
    lineHeight: "24px",
};

const footer = {
    padding: "48px 48px 0",
};

const footerText = {
    margin: "0 0 12px",
    color: "#6b7280",
    fontSize: "14px",
    textAlign: "center" as const,
};

export default OrderStatusEmail;

