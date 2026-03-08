import {
    Body,
    Column,
    Container,
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
import { getOrderReference } from "@/lib/order-reference";

interface ReceiptItem {
    name: string;
    quantity: number;
    price: number;
    subtitle?: string;
    image?: string;
}

interface AddressInfo {
    firstName?: string;
    lastName?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
}

interface OrderSummaryInfo {
    subtotal?: number;
    discount?: number;
    shipping?: number;
    taxes?: number;
    saved?: number;
}

interface ReceiptEmailProps {
    orderId: string;
    orderNumber?: string | null;
    customerName: string;
    items: ReceiptItem[];
    total: number;
    shippingAddress: AddressInfo;
    billingAddress?: AddressInfo;
    paymentMethod: string;
    summary?: OrderSummaryInfo;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.swarnacollection.in";

const formatMoney = (value: number) =>
    `Rs. ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const resolveImage = (image?: string) => {
    if (!image) return `${baseUrl}/products/golden-pearl-necklace.png`;
    if (image.startsWith("http://") || image.startsWith("https://")) return image;
    if (image.startsWith("/")) return `${baseUrl}${image}`;
    return `${baseUrl}/${image}`;
};

const renderAddressLines = (address: AddressInfo) => {
    const fullName = `${address.firstName || ""} ${address.lastName || ""}`.trim();
    return (
        <>
            {fullName ? <Text style={addressLine}>{fullName}</Text> : null}
            {address.address ? <Text style={addressLine}>{address.address}</Text> : null}
            {address.city || address.state || address.pincode ? (
                <Text style={addressLine}>{[address.city, address.state, address.pincode].filter(Boolean).join(", ")}</Text>
            ) : null}
            {address.email ? <Text style={addressLine}>{address.email}</Text> : null}
        </>
    );
};

export const ReceiptEmail = ({
    orderId,
    orderNumber,
    customerName,
    items,
    total,
    shippingAddress,
    billingAddress,
    paymentMethod,
    summary,
}: ReceiptEmailProps) => {
    const orderRef = getOrderReference({ orderNumber, orderId });
    const subtotal = summary?.subtotal ?? items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    const discount = summary?.discount ?? 0;
    const shipping = summary?.shipping ?? 0;
    const taxes = summary?.taxes ?? 0;
    const saved = summary?.saved ?? Math.max(0, discount * -1);

    return (
        <Html>
            <Head />
            <Preview>Order confirmation {orderRef}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={brandBar}>
                        <Heading style={brandTitle}>SWARNA COLLECTION</Heading>
                    </Section>

                    <Section style={introSection}>
                        <Text style={introText}>Hi {customerName || "Customer"},</Text>
                        <Text style={introText}>Thank you for your order. We are preparing it for shipment.</Text>
                        <Text style={introText}>
                            <strong>Order ID:</strong> {orderRef}
                        </Text>
                        <Text style={introText}>
                            <strong>Payment Method:</strong> {paymentMethod === "cod" ? "Cash on Delivery" : "Prepaid (Razorpay)"}
                        </Text>
                    </Section>

                    <Section style={contentCard}>
                        <Heading as="h2" style={sectionHeading}>Order summary</Heading>

                        {items.map((item, idx) => (
                            <Row key={`${item.name}-${idx}`} style={itemRow}>
                                <Column style={itemImageCol}>
                                    <Img src={resolveImage(item.image)} width="58" height="58" alt={item.name} style={itemImage} />
                                </Column>
                                <Column style={itemInfoCol}>
                                    <Text style={itemName}>{item.name} x {item.quantity}</Text>
                                    {item.subtitle ? <Text style={itemSub}>{item.subtitle}</Text> : null}
                                </Column>
                                <Column style={itemAmountCol} align="right">
                                    <Text style={itemAmount}>{formatMoney(Number(item.price) * Number(item.quantity))}</Text>
                                </Column>
                            </Row>
                        ))}

                        <Hr style={divider} />

                        <Row style={calcRow}><Column><Text style={calcLabel}>Subtotal</Text></Column><Column align="right"><Text style={calcValue}>{formatMoney(subtotal)}</Text></Column></Row>
                        <Row style={calcRow}><Column><Text style={calcLabel}>Order discount</Text></Column><Column align="right"><Text style={calcValue}>{discount ? `- ${formatMoney(Math.abs(discount))}` : formatMoney(0)}</Text></Column></Row>
                        <Row style={calcRow}><Column><Text style={calcLabel}>Shipping</Text></Column><Column align="right"><Text style={calcValue}>{formatMoney(shipping)}</Text></Column></Row>
                        <Row style={calcRow}><Column><Text style={calcLabel}>Taxes</Text></Column><Column align="right"><Text style={calcValue}>{formatMoney(taxes)}</Text></Column></Row>

                        <Hr style={divider} />

                        <Row style={totalRow}><Column><Text style={totalLabel}>Total</Text></Column><Column align="right"><Text style={totalValue}>{formatMoney(total)}</Text></Column></Row>
                        {saved > 0 ? <Text style={savedText}>You saved {formatMoney(saved)}</Text> : null}
                    </Section>

                    <Section style={contentCard}>
                        <Heading as="h2" style={sectionHeading}>Customer information</Heading>
                        <Row>
                            <Column style={addressCol}>
                                <Text style={addressHeading}>Shipping address</Text>
                                {renderAddressLines(shippingAddress)}
                            </Column>
                            <Column style={addressCol}>
                                <Text style={addressHeading}>Billing address</Text>
                                {renderAddressLines(billingAddress || shippingAddress)}
                            </Column>
                        </Row>
                    </Section>

                    <Section style={footer}>
                        <Text style={footerText}>
                            Questions? Reply to this email or contact <Link href="mailto:info@swarnacollection.in">info@swarnacollection.in</Link>
                        </Text>
                        <Text style={footerText}>© {new Date().getFullYear()} Swarna Collection. All rights reserved.</Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

const main = { backgroundColor: "#f3f4f6", padding: "20px 0", fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif' };
const container = { width: "100%", maxWidth: "650px", margin: "0 auto" };
const brandBar = { backgroundColor: "#0f172a", borderRadius: "8px 8px 0 0", padding: "20px 24px" };
const brandTitle = { margin: "0", color: "#ffffff", fontSize: "28px", letterSpacing: "4px", textAlign: "center" as const };
const introSection = { backgroundColor: "#ffffff", padding: "20px 24px" };
const introText = { margin: "0 0 10px", color: "#374151", fontSize: "16px", lineHeight: "24px" };
const contentCard = { backgroundColor: "#ffffff", padding: "20px 24px", marginTop: "12px" };
const sectionHeading = { margin: "0 0 16px", color: "#111827", fontSize: "24px", fontWeight: "600" };
const itemRow = { borderBottom: "1px solid #e5e7eb", padding: "12px 0" };
const itemImageCol = { width: "70px" };
const itemInfoCol = { width: "70%" };
const itemAmountCol = { width: "30%" };
const itemImage = { borderRadius: "8px", border: "1px solid #d1d5db", objectFit: "cover" as const };
const itemName = { margin: "0 0 4px", color: "#374151", fontSize: "16px", fontWeight: "500" };
const itemSub = { margin: "0", color: "#6b7280", fontSize: "14px" };
const itemAmount = { margin: "0", color: "#374151", fontSize: "16px", fontWeight: "600" };
const divider = { borderColor: "#e5e7eb", margin: "16px 0" };
const calcRow = { padding: "4px 0" };
const calcLabel = { margin: "0", color: "#6b7280", fontSize: "16px" };
const calcValue = { margin: "0", color: "#374151", fontSize: "16px", fontWeight: "600" };
const totalRow = { paddingTop: "10px" };
const totalLabel = { margin: "0", color: "#374151", fontSize: "24px", fontWeight: "600" };
const totalValue = { margin: "0", color: "#374151", fontSize: "34px", fontWeight: "700" };
const savedText = { margin: "10px 0 0", color: "#6b7280", fontSize: "14px", textAlign: "right" as const };
const addressCol = { verticalAlign: "top" as const, width: "50%", paddingRight: "12px" };
const addressHeading = { margin: "0 0 8px", color: "#374151", fontSize: "18px", fontWeight: "700" };
const addressLine = { margin: "0 0 4px", color: "#6b7280", fontSize: "15px", lineHeight: "22px" };
const footer = { backgroundColor: "#ffffff", padding: "20px 24px", marginTop: "12px", borderRadius: "0 0 8px 8px" };
const footerText = { margin: "0 0 8px", color: "#6b7280", fontSize: "13px", textAlign: "center" as const };

export default ReceiptEmail;
