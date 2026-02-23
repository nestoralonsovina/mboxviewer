import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { provideTranslateService, TranslateService } from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";
import { routes } from "./app.routes";
import { MboxStateService } from "./state/mbox-state.service";

function getPreferredLanguage(): string {
  const saved = localStorage.getItem("preferredLanguage");
  if (saved && ["en", "es"].includes(saved)) {
    return saved;
  }
  const browserLang = navigator.language.split("-")[0];
  return ["en", "es"].includes(browserLang) ? browserLang : "en";
}

function isPreferencesWindow(): boolean {
  return window.location.pathname === "/preferences";
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideTranslateService({
      defaultLanguage: "en",
    }),
    provideTranslateHttpLoader({
      prefix: "./assets/i18n/",
      suffix: ".json",
    }),
    provideAppInitializer(() => {
      const translate = inject(TranslateService);
      translate.use(getPreferredLanguage());
    }),
    provideAppInitializer(() => {
      // Skip heavy initialization for preferences window
      if (isPreferencesWindow()) {
        return;
      }
      return inject(MboxStateService).initialize();
    }),
  ],
};
