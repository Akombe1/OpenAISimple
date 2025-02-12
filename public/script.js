document.addEventListener("DOMContentLoaded", () => {
    let thread = [];

    document.getElementById("runBtn").addEventListener("click", async () => {
        const systemMessage = document.getElementById("systemMessage").value;
        const userPrompt = document.getElementById("userPrompt").value;
        const model = document.getElementById("modelSelect").value;

        if (!userPrompt.trim()) {
            alert("Please enter a prompt.");
            return;
        }

        const responseBox = document.getElementById("chatBox");

        // Add user message
        responseBox.innerHTML += `<p class="user-msg"><strong>You:</strong> ${userPrompt}</p>`;
        responseBox.scrollTop = responseBox.scrollHeight;

        try {
            const response = await fetch("/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ systemMessage, prompt: userPrompt, model, thread }),
            });

            const data = await response.json();
            thread = data.updatedThread;

            // Add assistant message
            responseBox.innerHTML += `<p class="assistant-msg"><strong>AI:</strong> ${data.response.content}</p>`;
            responseBox.scrollTop = responseBox.scrollHeight;

        } catch (error) {
            console.error("Error:", error);
            responseBox.innerHTML += `<p class="text-danger">Error fetching response</p>`;
        }
    });

    document.getElementById("newThreadBtn").addEventListener("click", () => {
        thread = [];
        document.getElementById("chatBox").innerHTML = "";
    });

    document.getElementById("toggleThemeBtn").addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
    });
});
