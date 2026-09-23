const authClient = window.linkedUpSupabase;
const authMessage = document.querySelector("#auth-message");
const isLoginPage = document.body.classList.contains("auth-page");
const isDashboardPage = Boolean(document.querySelector(".dashboard-shell"));

function showAuthMessage(message, type = "success") {
  if (!authMessage) {
    return;
  }

  authMessage.textContent = message;
  authMessage.className = `auth-message visible ${type}`;
}

function setFormLoading(form, isLoading) {
  const submitButton = form?.querySelector("button[type='submit']");

  if (!submitButton) {
    return;
  }

  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Please wait..." : submitButton.dataset.defaultText;
}

function getAuthFormValues(form) {
  const formData = new FormData(form);

  return {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    password: String(formData.get("password") || "")
  };
}

function requireSupabaseConfig() {
  if (authClient) {
    return true;
  }

  showAuthMessage(
    "Supabase is not configured yet. Add your Project URL and public anon key in js/supabase.js.",
    "error"
  );
  return false;
}

async function redirectForSession() {
  if (!authClient) {
    requireSupabaseConfig();
    return;
  }

  const { data, error } = await authClient.auth.getSession();

  if (error) {
    showAuthMessage(error.message, "error");
    return;
  }

  if (isLoginPage && data.session) {
    window.location.replace("app.html");
  }

  if (isDashboardPage && !data.session) {
    window.location.replace("index.html");
  }
}

async function handleLogin(event) {
  event.preventDefault();

  if (!requireSupabaseConfig()) {
    return;
  }

  const form = event.currentTarget;
  const { email, password } = getAuthFormValues(form);
  setFormLoading(form, true);
  showAuthMessage("Logging in...", "success");

  const { error } = await authClient.auth.signInWithPassword({ email, password });

  setFormLoading(form, false);

  if (error) {
    showAuthMessage(error.message, "error");
    return;
  }

  showAuthMessage("Login successful. Opening your dashboard...", "success");
  window.location.assign("app.html");
}

async function handleRegistration(event) {
  event.preventDefault();

  if (!requireSupabaseConfig()) {
    return;
  }

  const form = event.currentTarget;
  const { name, email, password } = getAuthFormValues(form);
  setFormLoading(form, true);
  showAuthMessage("Creating your account...", "success");

  const { data, error } = await authClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name
      }
    }
  });

  setFormLoading(form, false);

  if (error) {
    showAuthMessage(error.message, "error");
    return;
  }

  if (data.session) {
    showAuthMessage("Account created. Opening your dashboard...", "success");
    window.location.assign("app.html");
    return;
  }

  showAuthMessage("Account created. Check your email if confirmation is enabled.", "success");
  form.reset();
}

async function handleLogout() {
  if (!requireSupabaseConfig()) {
    return;
  }

  showAuthMessage("Logging out...", "success");
  const { error } = await authClient.auth.signOut();

  if (error) {
    showAuthMessage(error.message, "error");
    return;
  }

  window.location.assign("index.html");
}

document.querySelectorAll("button[type='submit']").forEach((button) => {
  button.dataset.defaultText = button.textContent;
});

document.querySelector("#login-form")?.addEventListener("submit", handleLogin);
document.querySelector("#register-form")?.addEventListener("submit", handleRegistration);
document.querySelector("#logout-button")?.addEventListener("click", handleLogout);

redirectForSession();
