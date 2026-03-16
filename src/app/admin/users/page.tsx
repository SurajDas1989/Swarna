import prisma from "@/lib/prisma";
import { UserManagementClient } from "./UserManagementClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Management | Admin",
  description: "Manage users and issue store credit.",
  robots: { index: false, follow: false },
};

// Force dynamic rendering since we want real-time user data and balances
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      storeCredit: true,
      createdAt: true,
    }
  });

  // Convert decimal to number for client component serialization
  const serializedUsers = users.map(user => ({
    ...user,
    storeCredit: Number(user.storeCredit)
  }));

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-gray-500 mt-2">View customers and manage store credit balances.</p>
      </div>

      <UserManagementClient initialUsers={serializedUsers} />
    </div>
  );
}
