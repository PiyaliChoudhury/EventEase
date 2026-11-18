import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  MapPin,
  Search,
  Ticket,
  ArrowRight,
  Sparkles,
  X,
  Menu,
  CheckCircle2,
  PartyPopper,
  LoaderCircle
} from "lucide-react";

import "./App.css";

const API =
  "https://2vz56w2bob.execute-api.ap-southeast-2.amazonaws.com";

const categories = [
  "All Events",
  "Technical",
  "Competition",
  "Cultural"
];

const photos = [
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900"
];

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Events");

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  const [form, setForm] = useState({
    participantName: "",
    email: "",
    phone: ""
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const [confirmation, setConfirmation] = useState(null);

  // LOAD EVENTS FROM AWS

  async function loadEvents() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/events`);

      if (!response.ok) {
        throw new Error("Unable to load events.");
      }

      const data = await response.json();

      if (data.success === false) {
        throw new Error(data.message || "Unable to load events.");
      }

      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (err) {
      console.error("Events error:", err);
      setError(
        "Could not connect to events. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  // SEARCH AND CATEGORY FILTER

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesCategory =
        category === "All Events" ||
        event.category === category;

      const matchesSearch =
        `${event.eventName || ""} ${event.description || ""} ${event.venue || ""}`
          .toLowerCase()
          .includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [events, category, search]);

  // REGISTER FOR AN EVENT

  async function register(e) {
    e.preventDefault();

    if (!selectedEvent || submitting) return;

    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          participantName: form.participantName.trim(),
          email: form.email.trim(),
          phone: form.phone,
          eventId: selectedEvent.eventId
        })
      });

      const raw = await response.text();

      let data;

      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error("Invalid response received from the server.");
      }

      if (!response.ok || data.success !== true) {
        throw new Error(
          data.message || "Registration was unsuccessful."
        );
      }

      // Lambda returns registration details inside data.registration

      const registration = data.registration || {};

      // Show confirmation only after successful AWS registration

      setConfirmation({
        event: { ...selectedEvent },
        participant: { ...form },
        registrationId:
          registration.registrationId ||
          data.registrationId ||
          data.registration_id ||
          data.id ||
          null
      });

      setSelectedEvent(null);

      setForm({
        participantName: "",
        email: "",
        phone: ""
      });

      setMessage("");

    } catch (err) {
      console.error("Registration error:", err);

      setMessage(
        err.message === "Failed to fetch"
          ? "Unable to connect to AWS. Please check your API Gateway CORS settings and POST route."
          : err.message
      );
    } finally {
      setSubmitting(false);
    }
  }

  // CLOSE CONFIRMATION PAGE

  function closeConfirmation() {
    setConfirmation(null);

    setTimeout(() => {
      document.getElementById("events")?.scrollIntoView({
        behavior: "smooth"
      });
    }, 100);
  }

  // MAIN WEBSITE

  return (
    <div className="app">

      {/* NAVIGATION */}

      <nav className="navbar">

        <a href="#home" className="brand">
          <span className="brand-icon">
            <Sparkles size={22} />
          </span>
          Event<span>Ease</span>
        </a>

        <button
          className="menu-toggle"
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Toggle navigation menu"
        >
          <Menu />
        </button>

        <div className={`nav-links ${mobileMenu ? "open" : ""}`}>

          <a href="#home" onClick={() => setMobileMenu(false)}>
            Home
          </a>

          <a href="#events" onClick={() => setMobileMenu(false)}>
            Explore Events
          </a>

          <a href="#about" onClick={() => setMobileMenu(false)}>
            About
          </a>

          <a
            href="#events"
            className="nav-button"
            onClick={() => setMobileMenu(false)}
          >
            Find Events <ArrowRight size={16} />
          </a>

        </div>
      </nav>

      <main>

        {/* HERO SECTION */}

        <section className="hero" id="home">

          <div className="hero-content">

            <div className="eyebrow">
              <Sparkles size={15} />
              YOUR CAMPUS. YOUR MOMENT.
            </div>

            <h1>
              Discover Events.
              <br />
              Create <span>Memories.</span>
            </h1>

            <p>
              From exciting tech competitions to unforgettable
              cultural nights, find your next experience with EventEase.
            </p>

            <div className="hero-actions">

              <a href="#events" className="primary-btn">
                Explore Events <ArrowRight size={18} />
              </a>

              <a href="#about" className="secondary-btn">
                Discover More
              </a>

            </div>

            <div className="hero-stats">

              <div>
                <strong>{events.length}+</strong>
                <small>Events listed</small>
              </div>

              <div>
                <strong>3</strong>
                <small>Categories</small>
              </div>

              <div>
                <strong>100%</strong>
                <small>Online booking</small>
              </div>

            </div>

          </div>

          <div className="hero-visual">

            <div className="hero-image">
              <img
                src={photos[2]}
                alt="Live event celebration"
              />
            </div>

            <div className="floating-card">

              <span className="floating-icon">
                <CalendarDays />
              </span>

              <div>
                <strong>What's happening?</strong>
                <small>Explore your next event</small>
              </div>

            </div>

            <div className="floating-tag">
              <Sparkles size={15} />
              Make every moment count
            </div>

          </div>

        </section>

        {/* EVENTS SECTION */}

        <section className="event-section" id="events">

          <div className="section-heading">

            <div>

              <span className="section-label">
                EXPLORE & EXPERIENCE
              </span>

              <h2>
                Find your next <span>experience.</span>
              </h2>

              <p>
                Discover exciting events happening around your campus.
              </p>

            </div>

            <div className="event-count">
              <Ticket size={17} />
              {events.length} Events
            </div>

          </div>

          {/* SEARCH AND FILTER */}

          <div className="event-controls">

            <div className="search-box">

              <Search size={19} />

              <input
                placeholder="Search events, venues..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

            </div>

            <div className="category-tabs">

              {categories.map((item) => (

                <button
                  key={item}
                  className={category === item ? "active" : ""}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>

              ))}

            </div>

          </div>

          {/* EVENT LOADING */}

          {loading ? (

            <div className="loading">
              <LoaderCircle className="spin" />
              Loading events from AWS...
            </div>

          ) : error ? (

            <div className="empty-state">

              <p>{error}</p>

              <button
                className="primary-btn"
                onClick={loadEvents}
              >
                Try Again
              </button>

            </div>

          ) : filteredEvents.length === 0 ? (

            <div className="empty-state">

              <PartyPopper size={35} />

              <h3>No events found</h3>

              <p>
                Try another search or category.
              </p>

            </div>

          ) : (

            /* EVENT CARDS */

            <div className="event-grid">

              {filteredEvents.map((event, index) => (

                <article
                  className="event-card"
                  key={event.eventId}
                >

                  <div className="event-image">

                    <img
                      src={photos[index % photos.length]}
                      alt={event.eventName}
                    />

                    <span className="category-badge">
                      {event.category}
                    </span>

                  </div>

                  <div className="event-info">

                    <div className="event-date">
                      <CalendarDays size={15} />
                      {event.date}
                    </div>

                    <h3>{event.eventName}</h3>

                    <p className="event-description">
                      {event.description}
                    </p>

                    <div className="event-venue">
                      <MapPin size={16} />
                      {event.venue}
                    </div>

                    <button
                      className="register-btn"
                      onClick={() => {
                        setSelectedEvent(event);
                        setMessage("");

                        setForm({
                          participantName: "",
                          email: "",
                          phone: ""
                        });
                      }}
                    >
                      Register Now
                      <ArrowRight size={17} />
                    </button>

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>

        {/* ABOUT SECTION */}

        <section className="about-section" id="about">

          <div className="about-icon">
            <Sparkles size={28} />
          </div>

          <span className="section-label">
            WHY EVENTEASE?
          </span>

          <h2>
            One platform. Endless experiences.
          </h2>

          <p>
            EventEase makes discovering and registering for campus
            events simple. Explore opportunities, connect with people
            and never miss a moment worth remembering.
          </p>

          <a href="#events" className="primary-btn">
            Explore all events
            <ArrowRight size={17} />
          </a>

        </section>

      </main>

      {/* FOOTER */}

      <footer>

        <a href="#home" className="brand">

          <span className="brand-icon">
            <Sparkles size={19} />
          </span>

          Event<span>Ease</span>

        </a>

        <p>Making every event an experience.</p>

        <small>
          © 2026 EventEase. All rights reserved.
        </small>

      </footer>

      {/* REGISTRATION POPUP */}

      {selectedEvent && (

        <div
          className="modal-overlay"
          onClick={() => {
            if (!submitting) {
              setSelectedEvent(null);
              setMessage("");
            }
          }}
        >

          <div
            className="registration-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              className="close-modal"
              disabled={submitting}
              onClick={() => {
                setSelectedEvent(null);
                setMessage("");
              }}
              aria-label="Close registration form"
            >
              <X />
            </button>

            <span className="section-label">
              SAVE YOUR SPOT
            </span>

            <h2>
              Join the <span>experience.</span>
            </h2>

            <p className="modal-event">
              {selectedEvent.eventName}
            </p>

            <div className="modal-details">

              <span>
                <CalendarDays size={15} />
                {selectedEvent.date}
              </span>

              <span>
                <MapPin size={15} />
                {selectedEvent.venue}
              </span>

            </div>

            <form onSubmit={register}>

              <label>Full Name</label>

              <input
                required
                type="text"
                placeholder="Enter your full name"
                value={form.participantName}
                onChange={(e) =>
                  setForm({
                    ...form,
                    participantName: e.target.value
                  })
                }
              />

              <label>Email Address</label>

              <input
                required
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value
                  })
                }
              />

              <label>Phone Number</label>

              <input
                required
                type="tel"
                pattern="[0-9]{10}"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value.replace(/\D/g, "")
                  })
                }
              />

              {message && (
                <p className="form-error">
                  {message}
                </p>
              )}

              <button
                className="primary-btn submit-btn"
                type="submit"
                disabled={submitting}
              >

                {submitting
                  ? "Registering..."
                  : "Confirm Registration"}

                {!submitting && (
                  <ArrowRight size={17} />
                )}

              </button>

            </form>

          </div>

        </div>

      )}

      {/* INDIVIDUAL REGISTRATION CONFIRMATION PAGE */}

      {confirmation && (

        <div className="confirmation-screen">

          <div className="confirmation-card">

            <div className="confirmation-icon">
              <CheckCircle2 size={55} />
            </div>

            <span className="section-label">
              REGISTRATION SUCCESSFUL
            </span>

            <h1>
              You're <span>Confirmed!</span>
            </h1>

            <p className="confirmation-subtitle">
              Your spot has been successfully reserved.
              We look forward to seeing you there!
            </p>

            <div className="confirmation-status">
              <CheckCircle2 size={18} />
              Registration Confirmed
            </div>

            {/* EVENT INFORMATION */}

            <div className="confirmation-details">

              <h3>Event Details</h3>

              <div className="confirmation-row">
                <span>Event Name</span>
                <strong>
                  {confirmation.event.eventName}
                </strong>
              </div>

              <div className="confirmation-row">
                <span>Event ID</span>
                <strong>
                  {confirmation.event.eventId}
                </strong>
              </div>

              <div className="confirmation-row">
                <span>Category</span>
                <strong>
                  {confirmation.event.category}
                </strong>
              </div>

              <div className="confirmation-row">
                <span>Date</span>
                <strong>
                  {confirmation.event.date}
                </strong>
              </div>

              <div className="confirmation-row">
                <span>Venue</span>
                <strong>
                  {confirmation.event.venue}
                </strong>
              </div>

              {/* PARTICIPANT INFORMATION */}

              <h3>Participant Details</h3>

              <div className="confirmation-row">
                <span>Full Name</span>
                <strong>
                  {confirmation.participant.participantName}
                </strong>
              </div>

              <div className="confirmation-row">
                <span>Email</span>
                <strong>
                  {confirmation.participant.email}
                </strong>
              </div>

              <div className="confirmation-row">
                <span>Phone</span>
                <strong>
                  {confirmation.participant.phone}
                </strong>
              </div>

              {confirmation.registrationId && (

                <div className="confirmation-row">
                  <span>Registration ID</span>
                  <strong>
                    {confirmation.registrationId}
                  </strong>
                </div>

              )}

            </div>

            {/* RETURN TO EVENTS */}

            <button
              className="primary-btn confirmation-btn"
              onClick={closeConfirmation}
            >
              Explore More Events
              <ArrowRight size={18} />
            </button>

            <p className="confirmation-footer">
              Thank you for choosing EventEase!
            </p>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;