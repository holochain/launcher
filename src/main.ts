import "@webcomponents/scoped-custom-element-registry";
import "array-flat-polyfill";
import "blob-polyfill";
import { createApp } from "vue";
import "@material/mwc-textfield";
import "@material/mwc-textarea";
import "@material/mwc-fab";
import "@material/mwc-snackbar";
import "@material/mwc-button";
import "@material/mwc-dialog";

import { invoke } from "@tauri-apps/api/tauri";

import App from "./App.vue";
import { store } from "./store";
import { i18n } from "./locale";

window.onerror = function (message, source, lineno, colno, error) {
  invoke("log", {
    log: `UI error: message: ${message}. source: ${source}. lineno: ${lineno}. colno: ${colno}. error: ${JSON.stringify(
      error
    )}`,
  });
};

function adjustZoomLevel(amount: number, increase: boolean) {
  const percentageString: string = (
    document.body.style as CSSStyleDeclaration & { zoom: string }
  ).zoom;
  const num =
    percentageString === ""
      ? 100
      : parseInt(percentageString.slice(0, percentageString.length - 1));

  let newVal = increase ? num + Math.round(amount) : num - Math.round(amount);

  if (increase) {
    newVal = newVal < 500 ? newVal : 500;
  } else {
    newVal = newVal > 30 ? newVal : 30;
  }

  (
    document.body.style as CSSStyleDeclaration & { zoom: string }
  ).zoom = `${newVal}%`;
}

function increaseZoomLevel(amount: number) {
  adjustZoomLevel(amount, true);
}

function decreaseZoomLevel(amount: number) {
  adjustZoomLevel(amount, false);
}

window.onkeydown = (ev) => {
  if (ev.key === "Control") {
    window.onwheel = (ev) => {
      if (ev.deltaY > 0) {
        // scrolling DOWN
        decreaseZoomLevel(10);
      } else if (ev.deltaY < 0) {
        // scrolling UP
        increaseZoomLevel(10);
        // (document.body.style as any).zoom = "120%";
      }
    };
  }
};

window.onkeyup = (ev) => {
  if (ev.key === "Control") {
    window.onwheel = null;
  }
};

type Locale = "en" | "de";

const customLocale = window.localStorage.getItem("customLocale");

// console.log("Fetched customLocale: ", customLocale);

if (customLocale) {
  if (i18n.global.availableLocales.includes(customLocale as Locale)) {
    i18n.global.locale = customLocale as Locale;
  } else {
    console.warn(
      `Invalid custom locale found in localStorage: ${customLocale}. Available locales: ${i18n.global.availableLocales}`
    );
  }
} else {
  // default to the webview's locale which should correspond to the OS locale
  const defaultLocale = navigator.language;
  if (i18n.global.availableLocales.includes(defaultLocale as Locale)) {
    i18n.global.locale = defaultLocale as Locale;
  }
}

const app = createApp(App);

app.use(store);
app.use(i18n);

app.mount("#app");
