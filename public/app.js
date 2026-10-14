(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const STORAGE_KEY = "resumecraft-v1";
  const form = $("#resumeForm");
  const toast = $("#toast");
  let zoom = 100;
  let toastTimer;
  let photoData = "";
  let photoLoadId = 0;

  const DEFAULT_SECTION_NAMES = {
    personalDetails: "Personal details",
    summary: "Professional summary",
    profile: "Profile",
    education: "Education",
    experience: "Experience",
    skills: "Skills",
    technicalSkills: "Technical skills",
    softSkills: "Soft skills",
    hobbies: "Hobbies",
    hobbiesField: "Hobbies / interests",
    projects: "Projects",
    certifications: "Certifications",
    customSections: "Custom sections",
    design: "Customize design"
  };

  const sample = {
    fullName: "Awdhesh Kumar",
    jobTitle: "Civil Engineering Student",
    email: "awdhesh@example.com",
    phone: "+91 98765 43210",
    location: "Sonbhadra, Uttar Pradesh, India",
    website: "",
    summary: "Motivated civil engineering student with a strong interest in building planning, AutoCAD drafting, and modern construction technology. Eager to apply technical knowledge, learn from experienced professionals, and contribute to practical engineering projects.",
    technicalSkills: "AutoCAD, Building Planning, Technical Drawing, MS Excel",
    softSkills: "Teamwork, Problem Solving, Communication",
    hobbies: "Reading, Travel, Photography",
    education: [{ degree: "Diploma / B.Tech in Civil Engineering", school: "Your College Name", date: "2024 – Present", details: "Relevant coursework: Building Materials, Engineering Drawing, Surveying." }],
    experience: [{ role: "Student Trainee", company: "Academic / Personal Projects", date: "2025 – Present", details: "Practiced technical drafting and explored digital tools for civil engineering planning." }],
    projects: [{ name: "Civil-3D-Planner", date: "Personal Project", details: "Developing a web-based concept to turn 2D building layouts into interactive 3D views." }],
    certifications: [],
    customSections: [],
    sectionNames: { ...DEFAULT_SECTION_NAMES },
    template: "modern",
    accent: "#5865e8"
  };

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[ch]);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function createField(label, key, value, options = {}) {
    const type = options.type || "text";
    const tag = options.multiline ? "textarea" : "input";
    const inputAttrs = tag === "input" ? `type="${type}"` : `rows="${options.rows || 2}"`;
    const placeholder = options.placeholder || label;
    const safeValue = escapeHTML(value || "");
    return `<label class="field ${options.full ? "full" : ""}"><span>${escapeHTML(label)}</span><${tag} ${inputAttrs} data-key="${key}" placeholder="${escapeHTML(placeholder)}">${tag === "textarea" ? safeValue : ""}</${tag}>${tag === "input" ? "" : ""}</label>`;
  }

  function renderRepeatList(type, items) {
    const target = $(`#${type}List`);
    const labels = { education: "Education", experience: "Experience", project: "Project", certification: "Certification" };
    target.innerHTML = items.map((item, index) => {
      let fields = "";
      if (type === "education") {
        fields = createField("Degree / qualification", "degree", item.degree) +
          createField("School / institution", "school", item.school) +
          createField("Dates", "date", item.date) +
          createField("Details", "details", item.details, { full: true, multiline: true });
      } else if (type === "experience") {
        fields = createField("Job title", "role", item.role) +
          createField("Company", "company", item.company) +
          createField("Dates", "date", item.date) +
          createField("What you did", "details", item.details, { full: true, multiline: true });
      } else if (type === "certification") {
        fields = createField("Certification name", "name", item.name) +
          createField("Issuing organization", "issuer", item.issuer) +
          createField("Date", "date", item.date) +
          createField("Details", "details", item.details, { full: true, multiline: true });
      } else {
        fields = createField("Project name", "name", item.name) +
          createField("Date / type", "date", item.date) +
          createField("Project details", "details", item.details, { full: true, multiline: true });
      }
      return `<div class="repeat-card" data-type="${type}" data-index="${index}">
        <div class="repeat-card-head"><strong>${labels[type]} ${index + 1}</strong><button type="button" class="remove-item" aria-label="Remove ${labels[type].toLowerCase()}" data-remove="${type}" data-index="${index}">×</button></div>
        <div class="repeat-fields">${fields}</div>
      </div>`;
    }).join("");
  }

  function readCustomSections() {
    return $$("#customSectionList .custom-section-card").map(card => ({
      title: $("[data-custom-title]", card).value.trim(),
      content: $("[data-custom-content]", card).value.trim()
    }));
  }

  function renderCustomSections(sections) {
    $("#customSectionList").innerHTML = sections.map((section, index) => `
      <div class="repeat-card custom-section-card" data-custom-index="${index}">
        <div class="repeat-card-head">
          <strong>Custom section ${index + 1}</strong>
          <button type="button" class="remove-item" aria-label="Remove custom section" data-custom-remove="${index}">×</button>
        </div>
        <div class="repeat-fields custom-section-fields">
          <label class="field full"><span>Section title</span><input type="text" data-custom-title placeholder="e.g. Awards" value="${escapeHTML(section.title || "")}"></label>
          <label class="field full"><span>Section details</span><textarea rows="3" data-custom-content placeholder="Add details for this section">${escapeHTML(section.content || "")}</textarea></label>
        </div>
      </div>
    `).join("");
  }

  function getFormValue(name) {
    return form.elements.namedItem(name)?.value?.trim() || "";
  }

  function readRepeat(type) {
    return $$(`#${type}List .repeat-card`).map(card => {
      const item = {};
      $$("[data-key]", card).forEach(field => item[field.dataset.key] = field.value.trim());
      return item;
    });
  }

  function parseSkills(value) {
    return String(value || "").split(",").map(skill => skill.trim()).filter(Boolean);
  }

  function renderTagGroup(groupName, values) {
    const list = $(`#${groupName}List`);
    if (!list) return;
    const uniqueValues = [...new Map(values.map(item => [item.toLowerCase(), item])).values()];
    list.innerHTML = uniqueValues.map(item => `
      <span class="tag-pill">
        <span>${escapeHTML(item)}</span>
        <button type="button" aria-label="Remove ${escapeHTML(item)}" data-tag-remove="${groupName}" data-tag-value="${escapeHTML(item)}">×</button>
      </span>
    `).join("");
  }

  function syncTagGroup(groupName) {
    const field = form.elements.namedItem(groupName);
    if (!field) return;
    const values = parseSkills(field.value);
    renderTagGroup(groupName, values);
  }

  function addTagToGroup(groupName) {
    const input = form.querySelector(`[data-tag-input="${groupName}"]`);
    if (!input) return;
    const rawValue = input.value.trim();
    if (!rawValue) return;
    const field = form.elements.namedItem(groupName);
    if (!field) return;
    const values = parseSkills(field.value);
    const newValues = rawValue.split(",").map(value => value.trim()).filter(Boolean);
    const merged = [...new Set([...values, ...newValues].map(value => value.trim()).filter(Boolean))];
    field.value = merged.join(", ");
    renderTagGroup(groupName, merged);
    input.value = "";
    refresh();
  }

  function removeTagFromGroup(groupName, value) {
    const field = form.elements.namedItem(groupName);
    if (!field) return;
    const values = parseSkills(field.value).filter(item => item.toLowerCase() !== String(value).toLowerCase());
    field.value = values.join(", ");
    renderTagGroup(groupName, values);
    refresh();
  }

  function readSectionNames() {
    const names = { ...DEFAULT_SECTION_NAMES };
    $$("[data-section-name]").forEach(input => {
      const key = input.dataset.sectionName;
      const value = input.value.trim();
      if (key && value) names[key] = value;
    });
    return names;
  }

  function getData() {
    const technicalSkills = getFormValue("technicalSkills");
    const softSkills = getFormValue("softSkills");
    const hobbies = getFormValue("hobbies");
    return {
      fullName: getFormValue("fullName"),
      jobTitle: getFormValue("jobTitle"),
      email: getFormValue("email"),
      phone: getFormValue("phone"),
      location: getFormValue("location"),
      website: getFormValue("website"),
      summary: getFormValue("summary"),
      technicalSkills,
      softSkills,
      hobbies,
      skills: [technicalSkills, softSkills].filter(Boolean).join(", "),
      education: readRepeat("education"),
      experience: readRepeat("experience"),
      projects: readRepeat("project"),
      certifications: readRepeat("certification"),
      customSections: readCustomSections(),
      sectionNames: readSectionNames(),
      template: $("#templateSelect").value,
      accent: $("#accentColor").value,
      photoData
    };
  }

  function renderEntries(items, type) {
    const fields = {
      education: ["degree", "school", "date", "details"],
      experience: ["role", "company", "date", "details"],
      project: ["name", "date", "details"],
      certification: ["name", "issuer", "date", "details"]
    }[type];
    return items.filter(item => fields.some(field => item[field]?.trim())).map(item => {
      const title = item.degree || item.role || item.name || "";
      const subtitle = item.school || item.company || item.issuer || "";
      const date = item.date || "";
      const details = item.details || "";
      return `<div class="resume-entry">
        <div class="entry-top"><strong>${escapeHTML(title)}</strong><span class="entry-date">${escapeHTML(date)}</span></div>
        ${subtitle ? `<p class="entry-subtitle">${escapeHTML(subtitle)}</p>` : ""}
        ${details ? `<p class="entry-description">${escapeHTML(details)}</p>` : ""}
      </div>`;
    }).join("");
  }

  function setSectionVisibility(id, visible) {
    $(`#${id}`).hidden = !visible;
  }

  function renderPreview(data) {
    const sectionNames = { ...DEFAULT_SECTION_NAMES, ...(data.sectionNames || {}) };
    const paper = $("#resumePaper");
    paper.className = `resume-paper template-${data.template}`;
    paper.style.setProperty("--resume-accent", data.accent);
    document.documentElement.style.setProperty("--accent", data.accent);
    $("#colorHex").textContent = data.accent.toUpperCase();
    $("#previewName").textContent = data.fullName || "Your Name";
    $("#previewTitle").textContent = data.jobTitle || "Professional Title";
    const hasPhoto = !!data.photoData;
    $("#previewPhoto").hidden = !hasPhoto;
    $("#photoEditorPreview").hidden = !hasPhoto;
    $("#removePhoto").hidden = !hasPhoto;
    if (hasPhoto) {
      $("#previewPhoto").src = data.photoData;
      $("#photoEditorPreview").src = data.photoData;
    } else {
      $("#previewPhoto").removeAttribute("src");
      $("#photoEditorPreview").removeAttribute("src");
    }
    $("#previewSummary").textContent = data.summary;
    setSectionVisibility("summarySection", !!data.summary);
    const contact = [data.email, data.phone, data.location, data.website].filter(Boolean);
    $("#previewContact").innerHTML = contact.map(item => `<span>${escapeHTML(item)}</span>`).join("");
    $("#previewEducation").innerHTML = renderEntries(data.education, "education");
    $("#previewExperience").innerHTML = renderEntries(data.experience, "experience");
    $("#previewProjects").innerHTML = renderEntries(data.projects, "project");
    $("#previewCertifications").innerHTML = renderEntries(data.certifications, "certification");
    $("#customSectionsPreview").innerHTML = data.customSections
      .filter(section => section.title || section.content)
      .map(section => `<section class="resume-section custom-resume-section"><h2>${escapeHTML(section.title || "Additional information")}</h2>${section.content ? `<p>${escapeHTML(section.content)}</p>` : ""}</section>`)
      .join("");
    setSectionVisibility("customSectionsPreview", data.customSections.some(section => section.title || section.content));
    setSectionVisibility("educationSection", data.education.some(item => Object.values(item).some(Boolean)));
    setSectionVisibility("experienceSection", data.experience.some(item => Object.values(item).some(Boolean)));
    setSectionVisibility("projectsSection", data.projects.some(item => Object.values(item).some(Boolean)));
    setSectionVisibility("certificationsSection", data.certifications.some(item => Object.values(item).some(Boolean)));

    const technicalSkills = parseSkills(data.technicalSkills || data.skills || "");
    $("#previewTechnicalSkills").innerHTML = technicalSkills.map(skill => `<span class="skill-chip">${escapeHTML(skill)}</span>`).join("");
    setSectionVisibility("technicalSkillsSection", technicalSkills.length > 0);

    const softSkills = parseSkills(data.softSkills || "");
    $("#previewSoftSkills").innerHTML = softSkills.map(skill => `<span class="skill-chip">${escapeHTML(skill)}</span>`).join("");
    setSectionVisibility("softSkillsSection", softSkills.length > 0);

    const hobbies = parseSkills(data.hobbies || "");
    $("#previewHobbies").innerHTML = hobbies.map(item => `<span class="skill-chip">${escapeHTML(item)}</span>`).join("");
    setSectionVisibility("hobbiesSection", hobbies.length > 0);

    $("#summarySection h2").textContent = sectionNames.profile || DEFAULT_SECTION_NAMES.profile;
    $("#educationSection h2").textContent = sectionNames.education || DEFAULT_SECTION_NAMES.education;
    $("#experienceSection h2").textContent = sectionNames.experience || DEFAULT_SECTION_NAMES.experience;
    $("#technicalSkillsSection h2").textContent = sectionNames.technicalSkills || DEFAULT_SECTION_NAMES.technicalSkills;
    $("#softSkillsSection h2").textContent = sectionNames.softSkills || DEFAULT_SECTION_NAMES.softSkills;
    $("#hobbiesSection h2").textContent = sectionNames.hobbies || DEFAULT_SECTION_NAMES.hobbies;
    $("#projectsSection h2").textContent = sectionNames.projects || DEFAULT_SECTION_NAMES.projects;
    $("#certificationsSection h2").textContent = sectionNames.certifications || DEFAULT_SECTION_NAMES.certifications;

    updateProgress(data);
  }

  function updateProgress(data) {
    const checks = [
      !!data.fullName, !!data.jobTitle, !!data.email || !!data.phone, !!data.summary,
      data.education.some(item => item.degree || item.school), !!(data.technicalSkills || data.softSkills || data.skills),
      data.experience.some(item => item.role || item.company), !!data.hobbies,
      data.projects.some(item => item.name)
    ];
    if (data.certifications.some(item => Object.values(item).some(Boolean))) {
      checks.push(data.certifications.some(item => item.name && item.issuer));
    }
    if (data.customSections.some(section => section.title || section.content)) {
      checks.push(data.customSections.some(section => section.title && section.content));
    }
    const percent = Math.round(checks.filter(Boolean).length / checks.length * 100);
    $("#progressPercent").textContent = `${percent}%`;
    $("#progressBar").style.width = `${percent}%`;
    $("#progressHint").textContent = percent >= 88 ? "Great work — your resume is taking shape!" :
      percent >= 63 ? "Nice progress. Add any remaining details." :
      "A few details can make a big difference.";
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(getData()));
      $("#saveStatus").textContent = "Saved locally";
    } catch {
      $("#saveStatus").textContent = "Session only";
    }
  }

  function refresh() {
    ["technicalSkills", "softSkills", "hobbies"].forEach(syncTagGroup);
    const data = getData();
    renderPreview(data);
    saveData();
  }

  function populateForm(data) {
    ["fullName", "jobTitle", "email", "phone", "location", "website", "summary", "technicalSkills", "softSkills", "hobbies"].forEach(name => {
      if (form.elements.namedItem(name)) form.elements.namedItem(name).value = data[name] ?? "";
    });
    const sectionNames = { ...DEFAULT_SECTION_NAMES, ...(data.sectionNames || {}) };
    $$("[data-section-name]").forEach(input => {
      const key = input.dataset.sectionName;
      input.value = sectionNames[key] || DEFAULT_SECTION_NAMES[key] || "";
    });
    if (!data.technicalSkills && data.skills) {
      form.elements.namedItem("technicalSkills").value = data.skills;
    }
    $("#templateSelect").value = data.template || "modern";
    $("#accentColor").value = data.accent || "#5865e8";
    photoData = typeof data.photoData === "string" &&
      /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(data.photoData) ? data.photoData : "";
    $("#photoInput").value = "";
    ["technicalSkills", "softSkills", "hobbies"].forEach(syncTagGroup);
    renderRepeatList("education", Array.isArray(data.education) ? data.education : []);
    renderRepeatList("experience", Array.isArray(data.experience) ? data.experience : []);
    renderRepeatList("project", Array.isArray(data.projects) ? data.projects : []);
    renderRepeatList("certification", Array.isArray(data.certifications) ? data.certifications : []);
    renderCustomSections(Array.isArray(data.customSections) ? data.customSections : []);
    refresh();
  }

  function addItem(type) {
    const existing = readRepeat(type);
    if (existing.length >= 10) {
      showToast("You can add up to 10 items in each section.");
      return;
    }
    const empty = type === "education" ? { degree: "", school: "", date: "", details: "" } :
      type === "experience" ? { role: "", company: "", date: "", details: "" } :
      type === "certification" ? { name: "", issuer: "", date: "", details: "" } :
      { name: "", date: "", details: "" };
    existing.push(empty);
    renderRepeatList(type, existing);
    refresh();
  }

  function removeItem(type, index) {
    const existing = readRepeat(type);
    existing.splice(index, 1);
    renderRepeatList(type, existing);
    refresh();
  }

  function addCustomSection() {
    const sections = readCustomSections();
    if (sections.length >= 10) {
      showToast("You can add up to 10 custom sections.");
      return;
    }
    sections.push({ title: "", content: "" });
    renderCustomSections(sections);
    refresh();
    const titleInput = $("#customSectionList .custom-section-card:last-child [data-custom-title]");
    titleInput?.focus();
  }

  function removeCustomSection(index) {
    const sections = readCustomSections();
    sections.splice(index, 1);
    renderCustomSections(sections);
    refresh();
  }

  function sanitizeFileName(value) {
    return String(value || "resume").replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "-") || "resume";
  }

  function buildWordDocument() {
    const data = getData();
    const sectionNames = { ...DEFAULT_SECTION_NAMES, ...(data.sectionNames || {}) };
    const sections = [];
    const addSection = (heading, items) => {
      if (!items || !items.length) return;
      sections.push(`<h2>${escapeHTML(heading)}</h2><ul>${items.map(item => `<li>${escapeHTML(item)}</li>`).join("")}</ul>`);
    };

    const technicalSkills = parseSkills(data.technicalSkills || data.skills || "");
    const softSkills = parseSkills(data.softSkills || "");
    const hobbies = parseSkills(data.hobbies || "");
    const education = (data.education || []).filter(item => Object.values(item).some(Boolean));
    const experience = (data.experience || []).filter(item => Object.values(item).some(Boolean));
    const projects = (data.projects || []).filter(item => Object.values(item).some(Boolean));
    const certifications = (data.certifications || []).filter(item => Object.values(item).some(Boolean));
    const customSections = (data.customSections || []).filter(section => section.title || section.content);

    const summary = data.summary ? `<p>${escapeHTML(data.summary)}</p>` : "";
    const contact = [data.email, data.phone, data.location, data.website].filter(Boolean).map(item => `<div>${escapeHTML(item)}</div>`).join("");

    const educationHtml = education.map(item => `
      <div>
        <strong>${escapeHTML(item.degree || "")}</strong>
        ${item.school ? `<div>${escapeHTML(item.school)}</div>` : ""}
        ${item.date ? `<div>${escapeHTML(item.date)}</div>` : ""}
        ${item.details ? `<div>${escapeHTML(item.details)}</div>` : ""}
      </div>
    `).join("");

    const experienceHtml = experience.map(item => `
      <div>
        <strong>${escapeHTML(item.role || "")}</strong>
        ${item.company ? `<div>${escapeHTML(item.company)}</div>` : ""}
        ${item.date ? `<div>${escapeHTML(item.date)}</div>` : ""}
        ${item.details ? `<div>${escapeHTML(item.details)}</div>` : ""}
      </div>
    `).join("");

    const projectsHtml = projects.map(item => `
      <div>
        <strong>${escapeHTML(item.name || "")}</strong>
        ${item.date ? `<div>${escapeHTML(item.date)}</div>` : ""}
        ${item.details ? `<div>${escapeHTML(item.details)}</div>` : ""}
      </div>
    `).join("");

    const certificationsHtml = certifications.map(item => `
      <div>
        <strong>${escapeHTML(item.name || "")}</strong>
        ${item.issuer ? `<div>${escapeHTML(item.issuer)}</div>` : ""}
        ${item.date ? `<div>${escapeHTML(item.date)}</div>` : ""}
        ${item.details ? `<div>${escapeHTML(item.details)}</div>` : ""}
      </div>
    `).join("");

    const customSectionsHtml = customSections.map(section => `
      <section><h2>${escapeHTML(section.title || "Additional information")}</h2>
        ${section.content ? `<p>${escapeHTML(section.content).replace(/\r?\n/g, "<br>")}</p>` : ""}
      </section>
    `).join("");

    addSection(sectionNames.technicalSkills || DEFAULT_SECTION_NAMES.technicalSkills, technicalSkills);
    addSection(sectionNames.softSkills || DEFAULT_SECTION_NAMES.softSkills, softSkills);
    addSection(sectionNames.hobbies || DEFAULT_SECTION_NAMES.hobbies, hobbies);

    return `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${escapeHTML(data.fullName || "Resume")}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #222; line-height: 1.5; margin: 32px; }
          h1 { font-size: 28px; margin-bottom: 8px; }
          h2 { font-size: 18px; color: #1f2937; margin-top: 18px; }
          p, div, li { font-size: 12px; }
          ul { margin-top: 6px; padding-left: 20px; }
          .header { border-bottom: 2px solid #d1d5db; padding-bottom: 12px; margin-bottom: 12px; }
          .contact { display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${escapeHTML(data.fullName || "Your Name")}</h1>
          ${data.jobTitle ? `<div>${escapeHTML(data.jobTitle)}</div>` : ""}
          <div class="contact">${contact}</div>
        </div>
        ${summary ? `<section><h2>${escapeHTML(sectionNames.profile || DEFAULT_SECTION_NAMES.profile)}</h2>${summary}</section>` : ""}
        ${educationHtml ? `<section><h2>${escapeHTML(sectionNames.education || DEFAULT_SECTION_NAMES.education)}</h2>${educationHtml}</section>` : ""}
        ${experienceHtml ? `<section><h2>${escapeHTML(sectionNames.experience || DEFAULT_SECTION_NAMES.experience)}</h2>${experienceHtml}</section>` : ""}
        ${technicalSkills.length ? `<section><h2>${escapeHTML(sectionNames.technicalSkills || DEFAULT_SECTION_NAMES.technicalSkills)}</h2><ul>${technicalSkills.map(skill => `<li>${escapeHTML(skill)}</li>`).join("")}</ul></section>` : ""}
        ${softSkills.length ? `<section><h2>${escapeHTML(sectionNames.softSkills || DEFAULT_SECTION_NAMES.softSkills)}</h2><ul>${softSkills.map(skill => `<li>${escapeHTML(skill)}</li>`).join("")}</ul></section>` : ""}
        ${hobbies.length ? `<section><h2>${escapeHTML(sectionNames.hobbies || DEFAULT_SECTION_NAMES.hobbies)}</h2><ul>${hobbies.map(item => `<li>${escapeHTML(item)}</li>`).join("")}</ul></section>` : ""}
        ${certificationsHtml ? `<section><h2>${escapeHTML(sectionNames.certifications || DEFAULT_SECTION_NAMES.certifications)}</h2>${certificationsHtml}</section>` : ""}
        ${projectsHtml ? `<section><h2>${escapeHTML(sectionNames.projects || DEFAULT_SECTION_NAMES.projects)}</h2>${projectsHtml}</section>` : ""}
        ${customSectionsHtml}
      </body>
    </html>`;
  }

  function downloadPDF() {
    const name = getFormValue("fullName");
    if (!name) {
      form.elements.namedItem("fullName").focus();
      showToast("Please enter your name before downloading.");
      return;
    }
    showToast("Choose “Save as PDF” in the print window.");
    window.setTimeout(() => window.print(), 180);
  }

  function downloadWord() {
    const data = getData();
    const name = data.fullName || "resume";
    const html = buildWordDocument();
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sanitizeFileName(name)}-A1Resumecraft.doc`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    showToast("Word file downloaded.");
  }

  form.addEventListener("input", event => {
    if (event.target.matches("[data-key]")) {
      refresh();
      return;
    }
    if (event.target.matches("[data-tag-input]")) {
      return;
    }
    refresh();
  });
  form.addEventListener("change", event => {
    if (event.target.matches("[data-tag-input]")) {
      return;
    }
    refresh();
  });
  $("#templateSelect").addEventListener("change", refresh);
  $("#accentColor").addEventListener("input", refresh);
  $("#photoInput").addEventListener("change", async event => {
    const file = event.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      event.target.value = "";
      showToast("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      event.target.value = "";
      showToast("Choose an image smaller than 10 MB.");
      return;
    }

    const loadId = ++photoLoadId;
    const imageUrl = URL.createObjectURL(file);
    try {
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error("The selected photo could not be opened."));
        image.src = imageUrl;
      });
      if (loadId !== photoLoadId) return;
      const scale = Math.min(1, 480 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Photo processing is not available in this browser.");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      photoData = canvas.toDataURL("image/jpeg", 0.82);
      refresh();
    } catch (error) {
      if (loadId === photoLoadId) {
        event.target.value = "";
        showToast(error.message || "The selected photo could not be processed.");
      }
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  });
  $("#removePhoto").addEventListener("click", () => {
    photoLoadId += 1;
    photoData = "";
    $("#photoInput").value = "";
    refresh();
  });
  $("#addEducation").addEventListener("click", () => addItem("education"));
  $("#addExperience").addEventListener("click", () => addItem("experience"));
  $("#addProject").addEventListener("click", () => addItem("project"));
  $("#addCertification").addEventListener("click", () => addItem("certification"));
  $("#addCustomSection").addEventListener("click", addCustomSection);
  document.addEventListener("click", event => {
    const addButton = event.target.closest("[data-tag-add]");
    if (addButton) {
      addTagToGroup(addButton.dataset.tagAdd);
      return;
    }
    const removeButton = event.target.closest("[data-tag-remove]");
    if (removeButton) {
      removeTagFromGroup(removeButton.dataset.tagRemove, removeButton.dataset.tagValue);
      return;
    }
    const itemRemoveButton = event.target.closest("[data-remove]");
    if (itemRemoveButton) {
      removeItem(itemRemoveButton.dataset.remove, Number(itemRemoveButton.dataset.index));
      return;
    }
    const customRemoveButton = event.target.closest("[data-custom-remove]");
    if (customRemoveButton) removeCustomSection(Number(customRemoveButton.dataset.customRemove));
  });
  document.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;
    const input = event.target.closest("[data-tag-input]");
    if (!input) return;
    event.preventDefault();
    addTagToGroup(input.dataset.tagInput);
  });
  $("#downloadTop").addEventListener("click", downloadPDF);
  $("#downloadBottom").addEventListener("click", downloadPDF);
  $("#exportWordTop").addEventListener("click", downloadWord);
  $("#exportWordBottom").addEventListener("click", downloadWord);
  $("#zoomIn").addEventListener("click", () => {
    zoom = Math.min(120, zoom + 10);
    applyZoom();
  });
  $("#zoomOut").addEventListener("click", () => {
    zoom = Math.max(70, zoom - 10);
    applyZoom();
  });
  function applyZoom() {
    $("#resumePaper").style.transform = `scale(${zoom / 100})`;
    $("#zoomLabel").textContent = `${zoom}%`;
  }
  $("#resetButton").addEventListener("click", () => {
    if (confirm("Reset all fields to the sample resume? Your current edits will be replaced.")) {
      populateForm(sample);
      showToast("Sample resume restored.");
    }
  });

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    populateForm(saved ? { ...sample, ...JSON.parse(saved) } : sample);
  } catch {
    populateForm(sample);
  }
})();