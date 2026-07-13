
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Settings page initialized");

    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');

    if (!usernameInput || !emailInput) {
        console.warn("Settings inputs not found");
        return;
    }

    try {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("No token found, redirecting to login");
            window.location.href = "login.html";
            return;
        }

        const res = await fetch("/api/auth/me", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
            const user = await res.json();
            usernameInput.value = user.name || "";
            emailInput.value = user.email || "";
            console.log("User profile loaded");
        } else {
            console.error("Failed to fetch user profile", res.status);
            if (res.status === 401) {
                window.location.href = "login.html";
            }
        }
    } catch (err) {
        console.error("Error loading profile:", err);
    }


});
