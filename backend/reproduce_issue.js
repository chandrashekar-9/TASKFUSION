// using native fetch
const run = async () => {
    try {
        const email = "test" + Date.now() + "@example.com";
        const password = "password123";

        console.log("--> Signup");
        let res = await fetch("http://localhost:5000/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Test", email, password })
        });
        console.log("Signup status:", res.status);

        console.log("--> Login");
        res = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const loginData = await res.json();
        console.log("Login status:", res.status);

        if (!loginData.token) {
            console.error("No token!", loginData);
            return;
        }
        const token = loginData.token;

        console.log("--> Generate AI");
        res = await fetch("http://localhost:5000/api/ai/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ prompt: "Hello AI" })
        });
        console.log("Generate status:", res.status);
        const genData = await res.json();
        console.log("Generate Message:", genData.message);
        if (genData.result) console.log("Result preview:", genData.result.substring(0, 50));
        if (genData.error) console.log("Error detail:", genData.error);

    } catch (e) {
        console.error("Test Script Error:", e);
    }
};

run();
