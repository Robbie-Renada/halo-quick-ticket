import auth from "./auth.js";

document.addEventListener("DOMContentLoaded", function () {
  // Load saved settings - removed clientSecret from check
  chrome.storage.sync.get(
    ["apiUrl", "clientId", "userId", "ticketTypeId"],
    function (items) {
      if (
        !items.apiUrl ||
        !items.clientId ||
        !items.userId ||
        !items.ticketTypeId
      ) {
        document.getElementById("status").textContent =
          "Please configure extension settings first";
        document.getElementById("status").className = "error";
        document.getElementById("createTask").disabled = true;
        return;
      }
    },
  );

  // Time input validation
  document.getElementById("timeInput").addEventListener("input", function (e) {
    let value = e.target.value;
    if (value.length === 2 && !value.includes(":")) {
      e.target.value = value + ":";
    }
    // Validate HH:MM format
    const timeRegex = /^([0-9]{1,2}):([0-9]{2})$/;
    if (value.length >= 5) {
      const match = value.match(timeRegex);
      if (match) {
        const [, hours, minutes] = match;
        if (parseInt(hours) > 23 || parseInt(minutes) > 59) {
          e.target.setCustomValidity("Invalid time format");
        } else {
          e.target.setCustomValidity("");
        }
      } else {
        e.target.setCustomValidity("Please use HH:MM format");
      }
    }
  });

  document
    .getElementById("createTask")
    .addEventListener("click", handleCreateTask);

  // Set default dates (start = today, target = tomorrow)
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Format dates for datetime-local input (YYYY-MM-DDThh:mm)
  const formatDateForInput = (date) => {
    return date.toISOString().slice(0, 16);
  };

  document.getElementById("startDate").value = formatDateForInput(now);
  document.getElementById("targetDate").value = formatDateForInput(tomorrow);

  document.querySelectorAll(".date-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const targetId = this.dataset.target;
      const value = this.dataset.value;
      const dateInput = document.getElementById(targetId);

      let date = new Date();

      switch (value) {
        case "today":
          // Keep date as is
          break;
        case "tomorrow":
          date.setDate(date.getDate() + 1);
          break;
        case "nextWeek":
          date.setDate(date.getDate() + 7);
          break;
      }

      // Format date as YYYY-MM-DD
      const formattedDate = date.toISOString().split("T")[0];
      dateInput.value = formattedDate;
    });
  });
});

async function handleCreateTask() {
  const summary = document.getElementById("summary").value;
  const details = document.getElementById("details").value;
  const timeInput = document.getElementById("timeInput").value;
  const startDate = document.getElementById("startDate").value;
  const targetDate = document.getElementById("targetDate").value;

  try {
    await createTask(summary, details, timeInput, startDate, targetDate);
    showStatus("Task created successfully!", "success");
    // Optional: Clear form after successful creation
    clearForm();
  } catch (error) {
    showStatus(`Error: ${error.message}`, "error");
  }
}

async function createTask(summary, details, timeInput, startDate, targetDate) {
  try {
    // Get the API URL from storage
    const { apiUrl, userId, ticketTypeId } = await chrome.storage.sync.get([
      "apiUrl",
      "userId",
      "ticketTypeId",
    ]);
    if (!apiUrl) {
      throw new Error(
        "API URL not configured. Please check extension settings.",
      );
    }

    // Get authentication token
    const accessToken = await auth.getAuthToken();

    const taskData = {
      summary: summary,
      details: details,
      time_budget: parseTimeInput(timeInput),
      start_date: startDate + "T00:00:00", // Add midnight time
      target_date: targetDate + "T00:00:00", // Add midnight time
      user_id: parseInt(userId),
      ticket_type_id: parseInt(ticketTypeId),
    };

    // Create the task
    const response = await fetch(`${apiUrl}api/tickets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([taskData]),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create task");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
}

function parseTimeInput(timeInput) {
  const [hours, minutes] = timeInput.split(":").map(Number);
  return (hours * 60 + minutes) * 60; // Convert to seconds
}

function showStatus(message, type = "success") {
  const status = document.getElementById("status");
  status.textContent = message;
  status.className = type;
}

function clearForm() {
  document.getElementById("summary").value = "";
  document.getElementById("details").value = "";
  document.getElementById("timeInput").value = "";
  document.getElementById("startDate").value = "";
  document.getElementById("targetDate").value = "";
}
