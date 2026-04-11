import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

/** Max size of the original pick before client compression (10 MB). */
export const MAX_IMAGE_BYTES_ORIGINAL = 10 * 1024 * 1024;

const PROFILE_MAX_EDGE = 1400;
const CHAT_MAX_EDGE = 1800;
/** Moderate JPEG quality — smaller files without heavy visible loss. */
const JPEG_QUALITY = 0.82;

export type PreparedImage = {
  uri: string;
  mime: "image/jpeg";
};

function assertImageMime(mime: string | undefined): void {
  if (!mime || !mime.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
}

export async function requestMediaPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === "granted";
}

async function pickAsset(): Promise<ImagePicker.ImagePickerAsset | null> {
  const allowed = await requestMediaPermission();
  if (!allowed) return null;
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 1,
  });
  if (res.canceled || !res.assets[0]) return null;
  return res.assets[0];
}

async function assertUnderMaxBytes(uri: string): Promise<void> {
  if (Platform.OS === "web") {
    const res = await fetch(uri);
    if (!res.ok) {
      throw new Error("Could not read the selected image. Please try another.");
    }
    const blob = await res.blob();
    if (blob.size > MAX_IMAGE_BYTES_ORIGINAL) {
      throw new Error("Image is too large (max 10 MB). Try a smaller photo.");
    }
    return;
  }
  const info = await FileSystem.getInfoAsync(uri, { size: true });
  if (
    info.exists &&
    "size" in info &&
    info.size != null &&
    info.size > MAX_IMAGE_BYTES_ORIGINAL
  ) {
    throw new Error("Image is too large (max 10 MB). Try a smaller photo.");
  }
}

export async function prepareProfileImage(): Promise<PreparedImage | null> {
  const asset = await pickAsset();
  if (!asset) return null;
  assertImageMime(asset.mimeType ?? "image/jpeg");
  await assertUnderMaxBytes(asset.uri);
  const manipulated = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: PROFILE_MAX_EDGE } }],
    { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );
  return { uri: manipulated.uri, mime: "image/jpeg" };
}

export async function prepareChatImage(): Promise<PreparedImage | null> {
  const asset = await pickAsset();
  if (!asset) return null;
  assertImageMime(asset.mimeType ?? "image/jpeg");
  await assertUnderMaxBytes(asset.uri);
  const manipulated = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: CHAT_MAX_EDGE } }],
    { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );
  return { uri: manipulated.uri, mime: "image/jpeg" };
}

export async function uploadToConvexStorage(
  uploadUrl: string,
  localUri: string,
  contentType: string,
): Promise<string> {
  if (Platform.OS === "web") {
    const fileRes = await fetch(localUri);
    if (!fileRes.ok) {
      throw new Error(`Could not read image (${fileRes.status})`);
    }
    const raw = await fileRes.blob();
    const body =
      raw.type === contentType
        ? raw
        : new Blob([raw], { type: contentType });
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body,
    });
    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(
        `Upload failed (${uploadRes.status})${errText ? `: ${errText.slice(0, 120)}` : ""}`,
      );
    }
    const json = (await uploadRes.json()) as { storageId?: string };
    if (!json.storageId) {
      throw new Error("Upload did not return storageId");
    }
    return json.storageId;
  }

  const result = await FileSystem.uploadAsync(uploadUrl, localUri, {
    httpMethod: "POST",
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: { "Content-Type": contentType },
  });
  if (result.status !== 200) {
    throw new Error(`Upload failed (${result.status})`);
  }
  const parsed = JSON.parse(result.body) as { storageId?: string };
  if (!parsed.storageId) {
    throw new Error("Upload did not return storageId");
  }
  return parsed.storageId;
}
