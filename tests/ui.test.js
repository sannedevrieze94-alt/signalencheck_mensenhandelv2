"use strict";
const fs = require("node:fs");
const path = require("node:path");
const assert = (value, message) => { if (!value) throw new Error(message); };

const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
const script = fs.readFileSync(path.join(__dirname, "../script.js"), "utf8");
const signals = fs.readFileSync(path.join(__dirname, "../signals.js"), "utf8");
const theme = fs.readFileSync(path.join(__dirname, "../emmen-theme-v37.css"), "utf8");
const manifest = fs.readFileSync(path.join(__dirname, "../manifest.webmanifest"), "utf8");

assert(html.includes('id="homeView"') && html.includes('id="checkView"'), "Home of checkview ontbreekt");
assert(html.includes('id="openCheckBtn"') && html.includes('id="openCovertBtn"') && html.includes('id="openOverviewBtn"') && html.includes('id="openSettingsBtn"'), "Vier homepage-tegels ontbreken");
assert(html.includes('id="likelihoodCards"') && html.includes("Likelihood-indicatie"), "Likelihoodweergave ontbreekt");
assert(html.includes('id="observationsMount"') && !html.includes('id="includeArbeid"') && !html.includes('id="includeSeksueel"') && !html.includes('id="includeCrimineel"'), "Oude driedeling is nog aanwezig");
assert(!signals.includes("general-1") && !signals.includes('id: "general"'), "Algemene signalen zijn niet verwijderd");
assert(signals.includes('id: "environment"') && signals.includes("env-multiple-reports"), "Omgevingssignalen ontbreken");
assert(html.includes('id="covertThirdPartyControl"') && html.includes('id="covertExchange"') && html.includes('id="covertArrivals"'), "Heimelijke waarneming is niet geactualiseerd");
assert(html.includes('id="themeSetting"') && html.includes('id="pushSetting"') && html.includes('id="inAppSetting"'), "Instellingen ontbreken");
assert(html.includes('id="overviewView"') && html.includes('id="historyMount"'), "Overzicht met checks ontbreekt");
assert(script.includes("HISTORY_KEY") && script.includes("SETTINGS_KEY") && script.includes("completeCheck"), "Lokale historie/instellingen ontbreken");
assert(script.includes("Notification.requestPermission") && script.includes("showNotification"), "Browsermeldinglogica ontbreekt");
assert(theme.includes('html[data-theme="dark"]') && theme.includes(".likelihood-grid") && theme.includes(".yes-no-choice"), "Donker thema of nieuwe checkvisualisatie ontbreekt");
assert(html.includes("Emmen-gemeente-logo.png"), "Gemeente Emmen-logo ontbreekt");
assert(manifest.includes('"theme_color": "#e30613"'), "PWA-themakleur wijkt af");
assert(html.includes("geen gevalideerde kansberekening"), "Methodische waarschuwing ontbreekt");

console.log("UI-regressies geslaagd: één checklist, likelihoods, heimelijke waarneming, overzicht, instellingen en licht/donker thema aanwezig.");
