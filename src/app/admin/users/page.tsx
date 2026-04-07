import prisma from "@/lib/prisma";
import { UserManagementClient } from "./UserManagementClient";
import { Metadata } from "next";
import { requireAdminOrStaff } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Customers | Admin",
  description: "Manage your customer base and view consumer insights.",
  robots: { index: false, follow: false },
};

// Force dynamic rendering since we want real-time user data and balances
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      orders: {
        select: {
          total: true,
          status: true,
        },
      },
    }
  });

  // Calculate stats
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const totalCustomers = users.length;
  const newCustomers = users.filter(u => u.createdAt > thirtyDaysAgo).length;
  const totalRevenue = users.reduce((acc, user) => {
    const userTotal = user.orders
      .filter(o => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + Number(o.total), 0);
    return acc + userTotal;
  }, 0);

  // Convert for client component
  const serializedUsers = users.map(user => {
    const validOrders = user.orders.filter(o => o.status !== 'CANCELLED');
    const totalSpent = validOrders.reduce((sum, o) => sum + Number(o.total), 0);
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      storeCredit: Number(user.storeCredit),
      createdAt: user.createdAt,
      orderCount: validOrders.length,
      totalSpent: totalSpent,
      address: user.address,
    };
  });

  const stats = {
    totalCustomers,
    newCustomers,
    totalRevenue,
  };

  const userRole = (await requireAdminOrStaff())?.role || "CUSTOMER";

  return (
    <div className="p-8">
      <UserManagementClient initialUsers={serializedUsers} stats={stats} role={userRole} />
    </div>
  );
}
