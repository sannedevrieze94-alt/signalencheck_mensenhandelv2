"use strict";
const fs = require("node:fs");
const path = require("node:path");
const assert = (value, message) => { if (!value) throw new Error(message); };

const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
const script = fs.readFileSync(path.join(__dirname, "../script.js"), "utf8");
const categories = fs.readFileSync(path.join(__dirname, "../categories-v41.js"), "utf8");
const signals = fs.readFileSync(path.join(__dirname, "../signals.js"), "utf8");
const theme = fs.readFileSync(path.join(__dirname, "../emmen-theme-v37.css"), "utf8");
const categoryTheme = fs.readFileSync(path.join(__dirname, "../categories-v41.css"), "utf8");
const reportLayout = fs.readFileSync(path.join(__dirname, "../report-layout-v46.js"), "utf8");
const manifest = fs.readFileSync(path.join(__dirname, "../manifest.webmanifest"), "utf8");

assert(html.includes('id="homeView"') && html.includes('id="checkView"'), "Home of checkview ontbreekt");
assert(html.includes('id="openCheckBtn"') && html.includes('id="openCovertBtn"') && html.includes('id="openOverviewBtn"') && html.includes('id="openSettingsBtn"'), "Vier homepage-tegels ontbreken");
assert(html.includes('id="likelihoodCards"') && html.includes("Likelihood-indicatie"), "Likelihoodweergave ontbreekt");
assert(html.includes('id="observationsMount"') && !html.includes('id="includeArbeid"') && !html.includes('id="includeSeksueel"') && !html.includes('id="includeCrimineel"'), "Oude driedeling is nog aanwezig");
assert(!signals.includes("general-1") && !signals.includes('id: "general"'), "Algemene signalen zijn niet verwijderd");
assert(signals.includes('id: "environment"') && signals.includes("env-multiple-reports"), "Omgevingssignalen ontbreken");
assert(html.includes('src="./categories-v41.js"'), "Categoriseringslaag wordt niet geladen");
for (const title of ["Controle & afhankelijkheid","Dwang, kwetsbaarheid & misleiding","Arbeid & arbeidsvoorwaarden","Sekswerk, inkomsten & seksuele uitbuiting","Criminele inzet & jonge aanwas"]) {
  assert(categories.includes(title), "Categorie ontbreekt: " + title);
}
for (const tab of ["Controle","Dwang","Arbeid","Sekswerk","Criminele inzet","Omgeving"]) {
  assert(categories.includes(`tab: "${tab}"`) || categories.includes(`tab:"${tab}"`), "Tab ontbreekt: " + tab);
}
assert(categories.includes('role", "tablist') && categories.includes('role", "tab') && categories.includes('role", "tabpanel'), "Toegankelijke tabstructuur ontbreekt");
assert(categories.includes("ArrowRight") && categories.includes("ArrowLeft"), "Toetsenbordnavigatie voor tabs ontbreekt");
assert(categories.includes("moveLikelihoodToBottom") && categories.includes('textContent = "03"'), "Likelihood wordt niet als laatste stap gepositioneerd");
assert(categoryTheme.includes(".observation-tabs") && categoryTheme.includes(".observation-tab") && categoryTheme.includes(".likelihood-panel"), "Tab- of resultaatstyling ontbreekt");
assert(categoryTheme.includes("aspect-ratio:1/1") && categoryTheme.includes(".home-tile.tile-control") && categoryTheme.includes("linear-gradient(145deg,var(--emmen-red)") && categoryTheme.includes("#272d35"), "Contrastrijke rode/antraciete apptegels ontbreken");
assert(html.includes('id="covertThirdPartyControl"') && html.includes('id="covertExchange"') && html.includes('id="covertArrivals"'), "Heimelijke waarneming is niet geactualiseerd");
assert(html.includes('id="themeSetting"') && html.includes('id="pushSetting"') && html.includes('id="inAppSetting"'), "Instellingen ontbreken");
assert(html.includes('id="overviewView"') && html.includes('id="historyMount"'), "Overzicht met checks ontbreekt");
assert(script.includes("HISTORY_KEY") && script.includes("SETTINGS_KEY") && script.includes("completeCheck"), "Lokale historie/instellingen ontbreken");
assert(script.includes("Notification.requestPermission") && script.includes("showNotification"), "Browsermeldinglogica ontbreekt");
assert(theme.includes('html[data-theme="dark"]') && theme.includes(".likelihood-grid") && theme.includes(".yes-no-choice"), "Donker thema of nieuwe checkvisualisatie ontbreekt");
assert(theme.includes('html[data-theme="dark"] .report-toolbar') && theme.includes("color:var(--emmen-ink)!important"), "Lichte tekstcorrectie voor donker thema ontbreekt");
assert(theme.includes('html[data-theme="dark"] button:not(.home-tile)') && theme.includes('html[data-theme="dark"] .yes-no-choice button.yes.selected') && theme.includes('html[data-theme="dark"] .observation-tab.active'), "Donker thema dekt niet alle knopvarianten");
assert(html.includes("Emmen-gemeente-logo.png"), "Gemeente Emmen-logo ontbreekt in appkop");
assert(reportLayout.includes("report-municipality-logo") && reportLayout.includes("Emmen-gemeente-logo.png"), "Echt Gemeente Emmen-logo ontbreekt in rapportlayout");
assert(manifest.includes('"theme_color": "#e30613"'), "PWA-themakleur wijkt af");
assert(html.includes("geen gevalideerde kansberekening"), "Methodische waarschuwing ontbreekt");

console.log("UI-regressies geslaagd: tabs, vierkante apptegels, likelihood onderaan, checklist, overzicht en instellingen aanwezig.");