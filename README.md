# LinkedUp

LinkedUp is a web-based group hangout planner built for an Engineering Design 2 project. The app helps users create events, manage invitees, track RSVP statuses, and organize itinerary items for each event from a simple dashboard.

## Deployed App

https://linkedup-social.netlify.app

## Main Features

- Registration, login, and logout with Supabase Auth
- Event CRUD: create, view, update, and delete events
- Invitee CRUD: add, view, edit, and remove invitees for each event
- RSVP tracking with statuses for Invited, Going, Maybe, and Not Going
- Itinerary item CRUD: create, view, update, and delete planned stops for each event

## Technologies Used

- HTML
- CSS
- JavaScript
- Supabase Database
- Supabase Auth
- GitHub
- Netlify

## Setup Instructions

1. Clone the repository:

   ```bash
   git clone https://github.com/ryleetexter3/linkedup.git
   cd linkedup
   ```

2. Open `js/supabase.js` and confirm the Supabase project URL and public anon key are configured.

3. Serve the project locally with any static file server. For example:

   ```bash
   python3 -m http.server 8000
   ```

4. Open the local site in a browser:

   ```text
   http://localhost:8000
   ```

5. Register or log in to access the dashboard.

## Project Structure

- `index.html` - Login and registration page.
- `app.html` - Authenticated dashboard for events, invitees, RSVPs, and itinerary items.
- `css/styles.css` - Shared styling for the authentication page and dashboard.
- `js/supabase.js` - Supabase client configuration.
- `js/auth.js` - Registration, login, logout, and session redirect logic.
- `js/app.js` - Dashboard behavior and Supabase CRUD operations.

## Demo Video

https://youtu.be/vPI-_UqFGX8
