const container = document.getElementById("container");
const registerBtn = document.getElementById("register");
const loginBtn = document.getElementById("logintoggle");

// Toggle Panels
registerBtn.addEventListener("click", () => container.classList.add("active"));
loginBtn.addEventListener("click", () => container.classList.remove("active"));


// ---------- Helper Functions ----------
function showError(inputEl, message) {
    inputEl.classList.add("error");

    if (inputEl.nextElementSibling && inputEl.nextElementSibling.classList.contains("error-text")) {
        inputEl.nextElementSibling.remove();
    }

    let errorMsg = document.createElement("div");
    errorMsg.classList.add("error-text");
    errorMsg.innerText = message;
    inputEl.insertAdjacentElement("afterend", errorMsg);

    inputEl.classList.add("shake");
    setTimeout(() => inputEl.classList.remove("shake"), 300);
}

function clearError(inputEl) {
    inputEl.classList.remove("error");
    if (inputEl.nextElementSibling && inputEl.nextElementSibling.classList.contains("error-text")) {
        inputEl.nextElementSibling.remove();
    }
}


// ---------- LOGIN ----------
const loginForm = document.querySelector(".sign-in form");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = loginForm.querySelector('input[type="email"]');
    const password = loginForm.querySelector('input[type="password"]');

    clearError(email);
    clearError(password);

    if (email.value.trim() === "") return showError(email, "Email is required");
    if (password.value.trim() === "") return showError(password, "Password is required");

    try {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.value, password: password.value })
        });

        const data = await res.json();

        if (!res.ok) {
            showError(password, data.message || "Invalid login");
            return;
        }

        // Save token
        localStorage.setItem("token", data.token);

        // Redirect
        window.location.href = "dashboard.html";

    } catch (err) {
        showError(password, "Server error");
    }
});


// ---------- SIGNUP ----------
const signupForm = document.querySelector(".sign-up form");

signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = signupForm.querySelector('input[type="text"]');
    const email = signupForm.querySelector('input[type="email"]');
    const password = signupForm.querySelector('input[type="password"]');

    clearError(name);
    clearError(email);
    clearError(password);

    if (name.value.trim() === "") return showError(name, "Name is required");
    if (email.value.trim() === "") return showError(email, "Email is required");
    if (password.value.trim() === "") return showError(password, "Password is required");

    try {
        const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: name.value,
                email: email.value,
                password: password.value
            })
        });

        const data = await res.json();

        if (!res.ok) {
            showError(email, data.message || "Signup failed");
            return;
        }

        alert("Account created! Please login.");

        container.classList.remove("active"); // Move to login screen

    } catch (err) {
        showError(password, "Server error");
    }
});
