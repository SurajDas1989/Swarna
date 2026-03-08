export function getOrderReference(params: {
    orderNumber?: string | null;
    orderId?: string;
    createdAt?: string | Date | null;
}) {
    const { orderNumber, orderId, createdAt } = params;

    if (orderNumber && orderNumber.trim().length > 0) {
        return orderNumber;
    }

    if (!orderId) {
        return 'SW-ORDER';
    }

    const createdDate = createdAt ? new Date(createdAt) : new Date();
    const isValidDate = !Number.isNaN(createdDate.getTime());
    const yy = isValidDate ? String(createdDate.getFullYear()).slice(-2) : '00';
    const mm = isValidDate ? String(createdDate.getMonth() + 1).padStart(2, '0') : '00';
    const dd = isValidDate ? String(createdDate.getDate()).padStart(2, '0') : '00';
    const datePart = `${yy}${mm}${dd}`;

    const shortPart = orderId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();

    return `SW-${datePart}-${shortPart || '000000'}`;
}

