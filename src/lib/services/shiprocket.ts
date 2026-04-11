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

/**
 * Estimates delivery time based on pickup and delivery pincodes.
 */
export async function getDeliveryEstimate(deliveryPincode: string) {
    const token = await authenticate();
    const pickupPincode = process.env.SHIPROCKET_PICKUP_PINCODE || "110001"; // Fallback if missing

    const params = new URLSearchParams({
        pickup_postcode: pickupPincode,
        delivery_postcode: deliveryPincode,
        cod: "0",
        weight: "0.5"
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

    // Find the courier with the fastest delivery time
    const couriers = data.data.available_courier_companies as any[];
    if (couriers.length === 0) {
        throw new Error("Delivery not available to this pincode.");
    }

    const fastestCourier = couriers.reduce((prev, curr) => 
        (curr.estimated_delivery_days < prev.estimated_delivery_days) ? curr : prev
    );

    return {
        etd: fastestCourier.etd, // Estimated Time of Delivery (Date string)
        estimatedDays: fastestCourier.estimated_delivery_days,
        courierName: fastestCourier.courier_name
    };
}
