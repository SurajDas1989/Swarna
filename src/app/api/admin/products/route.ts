import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createServiceRoleSupabaseClient, requireAdminOrStaff } from '@/lib/supabase-server';
import { revalidatePath, revalidateTag } from 'next/cache';
import type { Prisma } from '@/generated/prisma';
import { getCategoryTag, getProductTag, getProductsListTag, getProductsRelatedTag } from '@/lib/storefront-products';

const PRODUCT_BUCKET = 'products';

function revalidateStorefrontProductTags(productId?: string, categorySlugs: string[] = []) {
    revalidateTag(getProductsListTag(), 'cache');
    revalidateTag(getProductsRelatedTag(), 'cache');
    revalidatePath('/');

    if (productId) {
        revalidateTag(getProductTag(productId), 'cache');
        revalidatePath(`/product/${productId}`);
    }

    for (const slug of [...new Set(categorySlugs.filter(Boolean))]) {
        revalidateTag(getCategoryTag(slug), 'cache');
    }
}

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
        const user = await requireAdminOrStaff();
        if (!user) {
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
            sku,
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
                sku: sku || null,
            },
            select: {
                id: true,
                category: {
                    select: {
                        slug: true,
                    },
                },
            },
        });

        revalidateStorefrontProductTags(product.id, [product.category.slug]);

        return NextResponse.json(product);
    } catch (error) {
        console.error('Failed to create product:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const user = await requireAdminOrStaff();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { id, name, categoryId, price, compareAtPrice, costPerItem, chargeTax, description, images, stock, isActive, isFeatured, sku } = body;

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const existingProduct = await prisma.product.findUnique({
            where: { id },
            select: {
                images: true,
                stock: true,
                category: {
                    select: {
                        slug: true,
                    },
                },
            },
        });
        if (!existingProduct) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const updateData: Prisma.ProductUpdateInput = {};
        if (name !== undefined) {
            updateData.name = name;
            updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        }
        if (categoryId !== undefined) {
            updateData.category = {
                connect: { id: categoryId },
            };
        }
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
        if (sku !== undefined) updateData.sku = sku || null;

        const product = await prisma.product.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                category: {
                    select: {
                        slug: true,
                    },
                },
            },
        });

        revalidateStorefrontProductTags(id, [existingProduct.category.slug, product.category.slug]);

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
        const user = await requireAdminOrStaff();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const existingProduct = await prisma.product.findUnique({
            where: { id },
            select: {
                images: true,
                category: {
                    select: {
                        slug: true,
                    },
                },
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

        revalidateStorefrontProductTags(id, [existingProduct.category.slug]);
        await deleteStorageImages(existingProduct.images, id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete product:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const user = await requireAdminOrStaff();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const prefix = searchParams.get('prefix');

        if (!prefix) {
            return NextResponse.json({ error: 'Prefix required' }, { status: 400 });
        }

        const products = await prisma.product.findMany({
            where: {
                sku: {
                    startsWith: prefix,
                },
            },
            select: {
                sku: true,
            },
        });

        let nextSequence = 1;
        if (products.length > 0) {
            const sequences = products
                .map(p => {
                    const parts = p.sku?.split('-');
                    if (!parts || parts.length < 2) return 0;
                    const seqStr = parts[parts.length - 1];
                    return parseInt(seqStr) || 0;
                })
                .filter(seq => seq > 0);

            if (sequences.length > 0) {
                nextSequence = Math.max(...sequences) + 1;
            }
        }

        return NextResponse.json({ nextSequence });
    } catch (error) {
        console.error('Failed to fetch SKU sequence:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
