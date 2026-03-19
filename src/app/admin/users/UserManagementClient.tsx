"use client";

import { useState } from "react";
import { Search, Wallet, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

type UserType = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  storeCredit: number;
  createdAt: Date;
};

export function UserManagementClient({ initialUsers }: { initialUsers: UserType[] }) {
  const [users, setUsers] = useState<UserType[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  
  // Modal State
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const filteredUsers = users.filter((u) => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    (u.firstName && u.firstName.toLowerCase().includes(search.toLowerCase()))
  );

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val);
  };

  const handleIssueCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: parseFloat(amount),
          reason
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, storeCredit: Number(data.updatedStoreCredit) } 
          : u
      ));

      toast.success("Store credit successfully updated");
      closeModal();
    } catch (err: any) {
      toast.error(err.message || "Failed to issue credit");
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
    setAmount("");
    setReason("");
  };

  return (
    <div>
      {/* Search Bar */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search users by email or name..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:bg-white/5 dark:border-white/10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Available Credit</th>
                <th className="px-6 py-4 font-semibold">Joined Date</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium">{user.firstName} {user.lastName}</div>
                    <div className="text-gray-500 text-xs">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-semibold ${user.storeCredit > 0 ? "text-success" : ""}`}>
                      {formatMoney(user.storeCredit)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="inline-flex items-center gap-1 text-primary hover:text-primary-dark font-medium px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      <Wallet className="w-4 h-4" />
                      Manage Credit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Credit Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl p-6">
            <div role="heading" aria-level={2} className="text-xl font-bold mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Manage Store Credit
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Modifying credit balance for <strong>{selectedUser.email}</strong>. 
              <br/>Current Balance: <span className="font-bold text-foreground">{formatMoney(selectedUser.storeCredit)}</span>
            </p>

            <form onSubmit={handleIssueCredit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Amount ({"\u20B9"})</label>
                <p className="text-xs text-gray-500 mb-2">Use positive numbers to add credit, negative to deduct.</p>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 500 or -500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none dark:bg-white/5 dark:border-white/10"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Reason for Transaction</label>
                <p className="text-xs text-gray-500 mb-2">This will be permanently recorded in the user's ledger.</p>
                <input
                  type="text"
                  required
                  placeholder="e.g. Refund for damaged Order #1042"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none dark:bg-white/5 dark:border-white/10"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
