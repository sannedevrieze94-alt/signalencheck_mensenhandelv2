"use strict";
const fs = require("node:fs");
const path = require("node:path");
const assert = (value, message) => { if (!value) throw new Error(message); };

const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
const script = fs.readFileSync(path.join(__dirname, "../script.js"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "../app-shell-v36.css"), "utf8");

assert(html.includes('id="homeView"'), "Homepage ontbreekt");
assert(html.includes('id="openIntegralBtn"') && html.includes('id="openCovertBtn"') && html.includes('id="openReportBtn"'), "Homepage-tegels ontbreken");
assert(html.includes('id="includeGeneral"') && html.includes('id="includeArbeid"') && html.includes('id="includeSeksueel"') && html.includes('id="includeCrimineel"'), "Moduleselectie ontbreekt");
assert(html.includes('id="covertCard"') && html.includes('id="covertPlateNumbers"') && html.includes('id="covertPersonCharacteristics"'), "Heimelijke waarneming onvolledig");
assert(html.includes('id="reportView"') && html.includes("Rapport van bevindingen"), "Rapportageview ontbreekt");
assert(html.includes("Onderzoeksprototype") && html.includes("Uitsluitend voor fictieve oefencasuïstiek"), "Prototypewaarschuwing bovenin ontbreekt");
assert(!html.includes("Fictieve oefencode") && !html.includes("Fictieve locatie") && !html.includes("Fictieve beoordelaarscode"), "Fictief wordt nog onnodig in veldlabels herhaald");
assert(script.includes("selectedFormIds()") && script.includes("configureWorkflow") && script.includes("startIntegral"), "Selectielogica ontbreekt");
assert(script.includes('showView("homeView"') && script.includes('showView("workflowView"') && script.includes('showView("reportView"'), "App-router ontbreekt");
assert(script.includes("Alleen ‘Waargenomen’ komt later in de rapportage"), "UI maakt rapportagefilter niet duidelijk");
assert(css.includes(".home-tiles") && css.includes(".home-tile") && css.includes(".app-mobile-nav"), "Appvormgeving voor homepage ontbreekt");
assert(css.includes(".report-paper"), "Rapportage-styling ontbreekt");

console.log("UI-regressies geslaagd: homepage, tegels, moduleselectie, heimelijke waarneming, rapportageview en app-shell aanwezig.");