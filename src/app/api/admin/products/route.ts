import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createServiceRoleSupabaseClient, requireAdmin } from '@/lib/supabase-server';

const PRODUCT_BUCKET = 'products';

function getOutOfStockSinceUpdate(nextStock: number, previousStock?: number) {
    if (nextStock > 0) {
        return null;
    }

    if (previousStock !== undefined && previousStock <= 0) {
        return undefined;
    }

    return new Date();
}

function getStoragePathFromUrl(url: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || !url.startsWith(supabaseUrl)) {
        return null;
    }

    const publicPrefix = `${supabaseUrl}/storage/v1/object/public/${PRODUCT_BUCKET}/`;
    if (!url.startsWith(publicPrefix)) {
        return null;
    }

    return url.slice(publicPrefix.length);
}

async function deleteStorageImages(imageUrls: string[], excludingProductId?: string) {
    const uniqueUrls = [...new Set(imageUrls)];
    if (uniqueUrls.length === 0) return;

    const removableUrls: string[] = [];
    for (const imageUrl of uniqueUrls) {
        const usageCount = await prisma.product.count({
            where: {
                ...(excludingProductId ? { id: { not: excludingProductId } } : {}),
                images: { has: imageUrl },
            },
        });

        if (usageCount === 0) {
            removableUrls.push(imageUrl);
        }
    }

    const paths = removableUrls
        .map(getStoragePathFromUrl)
        .filter((path): path is string => Boolean(path));

    if (paths.length === 0) return;

    try {
        const supabase = createServiceRoleSupabaseClient();
        if (!supabase) {
            console.error('SUPABASE_SERVICE_ROLE_KEY is missing; cannot delete removed product images from storage.');
            return;
        }

        const { error } = await supabase.storage.from(PRODUCT_BUCKET).remove(paths);
        if (error) {
            console.error('Failed to delete product images from storage:', error);
        }
    } catch (error) {
        console.error('Unexpected storage deletion error:', error);
    }
}

export async function POST(request: Request) {
    try {
        const admin = await requireAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const {
            name,
            categoryId,
            price,
            compareAtPrice,
            costPerItem,
            chargeTax = true,
            description,
            images,
            stock,
            isActive = true,
            isFeatured = false,
        } = body;

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        const product = await prisma.product.create({
            data: {
                name,
                slug,
                description,
                price: Number(price),
                compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
                costPerItem: costPerItem ? Number(costPerItem) : null,
                chargeTax: Boolean(chargeTax),
                images: images || [],
                categoryId,
                stock: Number(stock) || 0,
                outOfStockSince: Number(stock) > 0 ? null : new Date(),
                isActive: Boolean(isActive),
                isFeatured: Boolean(isFeatured),
            }
        });

        return NextResponse.json(product);
    } catch (error) {
        console.error('Failed to create product:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const admin = await requireAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { id, name, categoryId, price, compareAtPrice, costPerItem, chargeTax, description, images, stock, isActive, isFeatured } = body;

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const existingProduct = await prisma.product.findUnique({
            where: { id },
            select: { images: true, stock: true },
        });
        if (!existingProduct) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (categoryId !== undefined) updateData.categoryId = categoryId;
        if (price !== undefined) updateData.price = Number(price);
        if (compareAtPrice !== undefined) updateData.compareAtPrice = compareAtPrice ? Number(compareAtPrice) : null;
        if (costPerItem !== undefined) updateData.costPerItem = costPerItem ? Number(costPerItem) : null;
        if (chargeTax !== undefined) updateData.chargeTax = Boolean(chargeTax);
        if (description !== undefined) updateData.description = description;
        if (images !== undefined) updateData.images = images;
        if (stock !== undefined) {
            const nextStock = Number(stock);
            updateData.stock = nextStock;

            const outOfStockSince = getOutOfStockSinceUpdate(nextStock, existingProduct.stock);
            if (outOfStockSince !== undefined) {
                updateData.outOfStockSince = outOfStockSince;
            }
        }
        if (isActive !== undefined) updateData.isActive = isActive;
        if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

        const product = await prisma.product.update({
            where: { id },
            data: updateData
        });

        if (images !== undefined) {
            const removedImages = existingProduct.images.filter((imageUrl) => !images.includes(imageUrl));
            await deleteStorageImages(removedImages, id);
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error('Failed to update product:', error);
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const admin = await requireAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const existingProduct = await prisma.product.findUnique({
            where: { id },
            select: {
                images: true,
                _count: {
                    select: {
                        orderItems: true,
                        cartItems: true,
                        wishlistedBy: true,
                    },
                },
            },
        });
        if (!existingProduct) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        if (existingProduct._count.orderItems > 0) {
            return NextResponse.json({
                error: 'This product has order history. Deactivate it instead of deleting.',
                code: 'PRODUCT_HAS_ORDERS',
            }, { status: 400 });
        }

        await prisma.product.delete({
            where: { id }
        });

        await deleteStorageImages(existingProduct.images, id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete product:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

