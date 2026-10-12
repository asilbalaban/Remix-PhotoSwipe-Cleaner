package com.asilbalaban.photoswipecleaner;

import android.content.ContentResolver;
import android.content.ContentUris;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.ImageDecoder;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Size;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Serves downscaled gallery photos to the WebView at /_local_thumb_/{mediaId}?s={pixels},
 * so the page never has to decode full resolution camera files.
 */
public class LocalThumbnailWebViewClient extends BridgeWebViewClient {

    public static final String PATH_PREFIX = "/_local_thumb_/";
    private static final int DEFAULT_SIZE = 512;
    private static final int MAX_SIZE = 2048;
    private static final int SYSTEM_THUMBNAIL_MAX_SIZE = 512;

    private final ContentResolver resolver;

    public LocalThumbnailWebViewClient(Bridge bridge) {
        super(bridge);
        this.resolver = bridge.getContext().getContentResolver();
    }

    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        Uri url = request.getUrl();
        String path = url.getPath();
        if (path != null && path.startsWith(PATH_PREFIX)) {
            return thumbnailResponse(url);
        }
        return super.shouldInterceptRequest(view, request);
    }

    private WebResourceResponse thumbnailResponse(Uri url) {
        try {
            long mediaId = Long.parseLong(url.getLastPathSegment());
            int size = DEFAULT_SIZE;
            String sizeParam = url.getQueryParameter("s");
            if (sizeParam != null) {
                size = Math.max(64, Math.min(MAX_SIZE, Integer.parseInt(sizeParam)));
            }

            Uri mediaUri = ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, mediaId);
            Bitmap bitmap = loadBitmap(mediaUri, size);
            if (bitmap == null) return notFound();

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.JPEG, 85, out);
            bitmap.recycle();

            Map<String, String> headers = new HashMap<>();
            headers.put("Cache-Control", "max-age=86400");
            return new WebResourceResponse("image/jpeg", null, 200, "OK", headers, new ByteArrayInputStream(out.toByteArray()));
        } catch (Exception e) {
            return notFound();
        }
    }

    private Bitmap loadBitmap(Uri mediaUri, int size) throws Exception {
        // The system thumbnail cache is fast but can hand back a tiny image whatever size is
        // requested, so it is only trusted for grid-sized thumbnails that really are big enough.
        if (size <= SYSTEM_THUMBNAIL_MAX_SIZE && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                Bitmap cached = resolver.loadThumbnail(mediaUri, new Size(size, size), null);
                if (cached != null && Math.max(cached.getWidth(), cached.getHeight()) >= size / 2) {
                    return cached;
                }
            } catch (Exception ignored) {
                // fall through and decode the file itself
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            // Decodes the original file downscaled, and applies the EXIF rotation
            return ImageDecoder.decodeBitmap(
                ImageDecoder.createSource(resolver, mediaUri),
                (decoder, info, source) -> {
                    int width = info.getSize().getWidth();
                    int height = info.getSize().getHeight();
                    float scale = Math.min(1f, (float) size / Math.max(width, height));
                    decoder.setTargetSize(Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale)));
                    decoder.setAllocator(ImageDecoder.ALLOCATOR_SOFTWARE);
                }
            );
        }

        BitmapFactory.Options bounds = new BitmapFactory.Options();
        bounds.inJustDecodeBounds = true;
        try (InputStream in = resolver.openInputStream(mediaUri)) {
            BitmapFactory.decodeStream(in, null, bounds);
        }
        BitmapFactory.Options options = new BitmapFactory.Options();
        options.inSampleSize = 1;
        while (Math.max(bounds.outWidth, bounds.outHeight) / (options.inSampleSize * 2) >= size) {
            options.inSampleSize *= 2;
        }
        try (InputStream in = resolver.openInputStream(mediaUri)) {
            return BitmapFactory.decodeStream(in, null, options);
        }
    }

    private WebResourceResponse notFound() {
        return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", new HashMap<>(), new ByteArrayInputStream(new byte[0]));
    }
}
