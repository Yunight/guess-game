import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { fr } from "./locales/fr";
import { en } from "./locales/en";

i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources: {
			fr: {
				translation: fr,
			},
			en: {
				translation: en,
			},
		},
		fallbackLng: "fr",
		lng: "fr",
		debug: process.env.NODE_ENV === "development",
		interpolation: {
			escapeValue: false,
		},
		detection: {
			order: ["localStorage", "navigator"],
			lookupLocalStorage: "i18nextLng",
			caches: ["localStorage"],
		},
	});

if (!localStorage.getItem("i18nextLng")) {
	localStorage.setItem("i18nextLng", "fr");
}

export default i18n;
