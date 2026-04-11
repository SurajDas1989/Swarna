import prisma from '@/lib/prisma';

let cachedToken: string | null = null;
let tokenExpiryTime: number | null = null;

/**
 * Authenticates with the Shiprocket API and caches the token.
 */
export async function authenticate(): Promise<string> {
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;

    if (!email || !password) {
        throw new Error('SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD must be configured.');
    }

    // Check if we have a valid cached token (adding 10 min safety buffer for expiry)
    if (cachedToken && tokenExpiryTime && Date.now() < tokenExpiryTime - 10 * 60 * 1000) {
        return cachedToken;
    }

    const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Shiprocket auth failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.token) {
        throw new Error('No token found in Shiprocket auth response.');
    }

    cachedToken = data.token;
    // Shiprocket tokens typically last 10 days (240 hours). We'll expire our cache after 9 days.
    tokenExpiryTime = Date.now() + 9 * 24 * 60 * 60 * 1000;

    if (!cachedToken) {
        throw new Error("Failed to cache token");
    }

    return cachedToken;
}

/**
 * Pushes a paid/confirmed order to Shiprocket.
 */
export async function createCustomOrder(orderId: string) {
    const token = await authenticate();

    // 1. Fetch full order with details
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: true } } }
    });

    if (!order) {
        throw new Error(`Order ${orderId} not found.`);
    }

    // 2. Validate prerequisites
    if (order.shiprocketOrderId) {
        throw new Error("Order already pushed to Shiprocket");
    }

    if (order.status !== 'PAID' && order.status !== 'CONFIRMED') {
        throw new Error("Only paid or confirmed orders can be pushed");
    }

    // Extract customer info (fallback to guest details if available)
    const firstName = order.guestFirstName || 'Customer';
    const lastName = order.guestLastName || '';
    const email = order.guestEmail || 'shop@swarna.com';
    const phone = order.guestPhone || '9999999999';

    // Best-effort extraction from stringified or simple address formats
    // If the address field contains commas, we attempt to split. Otherwise, we put it all in address1.
    const rawAddress = order.guestAddress || 'Address not provided';
    const addrParts = rawAddress.split(',');
    
    // We assume the last two parts of the address *might* be state and pincode,
    // but without strict address validation, we'll pass standard fallbacks and the raw address.
    const addressLine = addrParts.length > 0 ? addrParts[0].trim() : rawAddress;
    const city = "Unknown City"; // TODO: Should parse properly based on your DB or form fields
    const state = "Unknown State";
    
    // Attempt to extract 6 digit pincode from the string
    const pincodeMatch = rawAddress.match(/\b\d{6}\b/);
    const pincode = pincodeMatch ? pincodeMatch[0] : "110001"; // Fallback to avoid API error if invalid

    // Map order items to Shiprocket format
    const shiprocketItems = order.items.map(item => ({
        name: item.product?.name || `Product - ${item.productId}`,
        sku: item.product?.sku || item.productId,
        units: item.quantity,
        selling_price: parseFloat(item.price.toString())
    }));

    // 3. Build the payload
    const payload = {
        order_id: order.orderNumber || order.id.slice(0, 8).toUpperCase(),
        order_date: order.createdAt.toISOString().replace(/T/, ' ').replace(/\..+/, ''), // Shiprocket format YYYY-MM-DD HH:MM
        pickup_location: "Primary",
        channel_id: "",
        billing_customer_name: firstName,
        billing_last_name: lastName,
        billing_address: addressLine,
        billing_address_2: addrParts.length > 1 ? addrParts.slice(1).join(', ') : "",
        billing_city: city,
        billing_pincode: pincode,
        billing_state: state,
        billing_country: "India",
        billing_email: email,
        billing_phone: phone,
        shipping_is_billing: true,
        order_items: shiprocketItems,
        payment_method: order.paymentMethod === 'COD' ? "COD" : "Prepaid",
        sub_total: parseFloat(order.total.toString()),
        // Fixed dimensions for jewelry boxes
        length: 10,
        breadth: 10,
        height: 5,
        weight: 0.5
    };

    // 4. Send to Shiprocket
    const response = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to create Shiprocket order: ${response.status} ${errorData}`);
    }

    const data = await response.json();

    // 5. Update Order in DB
    const shiprocketOrderId = data.order_id?.toString();
    const shiprocketShipmentId = data.shipment_id?.toString();
    const awbCode = data.awb_code;

    const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
            shiprocketOrderId,
            shiprocketShipmentId,
            awbCode,
            trackingUrl: awbCode ? `https://shiprocket.co/tracking/${awbCode}` : null
        }
    });

    return { 
        shiprocketOrderId: updatedOrder.shiprocketOrderId, 
        awbCode: updatedOrder.awbCode, 
        trackingUrl: updatedOrder.trackingUrl 
    };
}

/**
 * Tracks a shipment using its AWB code.
 */
export async function trackShipment(awbCode: string) {
    const token = await authenticate();

    const response = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awbCode}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch tracking details: ${response.status}`);
    }

    return await response.json();
}

function addBusinessDays(baseDate: Date, businessDaysToAdd: number): Date {
    const date = new Date(baseDate);
    let added = 0;

    while (added < businessDaysToAdd) {
        date.setDate(date.getDate() + 1);
        const day = date.getDay();
        if (day !== 0 && day !== 6) {
            added += 1;
        }
    }

    return date;
}

function isValidDate(value: unknown): value is string {
    if (typeof value !== "string" || !value) return false;
    return !Number.isNaN(new Date(value).getTime());
}

type DeliveryEstimateOptions = {
    cod?: boolean;
    weightKg?: number;
};

type ShiprocketCourier = {
    etd?: string;
    estimated_delivery_days?: number | string;
    courier_name?: string;
};

/**
 * Estimates delivery time based on pickup and delivery pincodes.
 */
export async function getDeliveryEstimate(deliveryPincode: string, options: DeliveryEstimateOptions = {}) {
    const token = await authenticate();
    const pickupPincode = process.env.SHIPROCKET_PICKUP_PINCODE || "110001"; // Fallback if missing
    const cod = options.cod ?? true;
    const normalizedWeightKg = Number.isFinite(options.weightKg)
        ? Math.min(Math.max(options.weightKg as number, 0.1), 5)
        : 0.5;

    const params = new URLSearchParams({
        pickup_postcode: pickupPincode,
        delivery_postcode: deliveryPincode,
        cod: cod ? "1" : "0",
        weight: normalizedWeightKg.toFixed(2)
    });

    const response = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/serviceability/?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to check serviceability: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 200 || !data.data || !data.data.available_courier_companies) {
        throw new Error("Delivery not available to this pincode.");
    }

    const couriers = data.data.available_courier_companies as ShiprocketCourier[];
    if (couriers.length === 0) {
        throw new Error("Delivery not available to this pincode.");
    }

    const normalizedCouriers = couriers
        .map((courier) => ({
            ...courier,
            estimated_delivery_days: Number(courier.estimated_delivery_days),
        }))
        .filter((courier) => Number.isFinite(courier.estimated_delivery_days))
        .sort((a, b) => a.estimated_delivery_days - b.estimated_delivery_days);

    if (normalizedCouriers.length === 0) {
        throw new Error("Delivery not available to this pincode.");
    }

    // Do not show fastest ETA. Use second-fastest for 2 options, median for 3+ options.
    const selectedIndex =
        normalizedCouriers.length >= 3
            ? Math.floor(normalizedCouriers.length / 2)
            : Math.min(1, normalizedCouriers.length - 1);
    const selectedCourier = normalizedCouriers[selectedIndex];

    const baseEtaDate = isValidDate(selectedCourier.etd)
        ? new Date(selectedCourier.etd)
        : addBusinessDays(new Date(), Math.max(1, Math.round(selectedCourier.estimated_delivery_days)));

    // Add 1 business day as handling/packing buffer.
    const etaStartDate = addBusinessDays(baseEtaDate, 1);
    // Show a customer-friendly delivery range instead of a single optimistic date.
    const etaEndDate = addBusinessDays(etaStartDate, 2);

    return {
        etd: selectedCourier.etd, // Raw courier ETA for debugging/ops
        etdStart: etaStartDate.toISOString(),
        etdEnd: etaEndDate.toISOString(),
        estimatedDays: selectedCourier.estimated_delivery_days,
        courierName: selectedCourier.courier_name,
        courierSelection:
            normalizedCouriers.length >= 3 ? "median" : normalizedCouriers.length === 2 ? "second_fastest" : "only_option",
        codUsed: cod,
        weightKgUsed: normalizedWeightKg,
        handlingBufferBusinessDays: 1,
    };
}
