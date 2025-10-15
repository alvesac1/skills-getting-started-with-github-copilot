document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

  // Clear loading message
  activitiesList.innerHTML = "";
  // Reset activity dropdown to avoid duplicate options when re-rendering
  activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Participants list HTML
        let participantsHTML = "";
        if (details.participants.length > 0) {
          participantsHTML = `
            <div class="participants-section">
              <strong>Participants:</strong>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li class="participant-item" data-activity="${encodeURIComponent(
                        name
                      )}" data-email="${encodeURIComponent(email)}">
                        <span class="participant-email">${email}</span>
                        <button class="participant-delete" title="Unregister">\u{1F5D1}</button>
                      </li>`
                  )
                  .join("")}
              </ul>
            </div>
          `;
        } else {
          participantsHTML = `
            <div class="participants-section">
              <strong>Participants:</strong>
              <p class="no-participants">No one has signed up yet!</p>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Attach delete handlers for participant delete buttons
      document.querySelectorAll(".participant-delete").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const li = e.currentTarget.closest(".participant-item");
          if (!li) return;
          const activityName = decodeURIComponent(li.dataset.activity);
          const email = decodeURIComponent(li.dataset.email);

          // compute sibling count before removing the element from the DOM
          const participantsListEl = li.parentElement; // the <ul>
          const siblings = participantsListEl ? participantsListEl.querySelectorAll(".participant-item") : [];

          try {
            const resp = await fetch(
              `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(
                email
              )}`,
              { method: "DELETE" }
            );

            if (resp.ok) {
              // if this was the last participant, refresh the full list to show placeholder
              if (siblings.length === 1) {
                // refresh full list
                fetchActivities();
              } else {
                // otherwise just remove the list item
                li.remove();
              }
            } else {
              const data = await resp.json().catch(() => ({}));
              console.error("Failed to unregister:", data.detail || resp.statusText);
              alert(data.detail || "Failed to unregister participant");
            }
          } catch (err) {
            console.error("Error unregistering participant:", err);
            alert("Error unregistering participant");
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the new participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
