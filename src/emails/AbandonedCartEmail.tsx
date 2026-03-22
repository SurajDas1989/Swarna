import {
    Body,
    Button,
    Container,
    Column,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Row,
    Section,
    Text,
} from "@react-email/components";
import * as React from "react";

interface AbandonedCartEmailProps {
    customerName: string;
    items: {
        name: string;
        price: number;
        image: string;
    }[];
    cartUrl: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://swarnacollection.in";

export const AbandonedCartEmail = ({
    customerName = "Valued Customer",
    items = [],
    cartUrl = `${baseUrl}/#cart`,
}: AbandonedCartEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Did you forget something special in your cart? ✨</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Heading style={heading}>Swarna Collection</Heading>
                    </Section>

                    <Section style={message}>
                        <Text style={text}>Hi {customerName},</Text>
                        <Text style={text}>
                            We noticed you left some beautiful pieces in your cart! At Swarna Collection, our exclusive pieces tend to sell out quickly. We've saved them for you, but we can't guarantee how long they'll remain in stock.
                        </Text>
                    </Section>

                    <Section style={orderSection}>
                        <Heading as="h3" style={subheading}>Your Favorites</Heading>
                        <Hr style={hr} />
                        {items.slice(0, 3).map((item, index) => (
                            <Row key={index} style={itemRow}>
                                <Column style={{ width: '60px' }}>
                                    <Img
                                        src={item.image}
                                        width="50"
                                        height="50"
                                        style={productImage}
                                        alt={item.name}
                                    />
                                </Column>
                                <Column>
                                    <Text style={itemText}>{item.name}</Text>
                                    <Text style={itemPrice}>₹{item.price.toLocaleString('en-IN')}</Text>
                                </Column>
                            </Row>
                        ))}
                        {items.length > 3 && (
                            <Text style={moreItemsText}>...and {items.length - 3} more beautiful pieces.</Text>
                        )}
                        <Hr style={hr} />

                        <Section style={buttonContainer}>
                            <Button style={button} href={cartUrl}>
                                Complete Your Purchase
                            </Button>
                        </Section>
                    </Section>

                    <Section style={footer}>
                        <Text style={footerText}>
                            If you have any questions or need styling advice, please reply to this email or contact us at <Link href="mailto:info@swarnacollection.in">info@swarnacollection.in</Link>.
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

// Styles
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

const orderSection = {
    padding: "0 48px",
    marginTop: "16px",
};

const text = {
    color: "#374151",
    fontSize: "16px",
    lineHeight: "26px",
};

const subheading = {
    color: "#111827",
    fontSize: "18px",
    fontWeight: "bold",
    margin: "0 0 16px",
};

const hr = {
    borderColor: "#e5e7eb",
    margin: "16px 0",
};

const itemRow = {
    padding: "12px 0",
};

const productImage = {
    borderRadius: "6px",
    objectFit: "cover" as const,
};

const itemText = {
    margin: "0 0 4px 12px",
    color: "#374151",
    fontSize: "15px",
    fontWeight: "500",
};

const itemPrice = {
    margin: "0 0 0 12px",
    color: "#6b7280",
    fontSize: "14px",
};

const moreItemsText = {
    color: "#6b7280",
    fontSize: "14px",
    fontStyle: "italic",
    marginTop: "8px",
};

const buttonContainer = {
    textAlign: "center" as const,
    marginTop: "32px",
};

const button = {
    backgroundColor: "#111827",
    borderRadius: "4px",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "bold",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "14px 40px",
};

const footer = {
    padding: "48px 48px 0",
};

const footerText = {
    margin: "0 0 12px",
    color: "#6b7280",
    fontSize: "14px",
    textAlign: "center" as const,
    lineHeight: "22px",
};

export default AbandonedCartEmail;
