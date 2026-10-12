package com.asilbalaban.photoswipecleaner;

import android.Manifest;
import android.app.Activity;
import android.app.PendingIntent;
import android.content.ContentUris;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;
import java.util.List;

/**
 * Lists the photos in the device gallery (MediaStore) and deletes or trashes them
 * after the user confirms the system dialog.
 */
@CapacitorPlugin(
    name = "LocalGallery",
    permissions = {
        @Permission(alias = "images", strings = { Manifest.permission.READ_MEDIA_IMAGES }),
        @Permission(alias = "storage", strings = { Manifest.permission.READ_EXTERNAL_STORAGE })
    }
)
public class LocalGalleryPlugin extends Plugin {

    private static final int DEFAULT_LIMIT = 5000;

    private ActivityResultLauncher<IntentSenderRequest> deleteLauncher;
    private String pendingDeleteCallId;

    @Override
    public void load() {
        deleteLauncher = bridge.registerForActivityResult(
            new ActivityResultContracts.StartIntentSenderForResult(),
            result -> {
                PluginCall call = pendingDeleteCallId == null ? null : bridge.getSavedCall(pendingDeleteCallId);
                pendingDeleteCallId = null;
                if (call == null) return;
                JSObject response = new JSObject();
                response.put("confirmed", result.getResultCode() == Activity.RESULT_OK);
                call.resolve(response);
                bridge.releaseCall(call);
            }
        );
    }

    private String permissionAlias() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU ? "images" : "storage";
    }

    @PluginMethod
    public void hasPermission(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", getPermissionState(permissionAlias()) == PermissionState.GRANTED);
        call.resolve(result);
    }

    @PluginMethod
    public void getPhotos(PluginCall call) {
        if (getPermissionState(permissionAlias()) != PermissionState.GRANTED) {
            requestPermissionForAlias(permissionAlias(), call, "photosPermissionCallback");
            return;
        }
        queryPhotos(call);
    }

    @PermissionCallback
    private void photosPermissionCallback(PluginCall call) {
        if (getPermissionState(permissionAlias()) == PermissionState.GRANTED) {
            queryPhotos(call);
        } else {
            call.reject("Gallery permission was denied", "PERMISSION_DENIED");
        }
    }

    private void queryPhotos(PluginCall call) {
        int limit = call.getInt("limit", DEFAULT_LIMIT);
        String[] projection = {
            MediaStore.Images.Media._ID,
            MediaStore.Images.Media.DISPLAY_NAME,
            MediaStore.Images.Media.SIZE,
            MediaStore.Images.Media.MIME_TYPE,
            MediaStore.Images.Media.DATE_TAKEN,
            MediaStore.Images.Media.DATE_ADDED,
            MediaStore.Images.Media.BUCKET_DISPLAY_NAME,
            MediaStore.Images.Media.WIDTH,
            MediaStore.Images.Media.HEIGHT
        };

        JSArray photos = new JSArray();
        int total = 0;
        try (
            Cursor cursor = getContext()
                .getContentResolver()
                .query(
                    MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                    projection,
                    null,
                    null,
                    MediaStore.Images.Media.DATE_ADDED + " DESC"
                )
        ) {
            if (cursor != null) {
                total = cursor.getCount();
                int idCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID);
                int nameCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DISPLAY_NAME);
                int sizeCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.SIZE);
                int mimeCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.MIME_TYPE);
                int takenCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATE_TAKEN);
                int addedCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATE_ADDED);
                int bucketCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.BUCKET_DISPLAY_NAME);
                int widthCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.WIDTH);
                int heightCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.HEIGHT);

                while (cursor.moveToNext() && photos.length() < limit) {
                    long takenMs = cursor.getLong(takenCol);
                    if (takenMs <= 0) {
                        // DATE_ADDED is stored in seconds
                        takenMs = cursor.getLong(addedCol) * 1000L;
                    }
                    JSObject photo = new JSObject();
                    photo.put("id", String.valueOf(cursor.getLong(idCol)));
                    photo.put("name", cursor.getString(nameCol));
                    photo.put("size", cursor.getLong(sizeCol));
                    photo.put("mimeType", cursor.getString(mimeCol));
                    photo.put("dateTaken", takenMs);
                    photo.put("album", cursor.getString(bucketCol));
                    photo.put("width", cursor.getInt(widthCol));
                    photo.put("height", cursor.getInt(heightCol));
                    photos.put(photo);
                }
            }
        } catch (Exception e) {
            call.reject("Could not read the device gallery: " + e.getMessage(), e);
            return;
        }

        JSObject result = new JSObject();
        result.put("photos", photos);
        result.put("total", total);
        call.resolve(result);
    }

    @PluginMethod
    public void deletePhotos(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            call.reject("Deleting gallery photos requires Android 11 or newer", "UNSUPPORTED");
            return;
        }

        JSArray ids = call.getArray("ids");
        boolean permanent = call.getBoolean("permanent", false);
        List<Uri> uris = new ArrayList<>();
        try {
            if (ids != null) {
                for (String id : ids.<String>toList()) {
                    uris.add(ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, Long.parseLong(id)));
                }
            }
        } catch (Exception e) {
            call.reject("Invalid photo ids", e);
            return;
        }
        if (uris.isEmpty()) {
            call.reject("No photos to delete");
            return;
        }

        // The system shows its own confirmation dialog for both requests
        PendingIntent request = permanent
            ? MediaStore.createDeleteRequest(getContext().getContentResolver(), uris)
            : MediaStore.createTrashRequest(getContext().getContentResolver(), uris, true);

        pendingDeleteCallId = call.getCallbackId();
        bridge.saveCall(call);
        getActivity().runOnUiThread(() ->
            deleteLauncher.launch(new IntentSenderRequest.Builder(request.getIntentSender()).build())
        );
    }
}
