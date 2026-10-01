(function () {
  "use strict";

  const SECTION_HEADINGS = new Set([
    "BEVINDINGEN",
    "HEIMELIJKE WAARNEMING / OBSERVATIE",
    "SIGNALEN EN BIJZONDERHEDEN",
    "VERVOLG",
    "AFSLUITING",
    "INDICATIEVE LIKELIHOOD – INTERNE SIGNAALDUIDING (ONDERZOEKSPROTOTYPE)",
    "CONTROLEPUNTEN VÓÓR VASTSTELLING"
  ]);

  function valueFromContext(key) {
    const field = document.querySelector(`[data-context="${key}"]`);
    return field ? String(field.value || "").trim() : "";
  }

  function prettyMoment(raw) {
    const value = String(raw || "").trim();
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!match) return value || "Nog niet ingevuld";
    return `${match[3]}-${match[2]}-${match[1]} · ${match[4]}:${match[5]} uur`;
  }

  function cleanLine(line) {
    return String(line || "").replace(/\s+$/g, "").trim();
  }

  function sourceElement() {
    return document.getElementById("reportPreview") || document.getElementById("reportOutput");
  }

  function splitSections(text) {
    const lines = String(text || "").split(/\r?\n/).map(cleanLine);
    const sections = [{title:"INLEIDING", lines:[]}];
    let current = sections[0];

    for (const line of lines) {
      if (!line || line === "----------------------------------------") {
        if (current.lines.length && current.lines[current.lines.length - 1] !== "") current.lines.push("");
        continue;
      }
      if (/^RAPPORT VAN BEVINDINGEN/i.test(line)) continue;
      if (/^Rapport-\/zaakcode:/i.test(line)) continue;
      if (SECTION_HEADINGS.has(line)) {
        current = {title:line, lines:[]};
        sections.push(current);
        continue;
      }
      current.lines.push(line);
    }
    return sections.map(section => ({...section, lines:trimBlankLines(section.lines)})).filter(section => section.lines.length);
  }

  function trimBlankLines(lines) {
    const out = [...lines];
    while (out[0] === "") out.shift();
    while (out[out.length - 1] === "") out.pop();
    return out;
  }

  function appendTextContent(container, lines) {
    let list = null;
    const flushList = () => { list = null; };
    for (const line of lines) {
      if (!line) { flushList(); continue; }
      if (line.startsWith("- ")) {
        if (!list) {
          list = document.createElement("ul");
          container.appendChild(list);
        }
        const item = document.createElement("li");
        item.textContent = line.slice(2);
        list.appendChild(item);
      } else {
        flushList();
        const p = document.createElement("p");
        p.textContent = line;
        container.appendChild(p);
      }
    }
  }

  function makeMeta(label, content) {
    const item = document.createElement("div");
    item.className = "report-meta-item";
    const key = document.createElement("span");
    key.className = "report-meta-label";
    key.textContent = label;
    const val = document.createElement("span");
    val.className = "report-meta-value";
    val.textContent = content || "Nog niet ingevuld";
    item.append(key, val);
    return item;
  }

  function buildHeader(article) {
    const header = document.createElement("header");
    header.className = "report-doc-header";

    const wordmark = document.createElement("div");
    wordmark.className = "report-wordmark";
    const mark = document.createElement("span");
    mark.className = "report-wordmark-mark";
    mark.textContent = "E";
    const wordCopy = document.createElement("span");
    const brand = document.createElement("span");
    brand.textContent = "Gemeente Emmen";
    const sub = document.createElement("small");
    sub.textContent = "Toezicht & signalering";
    wordCopy.append(brand, sub);
    wordmark.append(mark, wordCopy);

    const status = document.createElement("span");
    status.className = "report-status-badge";
    status.textContent = "Concept · controleren";
    header.append(wordmark, status);
    article.appendChild(header);

    const titleBlock = document.createElement("div");
    titleBlock.className = "report-title-block";
    const h1 = document.createElement("h1");
    h1.textContent = "Rapport van bevindingen";
    const p = document.createElement("p");
    p.textContent = "Integrale controle · Signalencheck Mensenhandel";
    titleBlock.append(h1, p);
    article.appendChild(titleBlock);

    const meta = document.createElement("div");
    meta.className = "report-meta-grid";
    meta.append(
      makeMeta("Rapport-/zaakcode", valueFromContext("caseCode") || "Nog niet ingevuld"),
      makeMeta("Datum en tijd", prettyMoment(valueFromContext("observedAt"))),
      makeMeta("Toezichthouder", valueFromContext("observer") || "Nog niet ingevuld"),
      makeMeta("Locatie", valueFromContext("location") || "Nog niet ingevuld"),
      makeMeta("Type controle", valueFromContext("controlType") || "Nog niet ingevuld"),
      makeMeta("Aanleiding", valueFromContext("controlReason") || "Nog niet ingevuld")
    );
    article.appendChild(meta);
  }

  function appendSignature(section, lines) {
    const marker = lines.findIndex(line => /^Aldus naar waarheid opgemaakt,?$/i.test(line));
    if (marker < 0) {
      appendTextContent(section, lines);
      return;
    }
    appendTextContent(section, lines.slice(0, marker));
    const details = lines.slice(marker + 1).filter(line => line && !/handtekening|digitale vaststelling/i.test(line));
    const signature = document.createElement("div");
    signature.className = "report-signature";
    const copy = document.createElement("div");
    copy.className = "report-signature-copy";
    const heading = document.createElement("strong");
    heading.textContent = "Aldus naar waarheid opgemaakt,";
    copy.appendChild(heading);
    details.forEach(line => {
      const p = document.createElement("p");
      p.textContent = line;
      copy.appendChild(p);
    });
    const line = document.createElement("div");
    line.className = "report-signature-line";
    signature.append(copy, line);
    section.appendChild(signature);
  }

  function sectionClass(title) {
    if (title.startsWith("INDICATIEVE LIKELIHOOD")) return " report-likelihood-section";
    if (title.startsWith("CONTROLEPUNTEN")) return " report-review-section";
    if (title === "INLEIDING") return " report-intro";
    return "";
  }

  function displayTitle(title) {
    if (title === "INLEIDING") return "";
    if (title.startsWith("INDICATIEVE LIKELIHOOD")) return "Interne signaalduiding — onderzoeksprototype";
    if (title === "HEIMELIJKE WAARNEMING / OBSERVATIE") return "Gerichte waarneming / observatie";
    return title.charAt(0) + title.slice(1).toLowerCase();
  }

  function appendSections(article, sections) {
    for (const data of sections) {
      const section = document.createElement("section");
      section.className = "report-section" + sectionClass(data.title);
      if (data.title !== "INLEIDING") {
        const h2 = document.createElement("h2");
        h2.textContent = displayTitle(data.title);
        section.appendChild(h2);
      }
      if (data.title === "AFSLUITING") appendSignature(section, data.lines);
      else appendTextContent(section, data.lines);
      if (data.title.startsWith("INDICATIEVE LIKELIHOOD")) {
        const note = document.createElement("p");
        note.className = "report-prototype-note";
        note.textContent = "Dit blok is uitsluitend een interne prototype-uitkomst. Het maakt geen deel uit van de feitelijke waarneming en is geen juridische kwalificatie.";
        section.appendChild(note);
      }
      article.appendChild(section);
    }
  }

  function appendAttachments(article) {
    const panel = document.createElement("section");
    panel.className = "report-attachments";
    const h2 = document.createElement("h2");
    h2.textContent = "Bijlagenoverzicht";
    panel.appendChild(h2);

    const count = Number.parseInt(valueFromContext("photoCount") || "0", 10) || 0;
    const names = valueFromContext("photoNames").split(",").map(name => name.trim()).filter(Boolean);
    if (!count) {
      const empty = document.createElement("p");
      empty.className = "report-no-attachments";
      empty.textContent = "Geen fotobijlagen aan deze sessie gekoppeld.";
      panel.appendChild(empty);
    } else {
      const list = document.createElement("ol");
      for (let i = 0; i < count; i += 1) {
        const item = document.createElement("li");
        item.textContent = `Foto ${i + 1}${names[i] ? " — " + names[i] : ""}`;
        list.appendChild(item);
      }
      panel.appendChild(list);
    }
    article.appendChild(panel);
  }

  function appendPrintFooter(article) {
    const footer = document.createElement("div");
    footer.className = "report-print-footer";
    const left = document.createElement("span");
    const code = valueFromContext("caseCode");
    left.textContent = "Gemeente Emmen · Rapport van bevindingen" + (code ? " · " + code : "");
    const right = document.createElement("span");
    right.className = "page-number";
    footer.append(left, right);
    article.appendChild(footer);
  }

  function renderFormattedReport() {
    const source = sourceElement();
    const reportCard = document.querySelector("#reportView .report-card");
    if (!source || !reportCard) return;

    source.classList.add("report-source-text");
    let article = document.getElementById("formattedReport");
    if (!article) {
      article = document.createElement("article");
      article.id = "formattedReport";
      article.className = "formatted-report";
      reportCard.appendChild(article);
    }
    article.replaceChildren();

    const text = source.textContent || "";
    buildHeader(article);
    if (!text.trim()) {
      const empty = document.createElement("section");
      empty.className = "report-section report-intro";
      const p = document.createElement("p");
      p.textContent = "Nog geen rapport gegenereerd. Open de signalencheck, vul de controle in en kies vervolgens Rapportage.";
      empty.appendChild(p);
      article.appendChild(empty);
    } else {
      appendSections(article, splitSections(text));
      appendAttachments(article);
    }
    appendPrintFooter(article);
  }

  function polishReportUi() {
    const title = document.getElementById("reportTitle");
    if (title) title.textContent = "Rapport van bevindingen";
    const intro = document.querySelector("#reportView .report-view-header p");
    if (intro) intro.textContent = "Controleer de feitelijke inhoud en ontbrekende velden vóór vaststelling of opname in een dossier.";
    const toolbarTitle = document.querySelector("#reportView .report-toolbar strong");
    if (toolbarTitle) toolbarTitle.textContent = "Concept rapport van bevindingen";
    const toolbarHint = document.querySelector("#reportView .report-toolbar span");
    if (toolbarHint) toolbarHint.textContent = "A4-weergave · geschikt voor printen of opslaan als PDF";
    const print = document.getElementById("printBtn") || document.getElementById("printReportBtn");
    if (print) print.textContent = "Print / PDF";
  }

  function install() {
    polishReportUi();
    renderFormattedReport();
    const source = sourceElement();
    if (source) {
      new MutationObserver(renderFormattedReport).observe(source, {childList:true, characterData:true, subtree:true});
    }
    const photos = document.getElementById("observationPhotoGrid");
    if (photos) new MutationObserver(renderFormattedReport).observe(photos, {childList:true, subtree:true});
    document.addEventListener("input", event => {
      if (event.target?.matches?.("[data-context]")) window.requestAnimationFrame(renderFormattedReport);
    });
    document.addEventListener("change", event => {
      if (event.target?.matches?.("[data-context]")) window.requestAnimationFrame(renderFormattedReport);
    });
    for (const id of ["checkReportBtn","buildReportBtn","buildFromCheckBtn"]) {
      document.getElementById(id)?.addEventListener("click", () => window.setTimeout(renderFormattedReport, 0));
    }
  }

  document.addEventListener("DOMContentLoaded", install);
})();
