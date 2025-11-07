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

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        // build activity card
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // basic info
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // participants title
        const participantsTitle = document.createElement("h5");
        participantsTitle.className = "participants-title";
        participantsTitle.textContent = "Participants";

        // participants container (either a ul list or an empty message)
        const participantsContainer = document.createElement("div");
        if (details.participants && details.participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            // email label
            const span = document.createElement("span");
            span.className = "email-label";
            span.textContent = p;

            // delete button
            const delBtn = document.createElement("button");
            delBtn.className = "delete-btn";
            delBtn.title = "Unregister participant";
            delBtn.setAttribute("data-activity", name);
            delBtn.setAttribute("data-email", p);
            delBtn.innerHTML = "&times;"; // simple X icon

            li.appendChild(span);
            li.appendChild(delBtn);
            ul.appendChild(li);
          });
          participantsContainer.appendChild(ul);
        } else {
          const p = document.createElement("p");
          p.className = "no-participants";
          p.textContent = "No participants yet — be the first!";
          participantsContainer.appendChild(p);
        }

        activityCard.appendChild(participantsTitle);
        activityCard.appendChild(participantsContainer);

  activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
      
      // delegate delete button clicks for unregistering participants
      activitiesList.addEventListener("click", async (ev) => {
        const btn = ev.target.closest && ev.target.closest(".delete-btn");
        if (!btn) return;

        const activityName = btn.getAttribute("data-activity");
        const email = btn.getAttribute("data-email");

        if (!activityName || !email) return;

        if (!confirm(`Unregister ${email} from ${activityName}?`)) return;

        try {
          const res = await fetch(
            `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
            { method: "DELETE" }
          );

          if (res.ok) {
            // re-fetch activities to refresh the UI
            fetchActivities();
          } else {
            const data = await res.json().catch(() => ({}));
            alert(data.detail || "Failed to unregister participant");
          }
        } catch (err) {
          console.error("Error unregistering:", err);
          alert("Failed to unregister participant. See console for details.");
        }
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
