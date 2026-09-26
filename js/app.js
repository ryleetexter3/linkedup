const tabButtons = document.querySelectorAll("[data-auth-tab]");
const authPanels = document.querySelectorAll("[data-auth-panel]");
const dashboardClient = window.linkedUpSupabase;
const dashboardShell = document.querySelector(".dashboard-shell");
const dashboardMessage = document.querySelector("#auth-message");
const createEventPanel = document.querySelector("#create-event-panel");
const eventForm = document.querySelector("#event-form");
const eventsSection = document.querySelector("#events");
const detailsTitle = document.querySelector("#details-title");
const detailsDescription = document.querySelector("#details-description");

let dashboardEvents = [];
let selectedEventId = null;
const SUPABASE_TIMEOUT_MS = 10000;

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedTab = button.dataset.authTab;

    tabButtons.forEach((tabButton) => {
      const isActive = tabButton.dataset.authTab === selectedTab;
      tabButton.classList.toggle("active", isActive);
      tabButton.setAttribute("aria-selected", String(isActive));
    });

    authPanels.forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.authPanel === selectedTab);
    });
  });
});

function showDashboardMessage(message, type = "success") {
  if (!dashboardMessage) {
    return;
  }

  dashboardMessage.textContent = message;
  dashboardMessage.className = `auth-message dashboard-message visible ${type}`;
}

function clearDashboardMessage() {
  if (!dashboardMessage) {
    return;
  }

  dashboardMessage.textContent = "";
  dashboardMessage.className = "auth-message dashboard-message";
}

function setEventFormLoading(isLoading) {
  const submitButton = eventForm?.querySelector("button[type='submit']");

  if (!submitButton) {
    return;
  }

  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Saving..." : submitButton.dataset.defaultText;
}

async function withTimeout(promise, message) {
  let timeoutId;

  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(message));
    }, SUPABASE_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function toggleEventForm(isOpen) {
  if (!createEventPanel) {
    return;
  }

  createEventPanel.hidden = !isOpen;

  if (isOpen) {
    clearDashboardMessage();
    createEventPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    document.querySelector("#event-title")?.focus({ preventScroll: true });
  }
}

function formatEventDate(dateValue) {
  if (!dateValue) {
    return "Date TBD";
  }

  const date = new Date(`${dateValue}T00:00:00`);

  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function formatEventTime(timeValue) {
  if (!timeValue) {
    return "TBD";
  }

  const [hours = "0", minutes = "0"] = timeValue.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function getEventTimeRange(event) {
  if (!event.start_time && !event.end_time) {
    return "Time TBD";
  }

  return `${formatEventTime(event.start_time)} - ${formatEventTime(event.end_time)}`;
}

function renderEventDetails(event) {
  if (!detailsTitle || !detailsDescription) {
    return;
  }

  if (!event) {
    detailsTitle.textContent = "Select an event";
    detailsDescription.textContent = "Create an event or choose one from your dashboard to see its details here.";
    return;
  }

  detailsTitle.textContent = event.title;
  detailsDescription.textContent =
    event.description ||
    `${formatEventDate(event.event_date)} at ${getEventTimeRange(event)} in ${event.location}.`;
}

function selectEvent(eventId) {
  selectedEventId = eventId;
  renderEvents();
  renderEventDetails(dashboardEvents.find((event) => event.id === selectedEventId));
}

function renderEmptyEvents(message) {
  if (!eventsSection) {
    return;
  }

  eventsSection.innerHTML = "";
  const emptyState = document.createElement("p");
  emptyState.className = "empty-state";
  emptyState.textContent = message;
  eventsSection.append(emptyState);
  renderEventDetails(null);
}

function createFact(label, value) {
  const row = document.createElement("div");
  const term = document.createElement("dt");
  const detail = document.createElement("dd");

  term.textContent = label;
  detail.textContent = value;
  row.append(term, detail);

  return row;
}

function renderEvents() {
  if (!eventsSection) {
    return;
  }

  if (!dashboardEvents.length) {
    renderEmptyEvents("You do not have any events yet. Create your first event to get started.");
    return;
  }

  if (!selectedEventId || !dashboardEvents.some((event) => event.id === selectedEventId)) {
    selectedEventId = dashboardEvents[0].id;
  }

  eventsSection.innerHTML = "";

  dashboardEvents.forEach((event, index) => {
    const eventCard = document.createElement("article");
    const cardTopline = document.createElement("div");
    const status = document.createElement("span");
    const date = document.createElement("span");
    const title = document.createElement("h2");
    const facts = document.createElement("dl");

    eventCard.className = `event-card${event.id === selectedEventId ? " selected" : ""}`;
    eventCard.tabIndex = 0;
    eventCard.setAttribute("role", "button");
    eventCard.setAttribute("aria-pressed", String(event.id === selectedEventId));

    cardTopline.className = "card-topline";
    status.className = `status-pill${index === 0 ? "" : " muted"}`;
    status.textContent = index === 0 ? "Next up" : "Planning";
    date.textContent = formatEventDate(event.event_date);
    cardTopline.append(status, date);

    title.textContent = event.title;

    facts.className = "event-facts";
    facts.append(
      createFact("Time", getEventTimeRange(event)),
      createFact("Location", event.location),
      createFact("Description", event.description || "No description yet.")
    );

    eventCard.append(cardTopline, title, facts);

    eventCard.addEventListener("click", () => selectEvent(event.id));
    eventCard.addEventListener("keydown", (eventKey) => {
      if (eventKey.key === "Enter" || eventKey.key === " ") {
        eventKey.preventDefault();
        selectEvent(event.id);
      }
    });

    eventsSection.append(eventCard);
  });

  renderEventDetails(dashboardEvents.find((event) => event.id === selectedEventId));
}

async function getAuthenticatedUser() {
  if (!dashboardClient) {
    throw new Error("Supabase is not configured yet.");
  }

  const { data, error } = await withTimeout(
    dashboardClient.auth.getSession(),
    "Authentication is taking too long. Please refresh and try again."
  );

  if (error) {
    throw error;
  }

  if (!data.session?.user) {
    throw new Error("Please log in to manage events.");
  }

  return data.session.user;
}

async function loadDashboardEvents() {
  if (!dashboardShell) {
    return;
  }

  renderEmptyEvents("Loading your events...");

  try {
    const user = await getAuthenticatedUser();
    const { data, error } = await withTimeout(
      dashboardClient
        .from("events")
        .select("id,user_id,title,event_date,start_time,end_time,location,description,created_at")
        .eq("user_id", user.id)
        .order("event_date", { ascending: true })
        .order("start_time", { ascending: true }),
      "Loading events is taking too long. Please refresh and try again."
    );

    if (error) {
      throw error;
    }

    dashboardEvents = data || [];
    renderEvents();
  } catch (error) {
    dashboardEvents = [];
    const isAuthError = error.message === "Please log in to manage events.";
    renderEmptyEvents(
      isAuthError ? "Log in to view your events." : "Unable to load events right now."
    );
    showDashboardMessage(error.message, "error");
  }
}

function getEventFormValues() {
  const formData = new FormData(eventForm);

  return {
    title: String(formData.get("title") || "").trim(),
    event_date: String(formData.get("event_date") || ""),
    start_time: String(formData.get("start_time") || ""),
    end_time: String(formData.get("end_time") || ""),
    location: String(formData.get("location") || "").trim(),
    description: String(formData.get("description") || "").trim()
  };
}

async function handleEventSubmit(event) {
  event.preventDefault();

  if (!eventForm) {
    return;
  }

  setEventFormLoading(true);
  showDashboardMessage("Saving your event...", "success");

  try {
    const user = await getAuthenticatedUser();
    const eventValues = getEventFormValues();
    const { data, error } = await dashboardClient
      .from("events")
      .insert({
        ...eventValues,
        user_id: user.id
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    selectedEventId = data.id;
    eventForm.reset();
    toggleEventForm(false);
    showDashboardMessage("Event created successfully.", "success");
    await loadDashboardEvents();
  } catch (error) {
    showDashboardMessage(error.message, "error");
  } finally {
    setEventFormLoading(false);
  }
}

document.addEventListener("click", (event) => {
  const eventAction = event.target.closest("#create-event-button, #cancel-event-button");

  if (!eventAction) {
    return;
  }

  toggleEventForm(eventAction.id === "create-event-button");
});
eventForm?.addEventListener("submit", handleEventSubmit);

loadDashboardEvents();
