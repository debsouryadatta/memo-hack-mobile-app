import { useApp, type User as AppUser } from "@/components/ContextProvider";
import { alertInfo } from "@/lib/confirm";
import { getErrorMessage } from "@/lib/errors";
import {
  prepareProfileImage,
  uploadToConvexStorage,
} from "@/lib/imageUpload";
import { api, type Id } from "@memo-hack/convex";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useMutation } from "convex/react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ChevronDown,
  GraduationCap,
  Mail,
  Phone,
  User as UserIcon,
} from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CLASS_OPTIONS = ["9", "10", "11", "12", "Repeater"] as const;

function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { user, setUser } = useApp();

  const updateUser = useMutation(api.user.updateUser);
  const generateProfileUploadUrl = useMutation(
    api.user.generateProfileImageUploadUrl,
  );
  const commitProfileImage = useMutation(api.user.commitProfileImageUpload);

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [classLevel, setClassLevel] = React.useState("");
  const [memohackStudent, setMemohackStudent] = React.useState<boolean>(false);
  const [showClassMenu, setShowClassMenu] = React.useState(false);
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [localUser, setLocalUser] = React.useState<AppUser | null>(null);
  const seededRef = React.useRef(false);

  React.useEffect(() => {
    if (!user) {
      router.back();
      return;
    }
    if (seededRef.current) return;
    seededRef.current = true;
    setLocalUser(user);
    setName(user.name);
    setPhone(user.phone.replace(/\D/g, "").slice(0, 10));
    setClassLevel(user.class);
    setMemohackStudent(user.memohackStudent ?? false);
  }, [user, router]);

  const displayUser = localUser ?? user;
  if (!displayUser) {
    return null;
  }

  const handleChangePhoto = async () => {
    if (uploadingPhoto) return;
    try {
      setUploadingPhoto(true);
      const prepared = await prepareProfileImage();
      if (!prepared) {
        alertInfo(
          "No photo",
          "No image was selected or permission was denied.",
        );
        return;
      }
      const { uploadUrl } = await generateProfileUploadUrl({});
      const storageId = await uploadToConvexStorage(
        uploadUrl,
        prepared.uri,
        prepared.mime,
      );
      const updated = await commitProfileImage({
        storageId: storageId as Id<"_storage">,
      });
      const u = updated as AppUser;
      setUser(u);
      setLocalUser(u);
      alertInfo("Done", "Profile photo updated.");
    } catch (e) {
      alertInfo(
        "Could not update photo",
        e instanceof Error ? e.message : "Please try again.",
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alertInfo("Validation", "Please enter your name.");
      return;
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      alertInfo("Validation", "Please enter a valid 10-digit phone number.");
      return;
    }
    if (!classLevel.trim()) {
      alertInfo("Validation", "Please select your class.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateUser({
        name: name.trim(),
        phone: digits,
        class: classLevel.trim(),
        memohackStudent,
      });
      const u = updated as AppUser;
      setUser(u);
      setLocalUser(u);
      alertInfo("Saved", "Your profile was updated.");
      router.back();
    } catch (e) {
      alertInfo("Could not save", getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (saving) return;
    router.back();
  };

  return (
    <View className="flex-1 bg-slate-50">
      <LinearGradient
        colors={["#6366F1", "#4F46E5", "#4338CA"]}
        style={{ paddingTop: insets.top + 10, paddingBottom: 12 }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 760,
            alignSelf: "center",
            paddingHorizontal: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <TouchableOpacity
              onPress={handleBack}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.18)",
              }}
            >
              <ArrowLeft size={20} color="white" />
            </TouchableOpacity>
            <Text
              style={{
                color: "white",
                fontSize: 17,
                lineHeight: 22,
                fontWeight: "700",
                flex: 1,
                minWidth: 0,
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Edit profile
            </Text>
            <View style={{ width: 44, height: 44 }} />
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "web" ? undefined : "padding"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            padding: 16,
            paddingBottom: tabBarHeight + 28,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mb-6">
            <View className="relative">
              <View
                className="rounded-full overflow-hidden bg-slate-200"
                style={{ width: 96, height: 96 }}
              >
                {displayUser.image ? (
                  <Image
                    source={{ uri: displayUser.image }}
                    style={{ width: 96, height: 96 }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    recyclingKey={displayUser.image}
                  />
                ) : (
                  <View className="h-full w-full items-center justify-center bg-slate-300">
                    <Text className="text-slate-600 text-2xl font-bold">
                      {avatarInitials(displayUser.name)}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={handleChangePhoto}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 rounded-full bg-indigo-600 px-3 py-2"
                style={{ opacity: uploadingPhoto ? 0.7 : 1 }}
              >
                {uploadingPhoto ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-white text-xs font-semibold">
                    Change photo
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
            <Text className="text-slate-500 text-xs font-semibold mb-2">
              FULL NAME
            </Text>
            <View className="flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-3">
              <UserIcon size={18} color="#64748B" />
              <TextInput
                className="flex-1 py-3 px-2 text-slate-900 text-sm"
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor="#94A3B8"
                editable={!saving}
              />
            </View>
          </View>

          <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
            <Text className="text-slate-500 text-xs font-semibold mb-2">
              EMAIL (cannot be changed)
            </Text>
            <View className="flex-row items-center rounded-xl border border-slate-100 bg-slate-100 px-3 py-3">
              <Mail size={18} color="#64748B" />
              <Text className="flex-1 px-2 text-slate-600 text-sm">
                {displayUser.email}
              </Text>
            </View>
          </View>

          <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
            <Text className="text-slate-500 text-xs font-semibold mb-2">
              PHONE NUMBER
            </Text>
            <View className="flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-3">
              <Phone size={18} color="#64748B" />
              <TextInput
                className="flex-1 py-3 px-2 text-slate-900 text-sm"
                value={phone}
                onChangeText={(t) =>
                  setPhone(t.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="10-digit mobile number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={10}
                editable={!saving}
              />
            </View>
          </View>

          <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 z-10">
            <Text className="text-slate-500 text-xs font-semibold mb-2">
              CLASS
            </Text>
            <TouchableOpacity
              onPress={() => setShowClassMenu(!showClassMenu)}
              disabled={saving}
              className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
            >
              <View className="flex-row items-center flex-1">
                <GraduationCap size={18} color="#64748B" />
                <Text
                  className={`flex-1 px-2 text-sm ${classLevel ? "text-slate-900" : "text-slate-400"}`}
                >
                  {classLevel
                    ? classLevel === "Repeater"
                      ? "Repeater"
                      : `Class ${classLevel}`
                    : "Select class"}
                </Text>
              </View>
              <ChevronDown
                size={18}
                color="#64748B"
                style={{
                  transform: [{ rotate: showClassMenu ? "180deg" : "0deg" }],
                }}
              />
            </TouchableOpacity>
            {showClassMenu && (
              <View className="mt-2 rounded-xl border border-slate-200 overflow-hidden bg-white">
                {CLASS_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => {
                      setClassLevel(opt);
                      setShowClassMenu(false);
                    }}
                    className="px-4 py-2.5 border-b border-slate-100 last:border-b-0"
                  >
                    <Text
                      className={`text-sm ${classLevel === opt ? "text-indigo-600 font-semibold" : "text-slate-800"}`}
                    >
                      {opt === "Repeater" ? "Repeater" : `Class ${opt}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-5">
            <Text className="text-slate-500 text-xs font-semibold mb-3">
              STUDYING IN MEMOHACK?
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setMemohackStudent(true)}
                disabled={saving}
                className={`flex-1 rounded-xl py-3 border ${
                  memohackStudent
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <Text
                  className={`text-center font-semibold ${memohackStudent ? "text-indigo-700" : "text-slate-600"}`}
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMemohackStudent(false)}
                disabled={saving}
                className={`flex-1 rounded-xl py-3 border ${
                  !memohackStudent
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <Text
                  className={`text-center font-semibold ${!memohackStudent ? "text-indigo-700" : "text-slate-600"}`}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="rounded-xl bg-indigo-600 py-3.5 items-center"
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base font-bold">Save changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
