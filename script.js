document.addEventListener("DOMContentLoaded", () => {
    const apiKeyInput = document.getElementById("apiKey");
    const rememberCheckbox = document.getElementById("rememberApi");

    // Load saved API key if available
    const savedApiKey = localStorage.getItem("apiKey");
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
        rememberCheckbox.checked = true;
        M.updateTextFields();
    }
});

async function fetchLogs() {
    const apiKeyInput = document.getElementById("apiKey");
    const rememberCheckbox = document.getElementById("rememberApi");
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
        alert("Please enter an API key.");
        return;
    }

    if (rememberCheckbox.checked) {
        localStorage.setItem("apiKey", apiKey);
    }

    let to = null;
    let allFilteredLogs = {};
    let stopFetching = false;
    let requestCount = 0;
    let totalMoneyEarned = 0;

    const statusElement = document.getElementById("status");
    const progressElement = document.getElementById("progress");
    const moneyElement = document.getElementById("totalMoneyEarned");
    const outputElement = document.getElementById("output");

    statusElement.textContent = "Fetching logs...";
    moneyElement.textContent = `Total Money Earned: $0`;

    while (!stopFetching) {
        requestCount++;
        let url = `https://api.torn.com/user/?selections=log&key=${apiKey}&comment=SurrService`;
        if (to) url += `&to=${to}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (!data.log) {
                outputElement.textContent = "Invalid response or no logs found. Is it Full Access API key?";
                return;
            }

            let timestamps = [];

            for (const [key, log] of Object.entries(data.log)) {
                // Handle log 5350 and show its full object
                if (log.log === 5350) {
                    stopFetching = true;

                    const timeDiff = Math.floor(Date.now() / 1000) - log.timestamp; // in seconds
                    const daysAgo = Math.floor(timeDiff / 86400); // Calculate number of days
                    statusElement.innerHTML = `Completed! You were last jailed ${daysAgo} days ago. You have an estimated arrest value of <u>$${parseInt(totalMoneyEarned * 0.1).toLocaleString()}</u>.`;

                    allFilteredLogs[key] = {
                        log: log.log,
                        title: log.title,
                        timestamp: log.timestamp,
                        category: log.category,
                        time: log.data.time,
                        reason: log.data.reason,
                    };

                    outputElement.innerHTML = `<code>${JSON.stringify(allFilteredLogs, null, 2)}</code>`;
                    progressElement.textContent = `Requests made: ${requestCount}`;
                    moneyElement.textContent = `Total Money Earned: $${totalMoneyEarned.toLocaleString()}`;
                    break;
                }

                if (log.log === 9015 || log.log === 5720) {
                    const moneyGained = log.data.money_gained || 0;
                    if (!allFilteredLogs[key]) {
                        allFilteredLogs[key] = {
                            log: log.log,
                            title: log.title,
                            money_gained: moneyGained
                        };
                        totalMoneyEarned += moneyGained;
                    }
                }

                timestamps.push(log.timestamp);
            }

            if (stopFetching || timestamps.length === 0) break;

            to = Math.min(...timestamps) + 1;

            // Update UI
            outputElement.innerHTML = `<code>${JSON.stringify(allFilteredLogs, null, 2)}</code>`;
            progressElement.textContent = `Requests made: ${requestCount}`;
            moneyElement.textContent = `Total Money Earned: $${totalMoneyEarned.toLocaleString()}`;

            await new Promise(resolve => setTimeout(resolve, 600));
        } catch (error) {
            outputElement.textContent = "Error fetching data: " + error;
            break;
        }
    }
}
