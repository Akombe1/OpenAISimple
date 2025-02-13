document.addEventListener("DOMContentLoaded", () => {
    let assistantId = null;
    let threadId = null;

    const statusDiv = document.getElementById("status");
    const chatBox = document.getElementById("chatBox");

    function updateStatus(message) {
        statusDiv.innerText = message;
    }

    document.getElementById("createAssistantBtn").addEventListener("click", async () => {
        updateStatus("Checking/Creating Assistant...");

        const assistantName = document.getElementById("assistantName").value;
        const systemMessage = document.getElementById("systemMessage").value;
        const model = document.getElementById("modelSelect").value;

        const response = await fetch("/assistant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assistantName, systemMessage, model }),
        });

        const data = await response.json();
        assistantId = data.assistantId;
        updateStatus(data.status);
    });

    document.getElementById("newThreadBtn").addEventListener("click", async () => {
        updateStatus("Creating a new thread...");
        chatBox.innerHTML = ""; // Clear previous messages

        const response = await fetch("/thread", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();
        threadId = data.threadId;
        updateStatus(data.status);
    });

    document.getElementById("runBtn").addEventListener("click", async () => {
        updateStatus("Sending message to Assistant...");

        const userPrompt = document.getElementById("userPrompt").value;

        const response = await fetch("/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ threadId, userPrompt }),
        });

        const data = await response.json();
        updateStatus(data.status);

        // Add user prompt to chat window
        chatBox.innerHTML += `<p class="user-msg"><strong>You:</strong> ${userPrompt}</p>`;

        // Process and display assistant messages
        data.messages.reverse().forEach((msg) => {
            const roleClass =
                msg.role === "user" ? "user-msg" :
                msg.role === "assistant" ? "assistant-msg" :
                "system-msg";

            let messageText = "";

            // Extract structured response correctly
            if (Array.isArray(msg.content)) {
                messageText = msg.content
                    .filter(part => part.type === "text")
                    .map(part => part.text.value)
                    .join(" ");
            } else if (typeof msg.content === "string") {
                messageText = msg.content;
            } else {
                messageText = "[Unsupported message format]";
            }

            chatBox.innerHTML += `<p class="${roleClass}"><strong>${msg.role}:</strong> ${messageText}</p>`;
        });

        chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to latest message
    });

    document.getElementById("toggleThemeBtn").addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
    });
});