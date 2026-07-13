// 🔵 LOGOUT BUTTON → BACK TO LOGIN PAGE
function logout() {
    window.location.href = "login.html";
}

// 🌓 THEME SWITCHING LOGIC
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
    }
}

function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);

    if (themeToggleInput) {
        themeToggleInput.checked = (newTheme === 'dark');
    }
}

const themeToggleInput = document.getElementById('themeToggle');

document.addEventListener('DOMContentLoaded', () => {
    console.log("Dashboard initialized");

    // Initialize Theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    const themeToggleInput = document.getElementById('themeToggle');
    if (themeToggleInput) {
        themeToggleInput.checked = (savedTheme === 'dark');
    }

    // DOM Elements
    const submitBtn = document.getElementById("submitBtn");
    const promptInput = document.getElementById("promptInput");
    const outputBox = document.getElementById("taskOutput");
    const statusText = document.getElementById("statusText");
    const historyList = document.getElementById("historyList");

    // Modal Elements
    const modal = document.getElementById("deleteModal");
    const confirmBtn = document.getElementById("confirmDeleteBtn");
    const cancelBtn = document.getElementById("cancelDeleteBtn");
    let taskToDeleteId = null;

    let taskCounter = 0;

    // --- FUNCTIONS ---

    function showDeleteModal(id) {
        taskToDeleteId = id;
        if (modal) modal.style.display = "flex";
    }

    function hideModal() {
        if (modal) modal.style.display = "none";
        taskToDeleteId = null;
    }

    // Load History Function
    async function loadHistory() {
        if (!historyList) return;
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch("/api/ai/history", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const tasks = await res.json();

            historyList.innerHTML = "";

            if (Array.isArray(tasks)) {
                tasks.forEach(task => {
                    const item = document.createElement("div");
                    item.className = "task-item";

                    // Click to View Result
                    item.onclick = () => {
                        if (statusText) statusText.textContent = "Viewing past task...";
                        if (outputBox) {
                            outputBox.style.display = "block";
                            outputBox.textContent = `AI Generated Response (History):\n---\n${task.result || "No result stored."}`;
                        }
                        // Optional: fill prompt
                        if (promptInput) promptInput.value = task.prompt;
                    };

                    const content = document.createElement("span");
                    content.textContent = `Task - ${task.prompt ? task.prompt.slice(0, 15) : 'Unknown'}... (${task.status})`;

                    const deleteBtn = document.createElement("button");
                    deleteBtn.innerHTML = "&times;";
                    deleteBtn.className = "delete-btn";
                    deleteBtn.title = "Delete Task";

                    deleteBtn.onclick = (e) => {
                        e.stopPropagation();
                        showDeleteModal(task._id);
                    };

                    item.appendChild(content);
                    item.appendChild(deleteBtn);
                    historyList.appendChild(item);
                });
            }

        } catch (err) {
            console.error("Failed to load history", err);
        }
    }

    // AI Task Processing
    // AI Task Processing (Async with Polling)
    async function processAITask(prompt) {
        const token = localStorage.getItem("token");
        if (!token) return "Error: Please login first.";

        try {
            if (statusText) statusText.textContent = "Queueing task...";

            // 1. Submit to Queue (Async)
            const res = await fetch("/api/ai/generate-async", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ prompt })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to queue task");

            const taskId = data.taskId;
            if (statusText) statusText.textContent = "Processing shortly...";

            // 2. Poll for Status
            return await new Promise((resolve, reject) => {
                const interval = setInterval(async () => {
                    try {
                        const statusRes = await fetch(`/api/ai/status/${taskId}`, {
                            headers: { "Authorization": `Bearer ${token}` }
                        });
                        const taskData = await statusRes.json();

                        if (taskData.status === 'completed') {
                            clearInterval(interval);
                            loadHistory(); // Refresh history
                            resolve(`AI Generated Response:\n---\n${taskData.result}`);
                        } else if (taskData.status === 'failed') {
                            clearInterval(interval);
                            reject(new Error(taskData.error || "Task failed"));
                        } else {
                            if (statusText) statusText.textContent = `Processing... (${taskData.status})`;
                        }
                    } catch (pollErr) {
                        clearInterval(interval);
                        reject(pollErr);
                    }
                }, 2000); // Poll every 2 seconds
            });

        } catch (err) {
            return `Error: ${err.message}`;
        }
    }

    // --- EVENT LISTENERS ---

    if (cancelBtn) cancelBtn.onclick = hideModal;

    if (confirmBtn) confirmBtn.onclick = async () => {
        if (!taskToDeleteId) return;

        const token = localStorage.getItem("token");
        try {
            const delRes = await fetch(`/api/ai/history/${taskToDeleteId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (delRes.ok) {
                loadHistory();
                hideModal();
            } else {
                alert("Failed to delete task");
            }
        } catch (err) {
            console.error("Delete error", err);
        }
    };

    window.onclick = (event) => {
        if (modal && event.target == modal) {
            hideModal();
        }
    };

    if (submitBtn) {
        console.log("Submit button found, attaching listener");

        // Handle Enter Key
        if (promptInput) {
            promptInput.addEventListener("keydown", (event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault(); // Prevent new line
                    submitBtn.click();
                }
            });

            // Auto-clear on click
            promptInput.addEventListener("click", () => {
                promptInput.value = "";
            });
        }

        submitBtn.addEventListener("click", async () => {
            console.log("Submit button clicked");
            const prompt = promptInput.value.trim();
            if (!prompt) {
                if (statusText) statusText.textContent = "Please enter a prompt to run the task.";
                return;
            }

            taskCounter++;
            if (statusText) statusText.textContent = "Processing...";
            if (outputBox) outputBox.style.display = "none";

            const result = await processAITask(prompt);

            if (statusText) statusText.textContent = "Task Completed ✔";
            if (outputBox) {
                outputBox.textContent = result;
                outputBox.style.display = "block";
            }
        });
    } else {
        console.warn("Submit button not found");
    }

    // Initial Load
    loadHistory();
});