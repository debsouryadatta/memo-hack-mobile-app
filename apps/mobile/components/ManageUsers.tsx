import { useApp } from '@/components/ContextProvider';
import { api } from '@/convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import {
  Award,
  BookOpen,
  Edit3,
  Mail,
  Phone,
  Save,
  Search,
  Shield,
  Trash2,
  Users,
  X
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const CLASSES = ['9', '10', '11', '12', 'Repeater'];

export default function ManageUsers() {
  const { token } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    class: '',
    memohackStudent: false,
  });

  // Fetch all users
  const allUsers = useQuery(api.user.getAllUsers, token ? { token } : 'skip');
  
  // Fetch user stats
  const userStats = useQuery(api.user.getUserStats, token ? { token } : 'skip');
  
  // Search users
  const searchedUsers = useQuery(
    api.user.searchUsers,
    token && searchQuery ? { token, searchTerm: searchQuery } : 'skip'
  );

  // Mutations
  const toggleAdminStatus = useMutation(api.user.toggleUserAdminStatus);
  const deleteUserAdmin = useMutation(api.user.deleteUserAsAdmin);
  const updateUserAdmin = useMutation(api.user.updateUserAsAdmin);

  const isLoading = allUsers === undefined || userStats === undefined;

  const handleToggleAdmin = (userId: string, currentAdmin: boolean) => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${currentAdmin ? 'remove' : 'grant'} admin status?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: currentAdmin ? 'destructive' : 'default',
          onPress: async () => {
            try {
              if (!token) return;
              await toggleAdminStatus({
                token,
                targetUserId: userId,
                admin: !currentAdmin,
              });
              Alert.alert('Success', 'Admin status updated');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to update admin status');
            }
          }
        }
      ]
    );
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!token) return;
              await deleteUserAdmin({
                token,
                targetUserId: userId,
              });
              Alert.alert('Success', 'User deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      class: user.class,
      memohackStudent: user.memohackStudent || false,
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setEditForm({
      name: '',
      email: '',
      phone: '',
      class: '',
      memohackStudent: false,
    });
  };

  const handleSaveUserEdit = async () => {
    if (!token || !editingUser) return;

    if (!editForm.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (!editForm.email.trim()) {
      Alert.alert('Error', 'Email is required');
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
      Alert.alert('Success', 'User details updated successfully');
      closeEditModal();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update user details');
    } finally {
      setEditLoading(false);
    }
  };

  // Filter users based on search and class
  const filteredUsers = searchQuery && searchedUsers ? searchedUsers : allUsers;
  const displayedUsers = filterClass && filteredUsers
    ? filteredUsers.filter((u: any) => u.class === filterClass)
    : filteredUsers || [];

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#6366F1" />
        <Text className="text-slate-600 text-base mt-4">Loading users...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Stats Section */}
        {userStats && (
          <View className="px-6 pt-6 pb-4">
            <View className="flex-row flex-wrap">
              {/* Total Users */}
              <View className="w-1/2 pr-2 mb-3">
                <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <View className="flex-row items-center mb-2">
                    <Users size={20} color="#6366F1" />
                    <Text className="text-slate-600 text-xs font-medium ml-2 flex-wrap flex-1">Total Users</Text>
                  </View>
                  <Text className="text-slate-900 text-2xl font-bold">
                    {userStats.totalUsers}
                  </Text>
                </View>
              </View>

              {/* Admins */}
              <View className="w-1/2 pl-1 mb-3">
                <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <View className="flex-row items-center mb-2">
                    <Shield size={20} color="#DC2626" />
                    <Text className="text-slate-600 text-xs font-medium ml-2">Admins</Text>
                  </View>
                  <Text className="text-slate-900 text-2xl font-bold">
                    {userStats.adminCount}
                  </Text>
                </View>
              </View>

              {/* MemoHack Students */}
              <View className="w-1/2 pr-2 mb-3">
                <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <View className="flex-row items-center mb-2">
                    <Award size={20} color="#F59E0B" />
                    <Text className="text-slate-600 text-xs font-medium ml-2">MemoHack</Text>
                  </View>
                  <Text className="text-slate-900 text-2xl font-bold">
                    {userStats.memohackStudents}
                  </Text>
                </View>
              </View>

              {/* Classes Count */}
              <View className="w-1/2 pl-1 mb-3">
                <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <View className="flex-row items-center mb-2">
                    <BookOpen size={20} color="#10B981" />
                    <Text className="text-slate-600 text-xs font-medium ml-2">Classes</Text>
                  </View>
                  <Text className="text-slate-900 text-2xl font-bold">
                    {Object.keys(userStats.usersByClass).length}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Search and Filter Section */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-slate-900 text-lg font-bold mb-4">Search & Filter</Text>
          
          {/* Search Bar */}
          <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-3 py-3 mb-4">
            <Search size={18} color="#64748B" />
            <TextInput
              placeholder="Search by name or email..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-2 text-slate-900"
            />
          </View>

          {/* Class Filter */}
          {userStats && (
            <View>
              <Text className="text-slate-700 font-medium mb-2">Filter by Class:</Text>
              <View className="flex-row flex-wrap">
                <TouchableOpacity
                  onPress={() => setFilterClass(null)}
                  className={`px-4 py-2 rounded-xl mr-2 mb-2 ${
                    filterClass === null
                      ? 'bg-indigo-500'
                      : 'bg-white border border-slate-200'
                  }`}
                >
                  <Text className={`font-medium ${
                    filterClass === null ? 'text-white' : 'text-slate-700'
                  }`}>
                    All
                  </Text>
                </TouchableOpacity>
                {CLASSES.map((classNum) => (
                  <TouchableOpacity
                    key={classNum}
                    onPress={() => setFilterClass(classNum)}
                    className={`px-4 py-2 rounded-xl mr-2 mb-2 ${
                      filterClass === classNum
                        ? 'bg-indigo-500'
                        : 'bg-white border border-slate-200'
                    }`}
                  >
                    <Text className={`font-medium ${
                      filterClass === classNum ? 'text-white' : 'text-slate-700'
                    }`}>
                      {classNum}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Users List */}
        <View className="px-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-slate-900 text-lg font-bold">
              Users ({displayedUsers.length})
            </Text>
          </View>

          {displayedUsers.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center border border-slate-100">
              <Users size={48} color="#64748B" className="mb-4" />
              <Text className="text-slate-900 text-lg font-semibold mb-2">No Users Found</Text>
              <Text className="text-slate-500 text-center text-sm">
                {searchQuery ? 'Try adjusting your search' : 'No users to display'}
              </Text>
            </View>
          ) : (
            displayedUsers.map((user: any) => (
              <View
                key={user._id}
                className="bg-white rounded-2xl p-4 mb-3 border border-slate-100 shadow-sm"
              >
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Text className="text-slate-900 text-base font-semibold">
                        {user.name}
                      </Text>
                      {user.admin && (
                        <View className="bg-amber-100 rounded-full px-2 py-1 ml-2">
                          <Text className="text-amber-700 text-xs font-bold">ADMIN</Text>
                        </View>
                      )}
                      {user.memohackStudent && (
                        <View className="bg-green-100 rounded-full px-2 py-1 ml-1">
                          <Text className="text-green-700 text-xs font-bold">MemoHack</Text>
                        </View>
                      )}
                    </View>

                    {/* Email */}
                    <View className="flex-row items-center mb-2">
                      <Mail size={14} color="#64748B" />
                      <Text className="text-slate-500 text-sm ml-2">{user.email}</Text>
                    </View>

                    {/* Phone */}
                    <View className="flex-row items-center mb-2">
                      <Phone size={14} color="#64748B" />
                      <Text className="text-slate-500 text-sm ml-2">{user.phone}</Text>
                    </View>

                    {/* Class */}
                    <View className="flex-row items-center">
                      <BookOpen size={14} color="#64748B" />
                      <Text className="text-slate-500 text-sm ml-2">Class {user.class}</Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View className="flex-row ml-2">
                    <TouchableOpacity
                      onPress={() => openEditModal(user)}
                      className="bg-green-100 p-2 rounded-lg mr-2"
                    >
                      <Edit3 size={16} color="#16A34A" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleToggleAdmin(user._id, user.admin)}
                      className={`p-2 rounded-lg mr-2 ${
                        user.admin ? 'bg-amber-100' : 'bg-blue-100'
                      }`}
                    >
                      <Shield size={16} color={user.admin ? '#B45309' : '#2563EB'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteUser(user._id, user.name)}
                      className="bg-red-100 p-2 rounded-lg"
                    >
                      <Trash2 size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Edit User Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View className="flex-1 bg-slate-50">
          <View className="flex-row items-center justify-between p-4 bg-white border-b border-slate-200">
            <TouchableOpacity onPress={closeEditModal}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
            <Text className="text-slate-900 text-lg font-bold">Edit User</Text>
            <TouchableOpacity
              onPress={handleSaveUserEdit}
              disabled={editLoading}
              className="bg-indigo-500 px-4 py-2 rounded-lg"
            >
              {editLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Save size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4">
            <View className="bg-white rounded-2xl p-4">
              {/* Name */}
              <View className="mb-4">
                <Text className="text-slate-700 font-medium mb-2">Name</Text>
                <TextInput
                  value={editForm.name}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                  placeholder="User name"
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900"
                />
              </View>

              {/* Email */}
              <View className="mb-4">
                <Text className="text-slate-700 font-medium mb-2">Email</Text>
                <TextInput
                  value={editForm.email}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
                  placeholder="Email address"
                  keyboardType="email-address"
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900"
                />
              </View>

              {/* Phone */}
              <View className="mb-4">
                <Text className="text-slate-700 font-medium mb-2">Phone</Text>
                <TextInput
                  value={editForm.phone}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, phone: text }))}
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900"
                />
              </View>

              {/* Class */}
              <View className="mb-4">
                <Text className="text-slate-700 font-medium mb-2">Class</Text>
                <View className="flex-row flex-wrap gap-2">
                  {CLASSES.map((classNum) => (
                    <TouchableOpacity
                      key={classNum}
                      onPress={() => setEditForm(prev => ({ ...prev, class: classNum }))}
                      className={`px-4 py-2 rounded-xl border ${
                        editForm.class === classNum
                          ? 'bg-indigo-500 border-indigo-500'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text className={`font-medium ${
                        editForm.class === classNum ? 'text-white' : 'text-slate-700'
                      }`}>
                        {classNum}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* MemoHack Student */}
              <View className="mb-4">
                <View className="flex-row items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <Text className="text-slate-700 font-medium">MemoHack Student</Text>
                  <TouchableOpacity
                    onPress={() => setEditForm(prev => ({ ...prev, memohackStudent: !prev.memohackStudent }))}
                    className={`w-12 h-7 rounded-full flex-row items-center px-1 ${
                      editForm.memohackStudent ? 'bg-indigo-500' : 'bg-slate-300'
                    }`}
                  >
                    <View className={`w-5 h-5 rounded-full bg-white ${
                      editForm.memohackStudent ? 'ml-auto' : ''
                    }`} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
