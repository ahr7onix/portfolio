// PROTEÇÃO DE ROTA (Mockup)
if (localStorage.getItem("auth") !== "true") {
    window.location.href = "login.html";
}

// LOGOUT LOGIC
function logout() {
    localStorage.removeItem("auth");
    window.location.href = "login.html";
}

document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on dashboard page
    const isDashboard = document.querySelector('.dashboard-page') !== null;
    if (!isDashboard) return;

    const userName = localStorage.getItem("userName") || "Admin";
    const welcomeHeader = document.querySelector('header h1');
    if (welcomeHeader) welcomeHeader.innerText = `Bem-vindo, ${userName}. 👋`;
    
    // --- DASHBOARD STATS ---
    const usersEl = document.getElementById("users");
    const revenueEl = document.getElementById("revenue");
    const conversionEl = document.getElementById("conversion");

    let dUsers = 1540;
    let dRevenue = 12400;
    let dConversion = 4.2;

    const updateDashboardStats = () => {
        dUsers += Math.floor(Math.random() * 8);
        dRevenue += Math.floor(Math.random() * 150);
        dConversion = (Math.random() * 2 + 3.5).toFixed(1);

        if (usersEl) usersEl.innerText = dUsers.toLocaleString();
        if (revenueEl) revenueEl.innerText = "R$ " + dRevenue.toLocaleString();
        if (conversionEl) conversionEl.innerText = dConversion + "%";
    };

    updateDashboardStats();
    setInterval(updateDashboardStats, 3000);

    // --- DASHBOARD CHART ---
    const dChartCtx = document.getElementById("analyticsChart");
    if (dChartCtx && typeof Chart !== 'undefined') {
        new Chart(dChartCtx, {
            type: "line",
            data: {
                labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
                datasets: [{
                    label: "Receita Mensal",
                    data: [1200, 4500, 3200, 8900, 7500, 11400],
                    borderColor: "#6366f1",
                    backgroundColor: "rgba(99, 102, 241, 0.1)",
                    fill: true,
                    borderWidth: 3,
                    tension: 0.4,
                    pointBackgroundColor: "#6366f1",
                    pointBorderColor: "#fff",
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: "rgba(15, 23, 42, 0.9)",
                        titleFont: { family: 'Outfit', size: 14 },
                        bodyFont: { family: 'Inter', size: 14 },
                        padding: 12,
                        borderColor: "rgba(99, 102, 241, 0.3)",
                        borderWidth: 1
                    }
                },
                scales: {
                    x: { 
                        grid: { display: false },
                        ticks: { color: "rgba(255,255,255,0.4)", font: { family: 'Inter' } }
                    },
                    y: { 
                        grid: { color: "rgba(255,255,255,0.05)" },
                        ticks: { color: "rgba(255,255,255,0.4)", font: { family: 'Inter' } }
                    }
                }
            }
        });
    }
});
