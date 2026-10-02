package com.matematica.pizarra;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Los plugins propios se registran antes de crear el puente con la interfaz.
        registerPlugin(KeepAwakePlugin.class);
        super.onCreate(savedInstanceState);

        // Botón «atrás»: lo decide la interfaz (cierra la wiki, un diálogo o el menú abierto); si no
        // hay nada abierto, vuelve a la pantalla anterior y, en la primera, deja la app en segundo
        // plano en lugar de cerrarla.
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = getBridge() != null ? getBridge().getWebView() : null;
                if (webView == null) {
                    moveTaskToBack(true);
                    return;
                }
                webView.evaluateJavascript("window.androidBack ? window.androidBack() === true : false", (handled) -> {
                    if ("true".equals(handled)) return;
                    if (webView.canGoBack()) webView.goBack();
                    else moveTaskToBack(true);
                });
            }
        });
    }
}
