document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const tabBtns = document.querySelectorAll(".tab-btn");

    // --- Tab Switcher Logic ---
    window.switchTab = (tab) => {
        const loginForm = document.getElementById("loginForm");
        const registerForm = document.getElementById("registerForm");
        const tabBtns = document.querySelectorAll(".tab-btn");

        if (tab === 'login') {
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
            tabBtns[0].classList.add('active');
            tabBtns[1].classList.remove('active');
        } else {
            loginForm.classList.remove('active');
            registerForm.classList.add('active');
            tabBtns[0].classList.remove('active');
            tabBtns[1].classList.add('active');
        }
    };

    // --- Login Logic ---
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPassword").value;
            const errorEl = document.getElementById("loginError");

            // 1. Check default admin
            if (email === "admin@nexus.com" && password === "123456") {
                localStorage.setItem("auth", "true");
                window.location.href = "dashboard.html";
                return;
            }

            // 2. Check registered users in localStorage
            const users = JSON.parse(localStorage.getItem("users") || "[]");
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                localStorage.setItem("auth", "true");
                localStorage.setItem("userName", user.name);
                window.location.href = "dashboard.html";
            } else {
                showError(errorEl, "Credenciais inválidas.");
            }
        });
    }

    // --- Registration Logic ---
    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("regName").value;
            const email = document.getElementById("regEmail").value;
            const password = document.getElementById("regPassword").value;
            const confirm = document.getElementById("regConfirm").value;
            const errorEl = document.getElementById("regError");

            if (password !== confirm) {
                showError(errorEl, "As senhas não coincidem.");
                return;
            }

            const users = JSON.parse(localStorage.getItem("users") || "[]");
            if (users.find(u => u.email === email)) {
                showError(errorEl, "Este email já está cadastrado.");
                return;
            }

            // SAVE NEW USER
            users.push({ name, email, password });
            localStorage.setItem("users", JSON.stringify(users));

            // Feedback and Switch
            alert("Conta criada com sucesso! Agora você pode fazer login.");
            switchTab('login');
        });
    }

    function showError(el, msg) {
        el.innerText = msg;
        el.style.color = "#ff4b4b";
        const box = document.querySelector('.auth-box');
        box.classList.add('shake');
        setTimeout(() => box.classList.remove('shake'), 400);
    }
});
