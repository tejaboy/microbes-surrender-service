async function fetchLogs() {
    const apiKey = document.getElementById("apiKey").value.trim();
    if (!apiKey) {
        alert("Please enter an API key.");
        return;
    }

    let to = null;
    let allFilteredLogs = {};
    let stopFetching = false;
    let requestCount = 0;
    let totalMoneyEarned = 0;

    const progressElement = document.getElementById("progress");
    const moneyElement = document.getElementById("totalMoneyEarned");
    const outputElement = document.getElementById("output");

    progressElement.textContent = "Fetching logs...";
    moneyElement.textContent = `Total Money Earned: $0`;

    while (!stopFetching) {
        requestCount++;
        let url = `https://api.torn.com/user/?selections=log&key=${apiKey}&comment=SurrService`;
        if (to) url += `&to=${to}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (!data.log) {
                outputElement.textContent = "Invalid response or no logs found.";
                return;
            }

            let timestamps = [];

            for (const [key, log] of Object.entries(data.log)) {
                if (log.log === 5350) {
                    stopFetching = true;
                    break;
                }

                if (log.log === 9015) {
                    const moneyGained = log.data.money_gained || 0;
                    allFilteredLogs[key] = {
                        log: log.log,
                        title: log.title,
                        money_gained: moneyGained
                    };
                    totalMoneyEarned += moneyGained;
                }

                timestamps.push(log.timestamp);
            }

            if (stopFetching || timestamps.length === 0) break;

            to = Math.min(...timestamps) + 1;

            // Update UI
            outputElement.innerHTML = `<code>${JSON.stringify(allFilteredLogs, null, 2)}</code>`;
            progressElement.textContent = `Requests made: ${requestCount}`;
            moneyElement.textContent = `Total Money Earned: $${totalMoneyEarned.toLocaleString()}`;

            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            outputElement.textContent = "Error fetching data: " + error;
            break;
        }
    }

    progressElement.textContent = "Fetching stopped.";
}
