const DATA_SOURCE = {
  type: "csv",
  url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS2-u5TBkmpx-ElKzPGORkp62qryGjvtG5wPGibZ7SUtjzNEHU7pTUjzPa2emWz04XEKVkiwR44kis0/pub?gid=796292095&single=true&output=csv",
  sheetName: "Resources_Web",
};
const READY_STATUS = "Ready for public";

const state = {
  resources: [],
  filtered: [],
};

const controls = {
  residency: document.getElementById("residencyFilter"),
  audience: document.getElementById("audienceFilter"),
  lookingFor: document.getElementById("lookingForFilter"),
  need: document.getElementById("needFilter"),
  keyword: document.getElementById("keywordFilter"),
  includeVerify: document.getElementById("includeVerifyFilter"),
  reset: document.getElementById("resetFilters"),
  count: document.getElementById("resultCount"),
  status: document.getElementById("workbookStatus"),
  body: document.getElementById("resultsBody"),
};

function splitValues(value) {
  return String(value || "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueOptions(field) {
  const values = new Set();
  state.resources.forEach((resource) => {
    splitValues(resource[field]).forEach((value) => values.add(value));
  });
  return [...values].sort((a, b) => a.localeCompare(b));
}

function fillSelect(select, values) {
  const first = select.querySelector("option");
  select.replaceChildren(first);
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.append(option);
  });
}

function includesSemicolonValue(resource, field, selected) {
  if (!selected) return true;
  return splitValues(resource[field]).includes(selected);
}

function isStatewideOrOpen(resource) {
  const text = [
    resource.Geography,
    resource.Summary,
    resource.Eligibility,
    resource.Source_Note,
  ].join(" ").toLowerCase();
  return [
    "indiana statewide",
    "eligible rural areas in indiana",
    "national, including indiana",
    "indiana and michigan",
  ].some((term) => text.includes(term));
}

function matchesResidency(resource, selected) {
  if (!selected || selected === "marshall") return true;
  if (selected === "nonresident") return isStatewideOrOpen(resource);
  if (selected === "developer") {
    return ["Developer/nonprofit", "Landlord/property manager", "CDC/staff referral"].some((value) =>
      splitValues(resource.Audience).includes(value)
    );
  }
  return true;
}

function matchesKeyword(resource, keyword) {
  if (!keyword) return true;
  const text = [
    resource.Organization,
    resource.Program,
    resource.Resource_Type,
    resource.Audience,
    resource.Looking_For,
    resource.Need_Tags,
    resource.Summary,
    resource.Eligibility,
    resource.Documents,
    resource.Geography,
    resource.Contact,
  ]
    .join(" ")
    .toLowerCase();
  return keyword
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => text.includes(term));
}

function filterResources() {
  const filters = {
    residency: controls.residency.value,
    audience: controls.audience.value,
    lookingFor: controls.lookingFor.value,
    need: controls.need.value,
    keyword: controls.keyword.value.trim(),
    includeVerify: controls.includeVerify.checked,
  };

  state.filtered = state.resources
    .filter((resource) => filters.includeVerify || resource.Public_Status === READY_STATUS)
    .filter((resource) => matchesResidency(resource, filters.residency))
    .filter((resource) => includesSemicolonValue(resource, "Audience", filters.audience))
    .filter((resource) => includesSemicolonValue(resource, "Looking_For", filters.lookingFor))
    .filter((resource) => includesSemicolonValue(resource, "Need_Tags", filters.need))
    .filter((resource) => matchesKeyword(resource, filters.keyword))
    .sort((a, b) => Number(a.Sort_Priority || 99) - Number(b.Sort_Priority || 99));
}

function text(value, fallback = "") {
  const clean = String(value || "").trim();
  return clean || fallback;
}

function createPills(values, extraClass = "") {
  const wrapper = document.createElement("div");
  wrapper.className = "pill-row";
  values.slice(0, 5).forEach((value) => {
    const pill = document.createElement("span");
    pill.className = `pill ${extraClass}`.trim();
    pill.textContent = value;
    wrapper.append(pill);
  });
  return wrapper;
}

function linkButton(label, url) {
  if (!url) return null;
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.textContent = label;
  return anchor;
}

function renderResults() {
  controls.count.textContent = `${state.filtered.length} ${state.filtered.length === 1 ? "resource" : "resources"}`;
  controls.body.replaceChildren();

  if (!state.filtered.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "empty";
    cell.textContent = "No matching resources found.";
    row.append(cell);
    controls.body.append(row);
    return;
  }

  state.filtered.forEach((resource) => {
    const row = document.createElement("tr");

    const titleCell = document.createElement("td");
    const title = document.createElement("div");
    title.className = "resource-title";
    const strong = document.createElement("strong");
    strong.textContent = resource.Organization;
    const program = document.createElement("span");
    program.textContent = resource.Program;
    const geo = document.createElement("span");
    geo.className = "meta";
    geo.textContent = text(resource.Geography);
    title.append(strong, program, geo);
    if (resource.Public_Status !== READY_STATUS) {
      title.append(createPills([resource.Public_Status], "verify"));
    }
    const summary = document.createElement("div");
    summary.className = "summary";
    summary.textContent = text(resource.Summary);
    title.append(summary);
    titleCell.append(title);

    const bestForCell = document.createElement("td");
    bestForCell.append(createPills(splitValues(resource.Need_Tags)));

    const eligibilityCell = document.createElement("td");
    eligibilityCell.textContent = text(resource.Eligibility, "Eligibility details not listed.");

    const contactCell = document.createElement("td");
    const contactLines = [
      resource.Contact,
      resource.Phone,
      resource.Email,
      resource.Address,
    ]
      .map((value) => text(value))
      .filter(Boolean);
    contactCell.innerHTML = contactLines.length
      ? contactLines.map((line) => escapeHtml(line)).join("<br>")
      : "Contact details not listed.";

    const linksCell = document.createElement("td");
    const links = document.createElement("div");
    links.className = "links";
    [
      linkButton("Apply", resource.Apply_URL),
      linkButton("Resource page", resource.Direct_URL),
      linkButton("Website", resource.Website),
    ]
      .filter(Boolean)
      .forEach((link) => links.append(link));
    if (!links.childElementCount) links.textContent = "No link listed.";
    linksCell.append(links);

    row.append(titleCell, bestForCell, eligibilityCell, contactCell, linksCell);
    controls.body.append(row);
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

function update() {
  filterResources();
  renderResults();
}

function resetFilters() {
  controls.residency.value = "";
  controls.audience.value = "";
  controls.lookingFor.value = "";
  controls.need.value = "";
  controls.keyword.value = "";
  controls.includeVerify.checked = false;
  update();
}

function bindControls() {
  [
    controls.residency,
    controls.audience,
    controls.lookingFor,
    controls.need,
    controls.includeVerify,
  ].forEach((control) => control.addEventListener("change", update));
  controls.keyword.addEventListener("input", update);
  controls.reset.addEventListener("click", resetFilters);
}

function inferSourceType(url) {
  if (url.toLowerCase().includes("output=csv") || url.toLowerCase().endsWith(".csv")) return "csv";
  return "xlsx";
}

function getDataSource() {
  const params = new URLSearchParams(window.location.search);
  const url = params.get("data");
  if (!url) return DATA_SOURCE;
  return {
    ...DATA_SOURCE,
    type: params.get("type") || inferSourceType(url),
    url,
  };
}

async function readRowsFromSource(source) {
  const response = await fetch(source.url);
  if (!response.ok) throw new Error(`Data request failed: ${response.status}`);

  if (source.type === "csv") {
    const csv = await response.text();
    const workbook = XLSX.read(csv, { type: "string" });
    const firstSheet = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: "" });
  }

  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[source.sheetName];
  if (!sheet) throw new Error(`${source.sheetName} sheet was not found.`);
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

async function loadWorkbook() {
  try {
    const source = getDataSource();
    state.resources = await readRowsFromSource(source);
    fillSelect(controls.audience, uniqueOptions("Audience"));
    fillSelect(controls.lookingFor, uniqueOptions("Looking_For"));
    fillSelect(controls.need, uniqueOptions("Need_Tags"));
    controls.status.textContent = `Loaded from ${source.type.toUpperCase()} source`;
    bindControls();
    update();
  } catch (error) {
    controls.status.textContent = "Workbook could not be loaded.";
    controls.body.innerHTML = `<tr><td colspan="5" class="empty">${escapeHtml(error.message)}</td></tr>`;
  }
}

loadWorkbook();
