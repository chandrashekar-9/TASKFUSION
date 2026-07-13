const run = async () => {
    try {
        const email = "async_test_" + Date.now() + "@example.com";
        const password = "password123";

        console.log("--> Signup/Login");
        let res = await fetch("http://localhost:5000/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Async Test", email, password })
        });

        // If signup fails (user exists), try login
        res = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const loginData = await res.json();
        const token = loginData.token;
        if (!token) throw new Error("Login failed");

        console.log("--> Submit Async Task");
        res = await fetch("http://localhost:5000/api/ai/generate-async", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ prompt: "What is 2+2?" })
        });

        const genData = await res.json();
        console.log("Queue Response:", genData);

        const taskId = genData.taskId;
        if (!taskId) throw new Error("No taskId returned");

        console.log("--> Polling Status...");
        while (true) {
            const statusRes = await fetch(`http://localhost:5000/api/ai/status/${taskId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const statusData = await statusRes.json();
            console.log("Status:", statusData.status);

            if (statusData.status === 'completed') {
                console.log("Task Completed! Result:", statusData.result);
                break;
            } else if (statusData.status === 'failed') {
                console.log("Task Failed!", statusData.error);
                break;
            }

            await new Promise(r => setTimeout(r, 1000));
        }

    } catch (e) {
        console.error("Async Test Error:", e);
    }
};

run();
