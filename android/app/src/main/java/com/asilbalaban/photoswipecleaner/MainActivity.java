package com.asilbalaban.photoswipecleaner;

import android.os.Bundle;
import android.view.View;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LocalGalleryPlugin.class);
        super.onCreate(savedInstanceState);
        bridge.setWebViewClient(new LocalThumbnailWebViewClient(bridge));
        keepContentInsideSystemBars();
    }

    /**
     * Recent Android versions always draw the app edge to edge, so the page is padded by the
     * status bar, navigation bar, cutout and keyboard to keep it from sliding under them.
     */
    private void keepContentInsideSystemBars() {
        View content = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(content, (view, windowInsets) -> {
            Insets bars = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout() | WindowInsetsCompat.Type.ime()
            );
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return WindowInsetsCompat.CONSUMED;
        });
    }
}
