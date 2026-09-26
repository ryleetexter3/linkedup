const tabButtons = document.querySelectorAll("[data-auth-tab]");
const authPanels = document.querySelectorAll("[data-auth-panel]");
const dashboardClient = window.linkedUpSupabase;
const dashboardShell = document.querySelector(".dashboard-shell");
const dashboardMessage = document.querySelector("#auth-message");
const createEventPanel = document.querySelector("#create-event-panel");
const eventFormEyebrow = document.querySelector("#event-form-eyebrow");
const eventFormTitle = document.querySelector("#create-event-title");
const eventForm = document.querySelector("#event-form");
const eventsSection = document.querySelector("#events");
const detailsTitle = document.querySelector("#details-title");
const detailsDescription = document.querySelector("#details-description");

let dashboardEvents = [];
let selectedEventId = null;
let editingEventId = null;
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

function setEventFormMode(mode, event = null) {
  const isEditing = mode === "edit" && event;
  const submitButton = eventForm?.querySelector("button[type='submit']");

  editingEventId = isEditing ? event.id : null;

  if (eventFormEyebrow) {
    eventFormEyebrow.textContent = isEditing ? "Update plan" : "New plan";
  }

  if (eventFormTitle) {
    eventFormTitle.textContent = isEditing ? "Edit Event" : "Create Event";
  }

  if (submitButton) {
    submitButton.dataset.defaultText = isEditing ? "Save Changes" : "Save Event";
    submitButton.textContent = submitButton.dataset.defaultText;
  }

  if (!eventForm) {
    return;
  }

  if (!isEditing) {
    eventForm.reset();
    return;
  }

  eventForm.elements.title.value = event.title || "";
  eventForm.elements.event_date.value = event.event_date || "";
  eventForm.elements.start_time.value = event.start_time || "";
  eventForm.elements.end_time.value = event.end_time || "";
  eventForm.elements.location.value = event.location || "";
  eventForm.elements.description.value = event.description || "";
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
  } else {
    setEventFormMode("create");
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

function beginEditEvent(eventId) {
  const event = dashboardEvents.find((dashboardEvent) => dashboardEvent.id === eventId);

  if (!event) {
    showDashboardMessage("Select an event before editing.", "error");
    return;
  }

  selectedEventId = event.id;
  renderEvents();
  renderEventDetails(event);
  setEventFormMode("edit", event);
  toggleEventForm(true);
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
    const actions = document.createElement("div");
    const editButton = document.createElement("button");
    const deleteButton = document.createElement("button");

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

    actions.className = "event-card-actions";
    editButton.className = "secondary-button compact-button";
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.setAttribute("aria-label", `Edit ${event.title}`);
    editButton.addEventListener("click", (buttonEvent) => {
      buttonEvent.stopPropagation();
      beginEditEvent(event.id);
    });

    deleteButton.className = "secondary-button compact-button danger-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete ${event.title}`);
    deleteButton.addEventListener("click", (buttonEvent) => {
      buttonEvent.stopPropagation();
      handleDeleteEvent(event.id);
    });

    actions.append(editButton, deleteButton);
    eventCard.append(cardTopline, title, facts, actions);

    eventCard.addEventListener("click", () => selectEvent(event.id));
    eventCard.addEventListener("keydown", (eventKey) => {
      if (eventKey.target !== eventCard) {
        return;
      }

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
    const isEditing = Boolean(editingEventId);
    let savedEventId = editingEventId;
    let error;

    if (isEditing) {
      const result = await withTimeout(
        dashboardClient
          .from("events")
          .update(eventValues)
          .eq("id", editingEventId)
          .eq("user_id", user.id)
          .select("id")
          .maybeSingle(),
        "Updating the event is taking too long. Please refresh and try again."
      );

      error = result.error;
      savedEventId = result.data?.id || savedEventId;
    } else {
      const result = await withTimeout(
        dashboardClient
          .from("events")
          .insert({
            ...eventValues,
            user_id: user.id
          })
          .select("id")
          .single(),
        "Creating the event is taking too long. Please refresh and try again."
      );

      error = result.error;
      savedEventId = result.data?.id;
    }

    if (error) {
      throw error;
    }

    if (!savedEventId) {
      throw new Error("Event could not be saved. Please refresh and try again.");
    }

    selectedEventId = savedEventId;
    toggleEventForm(false);
    showDashboardMessage(
      isEditing ? "Event updated successfully." : "Event created successfully.",
      "success"
    );
    await loadDashboardEvents();
  } catch (error) {
    showDashboardMessage(error.message, "error");
  } finally {
    setEventFormLoading(false);
  }
}

async function handleDeleteEvent(eventId) {
  const event = dashboardEvents.find((dashboardEvent) => dashboardEvent.id === eventId);
  const eventName = event?.title || "this event";

  if (!window.confirm(`Delete "${eventName}"? This cannot be undone.`)) {
    return;
  }

  showDashboardMessage("Deleting event...", "success");

  try {
    const user = await getAuthenticatedUser();
    const { data, error } = await withTimeout(
      dashboardClient
        .from("events")
        .delete()
        .eq("id", eventId)
        .eq("user_id", user.id)
        .select("id")
        .maybeSingle(),
      "Deleting the event is taking too long. Please refresh and try again."
    );

    if (error) {
      throw error;
    }

    if (!data?.id) {
      throw new Error("Event could not be deleted. Please refresh and try again.");
    }

    if (selectedEventId === eventId) {
      selectedEventId = null;
    }

    if (editingEventId === eventId) {
      toggleEventForm(false);
    }

    showDashboardMessage("Event deleted successfully.", "success");
    await loadDashboardEvents();
  } catch (error) {
    showDashboardMessage(error.message, "error");
  }
}

document.addEventListener("click", (event) => {
  const eventAction = event.target.closest("#create-event-button, #cancel-event-button");

  if (!eventAction) {
    return;
  }

  if (eventAction.id === "create-event-button") {
    setEventFormMode("create");
    toggleEventForm(true);
    return;
  }

  toggleEventForm(false);
});
eventForm?.addEventListener("submit", handleEventSubmit);

loadDashboardEvents();
