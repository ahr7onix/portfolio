document.addEventListener('DOMContentLoaded', () => {
    // --- 1. LOADER ---
    const loader = document.getElementById("loader");
    if (loader) {
        window.addEventListener('load', () => {
            loader.style.display = "none";
        });
        // Fallback if load event already fired or takes too long
        setTimeout(() => { loader.style.display = "none"; }, 2000);
    }

    // --- 2. CUSTOM CURSOR ---
    const cursor = document.createElement("div");
    cursor.classList.add("custom-cursor");
    document.body.appendChild(cursor);

    document.addEventListener("mousemove", e => {
        requestAnimationFrame(() => {
            cursor.style.left = e.clientX + "px";
            cursor.style.top = e.clientY + "px";
        });
    });

    // --- 3. SCROLL REVEAL ---
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) e.target.classList.add("active");
        });
    }, { threshold: 0.1 });

    document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

    // --- 4. LANDING PAGE COUNTERS ---
    const counters = document.querySelectorAll("[data-target]");
    if (counters.length > 0) {
        counters.forEach(el => {
            let count = 0;
            const target = +el.dataset.target;

            const update = () => {
                count += target / 50;
                if (count < target) {
                    el.innerText = Math.floor(count);
                    requestAnimationFrame(update);
                } else {
                    el.innerText = target + "%";
                }
            };
            
            // Only start counting when in view
            const obs = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    update();
                    obs.unobserve(el);
                }
            });
            obs.observe(el);
        });
    }

    // --- 5. LANDING PAGE ANALYTICS (Conditional) ---
    const usersEl = document.getElementById("users");
    const revenueEl = document.getElementById("revenue");
    const conversionEl = document.getElementById("conversion");
    const chartCtx = document.getElementById("analyticsChart");

    // Check if we are on the Landing Page (to avoid conflict with Dashboard)
    // We check for 'hero' class which only exists on Landing Page
    const isLandingPage = document.querySelector('.hero') !== null;

    if (isLandingPage && (usersEl || revenueEl || conversionEl || chartCtx)) {
        let usersValue = 120;
        let revenueValue = 3200;
        let conversionValue = 3.2;

        const updateStats = () => {
            usersValue += Math.floor(Math.random() * 5);
            revenueValue += Math.floor(Math.random() * 100);
            conversionValue = (Math.random() * 5 + 2).toFixed(1);

            if (usersEl) usersEl.innerText = usersValue;
            if (revenueEl) revenueEl.innerText = "R$ " + revenueValue;
            if (conversionEl) conversionEl.innerText = conversionValue + "%";
        };

        setInterval(updateStats, 2000);

        if (chartCtx && typeof Chart !== 'undefined') {
            new Chart(chartCtx, {
                type: "line",
                data: {
                    labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
                    datasets: [{
                        label: "Crescimento",
                        data: [10, 25, 40, 30, 60, 80],
                        borderColor: "#6366f1",
                        backgroundColor: "rgba(99, 102, 241, 0.1)",
                        fill: true,
                        borderWidth: 3,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { display: false },
                        y: { display: false }
                    }
                }
            });
        }
    }

    // --- 6. COUNTDOWN TIMER ---
    let time = 300;
    const timer = document.getElementById("timer");

    if (timer) {
        setInterval(() => {
            let min = Math.floor(time / 60);
            let sec = time % 60;

            timer.innerText = 
                `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;

            if (time > 0) time--;
        }, 1000);
    }
});
