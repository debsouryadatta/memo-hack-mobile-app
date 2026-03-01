import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import { handleError } from "@/lib/errors";
import { api } from "@memo-hack/convex";
import { useMutation, useQuery } from "convex/react";
import {
    Award,
    BookOpen,
    Edit3,
    Loader2,
    Mail,
    Phone,
    Save,
    Search,
    Shield,
    Trash2,
    Users,
    X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const CLASSES = ["9", "10", "11", "12", "Repeater"];

export default function ManageUsersPage() {
  const { token } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    class: "",
    memohackStudent: false,
  });

  const allUsers = useQuery(api.user.getAllUsers, token ? { token } : "skip");
  const userStats = useQuery(api.user.getUserStats, token ? { token } : "skip");
  const searchedUsers = useQuery(
    api.user.searchUsers,
    token && searchQuery ? { token, searchTerm: searchQuery } : "skip",
  );

  const toggleAdminStatus = useMutation(api.user.toggleUserAdminStatus);
  const deleteUserAdmin = useMutation(api.user.deleteUserAsAdmin);
  const updateUserAdmin = useMutation(api.user.updateUserAsAdmin);

  const isLoading = allUsers === undefined || userStats === undefined;

  const rawList =
    searchQuery && searchedUsers ? searchedUsers : (allUsers ?? []);
  const displayedUsers = filterClass
    ? rawList.filter((u: any) => u.class === filterClass)
    : rawList;

  const handleToggleAdmin = async (userId: string, currentAdmin: boolean) => {
    if (!token) return;
    const action = currentAdmin
      ? "remove admin status from"
      : "grant admin status to";
    if (!window.confirm(`Are you sure you want to ${action} this user?`))
      return;
    try {
      await toggleAdminStatus({
        token,
        targetUserId: userId,
        admin: !currentAdmin,
      });
      toast.success("Admin status updated");
    } catch (err) {
      handleError(err);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!token) return;
    if (!window.confirm(`Delete ${userName}? This cannot be undone.`)) return;
    try {
      await deleteUserAdmin({ token, targetUserId: userId });
      toast.success("User deleted successfully");
    } catch (err) {
      handleError(err);
    }
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      class: user.class,
      memohackStudent: user.memohackStudent ?? false,
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setEditForm({
      name: "",
      email: "",
      phone: "",
      class: "",
      memohackStudent: false,
    });
  };

  const handleSaveEdit = async () => {
    if (!token || !editingUser) return;
    if (!editForm.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!editForm.email.trim()) {
      toast.error("Email is required");
      return;
    }

    setEditLoading(true);
    try {
      await updateUserAdmin({
        token,
        targetUserId: editingUser._id,
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        class: editForm.class,
        memohackStudent: editForm.memohackStudent,
      });
      toast.success("User updated successfully");
      closeEditModal();
    } catch (err) {
      handleError(err);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Manage Users</h1>
        <p className="text-slate-500 text-sm mt-1">
          View, edit, and manage all registered users.
        </p>
      </div>

      {/* Stats Cards */}
      {userStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-indigo-100 rounded-lg p-2 group-hover:bg-indigo-600 transition-colors duration-300">
                <Users className="w-4 h-4 text-indigo-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Total Users
              </p>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {userStats.totalUsers}
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-red-100 rounded-lg p-2 group-hover:bg-red-500 transition-colors duration-300">
                <Shield className="w-4 h-4 text-red-500 group-hover:text-white transition-colors duration-300" />
              </div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Admins
              </p>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {userStats.adminCount}
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-amber-100 rounded-lg p-2 group-hover:bg-amber-500 transition-colors duration-300">
                <Award className="w-4 h-4 text-amber-500 group-hover:text-white transition-colors duration-300" />
              </div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                MemoHack
              </p>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {userStats.memohackStudents}
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-emerald-100 rounded-lg p-2 group-hover:bg-emerald-500 transition-colors duration-300">
                <BookOpen className="w-4 h-4 text-emerald-500 group-hover:text-white transition-colors duration-300" />
              </div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Classes
              </p>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {Object.keys(userStats.usersByClass).length}
            </p>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60 p-6 mb-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-700 mb-4">
          Search & Filter
        </p>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-10 h-11 rounded-xl border-slate-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-all duration-200 hover:scale-110 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterClass(null)}
            className={`cursor-pointer px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 shadow-sm hover:shadow-md ${
              filterClass === null
                ? "bg-indigo-600 text-white shadow-indigo-200"
                : "bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
            }`}
          >
            All
          </button>
          {CLASSES.map((c) => (
            <button
              key={c}
              onClick={() => setFilterClass(c)}
              className={`cursor-pointer px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 shadow-sm hover:shadow-md ${
                filterClass === c
                  ? "bg-indigo-600 text-white shadow-indigo-200"
                  : "bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Users List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">
            Users ({isLoading ? "..." : displayedUsers.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : displayedUsers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center text-center">
            <Users className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-700 font-semibold text-lg">
              No users found
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {searchQuery
                ? "Try adjusting your search"
                : "No users to display"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedUsers.map((user: any) => (
              <div
                key={user._id}
                className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/70 p-5 flex items-start justify-between hover:border-indigo-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:shadow-indigo-100/40 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <p className="font-semibold text-slate-900">{user.name}</p>
                    {user.admin && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                      >
                        ADMIN
                      </Badge>
                    )}
                    {user.memohackStudent && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        MemoHack
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      {user.email}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      {user.phone}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      Class {user.class}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  <button
                    onClick={() => openEditModal(user)}
                    title="Edit"
                    className="cursor-pointer p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-emerald-200"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleAdmin(user._id, user.admin)}
                    title={user.admin ? "Remove admin" : "Make admin"}
                    className={`cursor-pointer p-2 rounded-lg transition-all duration-300 hover:scale-110 shadow-sm ${
                      user.admin
                        ? "bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white hover:shadow-amber-200"
                        : "bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white hover:shadow-blue-200"
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user._id, user.name)}
                    title="Delete"
                    className="cursor-pointer p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      <Dialog
        open={showEditModal}
        onOpenChange={(open) => !open && closeEditModal()}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="Email address"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <div className="flex gap-2 flex-wrap">
                {CLASSES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditForm((p) => ({ ...p, class: c }))}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      editForm.class === c
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
              <Label className="cursor-pointer">MemoHack Student</Label>
              <Switch
                checked={editForm.memohackStudent}
                onCheckedChange={(v) =>
                  setEditForm((p) => ({ ...p, memohackStudent: v }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={closeEditModal}
              className="cursor-pointer rounded-xl hover:bg-slate-100 transition-colors duration-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={editLoading}
              className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200"
            >
              {editLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
