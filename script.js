const defaultVipDate = new Date();
defaultVipDate.setDate(defaultVipDate.getDate() + 30);

const defaultAccounts = {
    "dev": { pass: "123", role: "Developer", expiresAt: 0 },
    "vip_master": { pass: "vip2026", role: "VIP", expiresAt: defaultVipDate.getTime() },
    "player1": { pass: "game2026", role: "Standard", expiresAt: 0 }
};

let allowedAccounts = JSON.parse(localStorage.getItem('nexus_accounts')) || defaultAccounts;

function saveAccounts() {
    localStorage.setItem('nexus_accounts', JSON.stringify(allowedAccounts));
}

let currentUserRole = "Standard";
let currentUsername = "";

// Profil unik per akun dengan koin default 0
let userProfile = {
    coins: 0,
    inventory: { hint: 1, doubleScore: 1, shield: 1 },
    lastCheckin: 0,
    games: {}
};

function loadUserProfile(username) {
    currentUsername = username;
    let saved = localStorage.getItem('nexus_profile_' + username);
    if (saved) {
        try {
            userProfile = JSON.parse(saved);
        } catch(e) {
            resetDefaultProfile();
        }
    } else {
        resetDefaultProfile();
    }
}

function resetDefaultProfile() {
    userProfile = {
        coins: 0,
        inventory: { hint: 1, doubleScore: 1, shield: 1 },
        lastCheckin: 0,
        games: {}
    };
    saveUserProfile();
}

function saveUserProfile() {
    if (currentUsername) {
        localStorage.setItem('nexus_profile_' + currentUsername, JSON.stringify(userProfile));
    }
}

let timerInterval = null;
let chessGame = null;
let selectedSquare = null;

function updateCoinDisplay() {
    const coinEl = document.getElementById('coin-display');
    if (coinEl) coinEl.innerText = userProfile.coins;
    const shopCoinsEl = document.getElementById('shop-coins');
    if (shopCoinsEl) shopCoinsEl.innerText = userProfile.coins;
    saveUserProfile();
    updateCheckinUIState();
}

window.showModal = function(title, desc, icon = "✨") {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-desc').innerText = desc;
    document.getElementById('modal-icon').innerText = icon;
    document.getElementById('custom-modal').classList.remove('hidden');
    document.getElementById('custom-modal').classList.add('flex');
};

window.closeModal = function() {
    document.getElementById('custom-modal').classList.remove('flex');
    document.getElementById('custom-modal').classList.add('hidden');
};

window.goToPage = function(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    closeSideMenu();
};

window.handleLogin = function(event) {
    event.preventDefault();
    const usernameField = document.getElementById('login-username');
    const passwordField = document.getElementById('login-password');
    const usernameInput = usernameField.value.trim().toLowerCase();
    const passwordInput = passwordField.value.trim();
    const errorMsg = document.getElementById('error-msg');

    if (allowedAccounts[usernameInput] && allowedAccounts[usernameInput].pass === passwordInput) {
        errorMsg.classList.add('hidden');
        
        loadUserProfile(usernameInput);

        let acc = allowedAccounts[usernameInput];
        let expiryTime = Number(acc.expiresAt);
        
        if (expiryTime > 0 && expiryTime < new Date().getTime()) {
            if (acc.role === "VIP") acc.role = "Standard";
            acc.expiresAt = 0;
            expiryTime = 0;
            saveAccounts();
        }

        currentUserRole = acc.role;
        usernameField.value = '';
        passwordField.value = '';

        document.getElementById('user-display').innerText = usernameInput;
        const badge = document.getElementById('role-badge');
        badge.innerText = currentUserRole;
        
        const timerContainer = document.getElementById('vip-timer-container');
        const timerTitle = document.getElementById('timer-title');
        const menuRegister = document.getElementById('menu-register');
        const menuViewAccounts = document.getElementById('menu-view-accounts');
        const menuDevPanel = document.getElementById('menu-dev-panel');

        if (expiryTime > 0) {
            timerContainer.classList.remove('hidden');
            timerTitle.innerHTML = currentUserRole === "VIP" ? '<span>👑</span> Status: VIP Elite Aktif' : '<span>👤</span> Status: Member Berlangganan Aktif';
            displayExpiryDate(expiryTime);
        } else {
            timerContainer.classList.add('hidden');
            if(timerInterval) clearInterval(timerInterval);
        }

        if(currentUserRole === "Developer") {
            badge.className = "font-bold text-purple-400 bg-purple-950/50 px-2.5 py-0.5 rounded-full border border-purple-600/40 text-xs shadow-[0_0_10px_rgba(168,85,247,0.3)]";
            menuRegister.classList.remove('hidden');
            menuViewAccounts.classList.remove('hidden');
            menuDevPanel.classList.remove('hidden');
        } else if(currentUserRole === "VIP") {
            badge.className = "font-bold text-amber-400 bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-600/40 text-xs shadow-[0_0_10px_rgba(234,179,8,0.3)]";
            menuRegister.classList.remove('hidden');
            menuViewAccounts.classList.remove('hidden');
            menuDevPanel.classList.add('hidden');
        } else {
            badge.className = "font-bold text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700 text-xs";
            menuRegister.classList.add('hidden');
            menuViewAccounts.classList.add('hidden');
            menuDevPanel.classList.add('hidden');
        }

        updateCoinDisplay();
        window.goToPage('page-app');
    } else {
        errorMsg.classList.remove('hidden');
    }
};

function displayExpiryDate(expiryTime) {
    if(timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = Number(expiryTime) - now;
        if (expiryTime > 0 && distance < 0) {
            clearInterval(timerInterval);
            if (allowedAccounts[currentUsername]) {
                allowedAccounts[currentUsername].role = "Standard";
                allowedAccounts[currentUsername].expiresAt = 0;
                saveAccounts();
            }
            currentUserRole = "Standard";
            document.getElementById('countdown-text').innerText = "Masa aktif kedaluwarsa!";
            document.getElementById('role-badge').innerText = "Standard";
            document.getElementById('role-badge').className = "font-bold text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700 text-xs";
            return;
        }
        const d = new Date(expiryTime);
        document.getElementById('countdown-text').innerText = `Berlaku Sampai: ${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    }, 1000);
}

window.handleDailyCheckin = function() {
    let now = Date.now();
    let cooldown = 24 * 60 * 60 * 1000;

    if (now - userProfile.lastCheckin < cooldown) {
        let timeLeft = cooldown - (now - userProfile.lastCheckin);
        let hours = Math.floor(timeLeft / (1000 * 60 * 60));
        let minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        window.showModal("Check-in Belum Tersedia", `Anda sudah melakukan check-in hari ini. Silakan tunggu ${hours} jam ${minutes} menit lagi (1 kali per 24 jam).`, "⏳");
    } else {
        userProfile.coins += 100;
        userProfile.lastCheckin = now;
        updateCoinDisplay();
        window.showModal("Check-in Berhasil!", "Selamat! Anda mendapatkan +100 Koin Sanctuary hari ini.", "🎁");
        if (document.getElementById('content-title').innerText.includes("Check-in")) {
            window.openMenu('checkin');
        }
    }
};

function updateCheckinUIState() {
    let now = Date.now();
    let cooldown = 24 * 60 * 60 * 1000;
    let statusEl = document.getElementById('dashboard-checkin-status');
    let btnEl = document.getElementById('dashboard-checkin-btn');
    if (!statusEl) return;

    if (now - userProfile.lastCheckin < cooldown) {
        let timeLeft = cooldown - (now - userProfile.lastCheckin);
        let hours = Math.floor(timeLeft / (1000 * 60 * 60));
        let minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        statusEl.innerText = `Sudah diklaim. Bisa check-in lagi dalam ${hours}j ${minutes}m`;
        if (btnEl) {
            btnEl.innerText = "Klaim Besok";
            btnEl.className = "px-4 sm:px-5 py-2.5 bg-slate-800 text-slate-400 font-bold rounded-xl text-[11px] sm:text-xs uppercase shadow cursor-not-allowed opacity-75";
        }
    } else {
        statusEl.innerText = "Klaim koin gratis Anda hari ini!";
        if (btnEl) {
            btnEl.innerText = "Klaim Koin";
            btnEl.className = "px-4 sm:px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-extrabold rounded-xl text-[11px] sm:text-xs uppercase shadow transition";
        }
    }
}

window.handleRegisterAccount = function(event) {
    event.preventDefault();
    if (currentUserRole !== "VIP" && currentUserRole !== "Developer") {
        window.showModal("Akses Ditolak", "Anda tidak memiliki izin untuk mendaftarkan akun.", "⛔");
        window.goToPage('page-app');
        return;
    }

    const usernameInput = document.getElementById('reg-username').value.trim().toLowerCase();
    const passwordInput = document.getElementById('reg-password').value.trim();
    const targetRole = document.getElementById('reg-role').value;
    const vipTokenInput = document.getElementById('reg-viptoken').value.trim();
    const customDays = parseInt(document.getElementById('reg-days').value.trim()) || 0;
    
    const errorMsg = document.getElementById('reg-error-msg');
    const successMsg = document.getElementById('reg-success-msg');

    let validToken = (currentUserRole === "Developer") ? (vipTokenInput === "vip2026" || vipTokenInput === "123") : (vipTokenInput === "vip2026");

    if (!validToken) {
        errorMsg.classList.remove('hidden');
        successMsg.classList.add('hidden');
        return;
    }

    if (allowedAccounts[usernameInput]) {
        window.showModal("Peringatan", "Username sudah terdaftar di dalam sistem!", "⚠️");
        return;
    }

    let expiryTime = customDays > 0 ? Date.now() + (customDays * 86400000) : 0;
    allowedAccounts[usernameInput] = { pass: passwordInput, role: targetRole, expiresAt: expiryTime };
    saveAccounts();

    errorMsg.classList.add('hidden');
    successMsg.innerText = `Akun ${targetRole} (${usernameInput}) berhasil dibuat!`;
    successMsg.classList.remove('hidden');

    setTimeout(() => {
        successMsg.classList.add('hidden');
        window.goToPage('page-app');
    }, 1800);
};

window.devDeleteUser = function(username) {
    if (currentUserRole !== "Developer") return;
    if (username === 'dev') {
        window.showModal("Gagal", "Akun master developer tidak dapat dihapus!", "⛔");
        return;
    }
    if(confirm(`Hapus user "${username}"?`)) {
        delete allowedAccounts[username];
        localStorage.removeItem('nexus_profile_' + username);
        saveAccounts();
        window.openMenu('dev-panel');
    }
};

window.devExtendExpiry = function(username) {
    if (currentUserRole !== "Developer") return;
    let daysStr = prompt(`Tambah hari untuk user "${username}":`, "30");
    if(daysStr !== null) {
        let addDays = parseInt(daysStr) || 0;
        if(addDays > 0) {
            let acc = allowedAccounts[username];
            let baseTime = (acc.expiresAt > Date.now()) ? acc.expiresAt : Date.now();
            acc.expiresAt = baseTime + (addDays * 86400000);
            saveAccounts();
            window.showModal("Berhasil", `Durasi akun ${username} ditambah ${addDays} hari!`, "✅");
            window.openMenu('dev-panel');
        }
    }
};

window.toggleSideMenu = function() {
    document.getElementById('side-drawer').classList.toggle('translate-x-full');
    document.getElementById('sidebar-backdrop').classList.toggle('hidden');
};

window.closeSideMenu = function() {
    document.getElementById('side-drawer').classList.add('translate-x-full');
    document.getElementById('sidebar-backdrop').classList.add('hidden');
};

window.showAppVersion = function() {
    window.showModal("NEXUS HUB", "Versi: v10.0.0 Nexus Hub Edition\nRole Aktif: " + currentUserRole, "📦");
    window.closeSideMenu();
};

window.openMenu = function(menuType) {
    window.goToPage('page-content');
    window.closeSideMenu();
    const container = document.getElementById('dynamic-container');
    const title = document.getElementById('content-title');

    if (menuType === 'checkin') {
        title.innerText = "Check-in Harian (1x per 24 Jam)";
        let now = Date.now();
        let cooldown = 24 * 60 * 60 * 1000;
        let canClaim = (now - userProfile.lastCheckin >= cooldown);

        container.innerHTML = `
            <div class="max-w-md mx-auto w-full text-center space-y-5">
                <div class="p-6 bg-slate-900/90 border border-amber-500/30 rounded-3xl space-y-4 shadow-xl">
                    <span class="text-5xl">🎁</span>
                    <h3 class="text-lg font-black text-amber-400">Bonus Koin Harian Sanctuary</h3>
                    <p class="text-xs text-slate-300">Dapatkan <span class="text-amber-300 font-bold">+100 Koin Sanctuary</span> setiap 1 kali 24 jam untuk membeli item bantuan in-game!</p>
                    <div id="checkin-info-box" class="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300">
                        ${canClaim ? "Status: Siap Diklaim Sekarang!" : "Status: Sudah diklaim. Tunggu reset 24 jam."}
                    </div>
                    <button id="page-checkin-btn" onclick="handleDailyCheckin()" class="w-full py-3.5 ${canClaim ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 shadow-lg' : 'bg-slate-800 text-slate-400 cursor-not-allowed'} font-extrabold rounded-xl text-xs uppercase tracking-wider transition">
                        ${canClaim ? "Klaim Hadiah Harian" : "Klaim Besok"}
                    </button>
                </div>
            </div>
        `;
    } else if (menuType === 'register-account') {
        if (currentUserRole !== "VIP" && currentUserRole !== "Developer") {
            window.showModal("Akses Ditolak", "Fitur ini khusus VIP & Developer.", "⛔");
            window.goToPage('page-app');
            return;
        }
        title.innerText = "Registrasi Akun Baru";
        container.innerHTML = `
            <div class="max-w-md mx-auto w-full space-y-4">
                <form onsubmit="handleRegisterAccount(event)" class="space-y-3.5">
                    <div>
                        <label class="block text-xs font-semibold text-slate-300 mb-1 uppercase">Pilih Role</label>
                        <select id="reg-role" class="w-full px-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-white text-sm">
                            <option value="VIP">VIP Elite</option>
                            <option value="Standard">Member (Standard)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-300 mb-1 uppercase">Username Baru</label>
                        <input type="text" id="reg-username" required placeholder="Cth: player_baru" class="w-full px-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-white text-sm">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-300 mb-1 uppercase">Password</label>
                        <input type="password" id="reg-password" required placeholder="••••••••" class="w-full px-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-white text-sm">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-300 mb-1 uppercase">Hari Aktif (0 = Selamanya)</label>
                        <input type="number" id="reg-days" min="0" value="30" class="w-full px-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-white text-sm font-mono">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-300 mb-1 uppercase">Token Otorisasi</label>
                        <input type="password" id="reg-viptoken" required placeholder="Token" class="w-full px-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-white text-sm">
                    </div>
                    <p id="reg-error-msg" class="text-xs text-red-400 font-semibold hidden text-center bg-red-950/50 p-2 rounded-lg">Token salah!</p>
                    <p id="reg-success-msg" class="text-xs text-emerald-400 font-semibold hidden text-center bg-red-950/50 p-2 rounded-lg">Akun dibuat!</p>
                    <button type="submit" class="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-extrabold rounded-xl uppercase tracking-wide mt-2">Daftarkan Akun</button>
                </form>
            </div>
        `;
    } else if (menuType === 'view-accounts') {
        if (currentUserRole !== "VIP" && currentUserRole !== "Developer") {
            window.showModal("Akses Ditolak", "Akses dibatasi.", "⛔");
            window.goToPage('page-app');
            return;
        }
        title.innerText = "Direktori Akun Sanctuary";
        let html = `<div class="space-y-3"><h3 class="text-lg font-bold text-cyan-400 mb-4">📋 Daftar Akun Aktif</h3>`;
        for (let u in allowedAccounts) {
            let acc = allowedAccounts[u];
            let exp = acc.expiresAt > 0 ? new Date(acc.expiresAt).toLocaleDateString('id-ID') : "Selamanya";
            html += `<div class="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex justify-between items-center">
                <div><p class="font-bold text-white text-sm">👤 ${u}</p><p class="text-xs text-slate-400">Expired: ${exp}</p></div>
                <span class="text-xs font-bold px-3 py-1 rounded-full border">${acc.role}</span>
            </div>`;
        }
        container.innerHTML = html + `</div>`;
    } else if (menuType === 'dev-panel') {
        if (currentUserRole !== "Developer") {
            window.showModal("Akses Ditolak", "Khusus Developer.", "⛔");
            window.goToPage('page-app');
            return;
        }
        title.innerText = "Developer Control Panel";
        let html = `<div class="space-y-3"><h3 class="text-lg font-bold text-purple-400 mb-4">🛠️ Manajemen User</h3>`;
        for (let u in allowedAccounts) {
            let acc = allowedAccounts[u];
            let exp = acc.expiresAt > 0 ? new Date(acc.expiresAt).toLocaleDateString('id-ID') : "Selamanya";
            html += `<div class="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex justify-between items-center">
                <div><p class="font-bold text-white text-sm">👤 ${u} (${acc.role})</p><p class="text-xs text-slate-400">Expired: ${exp}</p></div>
                <div class="flex gap-2">
                    <button onclick="devExtendExpiry('${u}')" class="px-3 py-1 bg-amber-600/20 text-amber-300 text-xs font-bold rounded-xl border border-amber-600/50">Durasi</button>
                    ${u !== 'dev' ? `<button onclick="devDeleteUser('${u}')" class="px-3 py-1 bg-red-600/20 text-red-400 text-xs font-bold rounded-xl border border-red-600/50">Hapus</button>` : ''}
                </div>
            </div>`;
        }
        container.innerHTML = html + `</div>`;
    } else if (menuType === 'games') {
        title.innerText = "Eksklusif Game Vault";
        container.innerHTML = `
            <div class="space-y-4">
                <div class="text-center mb-4">
                    <h3 class="text-lg sm:text-xl font-black text-cyan-400">🎮 Pilih Game & Kuis Edukasi</h3>
                    <p class="text-xs text-slate-400 mt-1">Gunakan item dari Shop untuk membantu menjawab soal!</p>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div onclick="launchGamePlay('tebakkata')" class="p-4 sm:p-5 bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl cursor-pointer transition group shadow-lg flex items-center gap-4">
                        <span class="text-2xl sm:text-3xl group-hover:scale-110 transition">🧠</span>
                        <div>
                            <h4 class="font-bold text-white text-xs sm:text-sm">1. Tebak Kata</h4>
                            <p class="text-[11px] sm:text-xs text-slate-400">Asah kosa kata dengan ribuan petunjuk</p>
                        </div>
                    </div>
                    <div onclick="launchGamePlay('susunkata')" class="p-4 sm:p-5 bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl cursor-pointer transition group shadow-lg flex items-center gap-4">
                        <span class="text-2xl sm:text-3xl group-hover:scale-110 transition">🔤</span>
                        <div>
                            <h4 class="font-bold text-white text-xs sm:text-sm">2. Susun Kata</h4>
                            <p class="text-[11px] sm:text-xs text-slate-400">Susun huruf acak menjadi kata benar</p>
                        </div>
                    </div>
                    <div onclick="launchGamePlay('matematika')" class="p-4 sm:p-5 bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl cursor-pointer transition group shadow-lg flex items-center gap-4">
                        <span class="text-2xl sm:text-3xl group-hover:scale-110 transition">📐</span>
                        <div>
                            <h4 class="font-bold text-white text-xs sm:text-sm">3. Matematika</h4>
                            <p class="text-[11px] sm:text-xs text-slate-400">Latihan hitung cepat ribuan level</p>
                        </div>
                    </div>
                    <div onclick="launchGamePlay('bahasainggris')" class="p-4 sm:p-5 bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 rounded-2xl cursor-pointer transition group shadow-lg flex items-center gap-4">
                        <span class="text-2xl sm:text-3xl group-hover:scale-110 transition">🇬🇧</span>
                        <div>
                            <h4 class="font-bold text-white text-xs sm:text-sm">4. Bahasa Inggris</h4>
                            <p class="text-[11px] sm:text-xs text-slate-400">Kuis kosakata & terjemahan interaktif</p>
                        </div>
                    </div>
                    <div onclick="launchGamePlay('catur')" class="p-4 sm:p-5 bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl cursor-pointer transition group shadow-lg flex items-center gap-4">
                        <span class="text-2xl sm:text-3xl group-hover:scale-110 transition">♟️</span>
                        <div>
                            <h4 class="font-bold text-white text-xs sm:text-sm">Catur vs Bot (Hard)</h4>
                            <p class="text-[11px] sm:text-xs text-slate-400">Papan hitam putih & panduan titik putih</p>
                        </div>
                    </div>
                    <div onclick="showModal('Pemberitahuan', 'GAME SEDANG DALAM PENGEMBANGAN', '🔒')" class="p-4 sm:p-5 bg-slate-900/50 border border-red-900/40 hover:border-red-500/50 rounded-2xl cursor-pointer transition group shadow-lg flex items-center gap-4 opacity-75">
                        <span class="text-2xl sm:text-3xl group-hover:scale-110 transition">🧩</span>
                        <div>
                            <h4 class="font-bold text-red-400 text-xs sm:text-sm">Block Blast 🔒</h4>
                            <p class="text-[10px] sm:text-xs text-slate-500">GAME SEDANG DALAM PENGEMBANGAN</p>
                        </div>
                    </div>
                    <div onclick="showModal('Pemberitahuan', 'GAME SEDANG DALAM PENGEMBANGAN', '🔒')" class="p-4 sm:p-5 bg-slate-900/50 border border-red-900/40 hover:border-red-500/50 rounded-2xl cursor-pointer transition group shadow-lg flex items-center gap-4 opacity-75">
                        <span class="text-2xl sm:text-3xl group-hover:scale-110 transition">🐦</span>
                        <div>
                            <h4 class="font-bold text-red-400 text-xs sm:text-sm">Flappy Bird 🔒</h4>
                            <p class="text-[10px] sm:text-xs text-slate-500">GAME SEDANG DALAM PENGEMBANGAN</p>
                        </div>
                    </div>
                    <div onclick="showModal('Pemberitahuan', 'GAME SEDANG DALAM PENGEMBANGAN', '🔒')" class="p-4 sm:p-5 bg-slate-900/50 border border-red-900/40 hover:border-red-500/50 rounded-2xl cursor-pointer transition group shadow-lg flex items-center gap-4 opacity-75">
                        <span class="text-2xl sm:text-3xl group-hover:scale-110 transition">🐍</span>
                        <div>
                            <h4 class="font-bold text-red-400 text-xs sm:text-sm">Snake Game 🔒</h4>
                            <p class="text-[10px] sm:text-xs text-slate-500">GAME SEDANG DALAM PENGEMBANGAN</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (menuType === 'shop') {
        title.innerText = "Nexus Shop (In-Game Utility)";
        container.innerHTML = `
            <div class="space-y-4 max-w-xl mx-auto w-full">
                <div class="flex justify-between items-center bg-slate-900/90 p-3 sm:p-4 rounded-2xl border border-amber-500/30">
                    <div>
                        <p class="text-[10px] sm:text-xs text-slate-400 uppercase font-bold tracking-wider">Koin Anda</p>
                        <p class="text-lg sm:text-xl font-mono font-black text-amber-400 flex items-center gap-1.5 mt-0.5"><span>🪙</span> <span id="shop-coins">${userProfile.coins}</span> Koin</p>
                    </div>
                    <button onclick="openMenu('checkin')" class="px-3 sm:px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-[10px] sm:text-xs uppercase shadow transition">Check-in (+100)</button>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div class="p-4 sm:p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between shadow-lg">
                        <div>
                            <span class="text-2xl sm:text-3xl">💡</span>
                            <h4 class="font-bold text-white text-xs sm:text-sm mt-2">Hint Pintar</h4>
                            <p class="text-[10px] sm:text-[11px] text-slate-400 mt-1">Membuka huruf/jawaban pertama saat terjebak di game kuis.</p>
                        </div>
                        <div class="space-y-2 pt-3 border-t border-slate-800">
                            <div class="flex justify-between text-[11px] sm:text-xs font-mono text-amber-300"><span>Dimiliki: ${userProfile.inventory.hint}</span><span>50 Koin</span></div>
                            <button onclick="buyShopItem('hint', 50)" class="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold rounded-xl text-[11px] sm:text-xs uppercase shadow">Beli</button>
                        </div>
                    </div>
                    <div class="p-4 sm:p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between shadow-lg">
                        <div>
                            <span class="text-2xl sm:text-3xl">⚡</span>
                            <h4 class="font-bold text-white text-xs sm:text-sm mt-2">Double Score</h4>
                            <p class="text-[10px] sm:text-[11px] text-slate-400 mt-1">Melipatgandakan perolehan skor kuis (2x lipat) berikutnya.</p>
                        </div>
                        <div class="space-y-2 pt-3 border-t border-slate-800">
                            <div class="flex justify-between text-[11px] sm:text-xs font-mono text-cyan-300"><span>Dimiliki: ${userProfile.inventory.doubleScore}</span><span>80 Koin</span></div>
                            <button onclick="buyShopItem('doubleScore', 80)" class="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold rounded-xl text-[11px] sm:text-xs uppercase shadow">Beli</button>
                        </div>
                    </div>
                    <div class="p-4 sm:p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between shadow-lg">
                        <div>
                            <span class="text-2xl sm:text-3xl">🛡️</span>
                            <h4 class="font-bold text-white text-xs sm:text-sm mt-2">Shield Anti-Salah</h4>
                            <p class="text-[10px] sm:text-[11px] text-slate-400 mt-1">Melindungi agar skor tidak dikurangi saat jawaban salah.</p>
                        </div>
                        <div class="space-y-2 pt-3 border-t border-slate-800">
                            <div class="flex justify-between text-[11px] sm:text-xs font-mono text-emerald-300"><span>Dimiliki: ${userProfile.inventory.shield}</span><span>100 Koin</span></div>
                            <button onclick="buyShopItem('shield', 100)" class="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold rounded-xl text-[11px] sm:text-xs uppercase shadow">Beli</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (menuType === 'leaderboard') {
        title.innerText = "Global Peringkat";
        container.innerHTML = `
            <div class="max-w-md mx-auto w-full text-center my-auto flex flex-col items-center justify-center p-6">
                <div onclick="showModal('Pemberitahuan', 'GAME SEDANG DALAM PENGEMBANGAN', '🔒')" class="p-8 bg-slate-900/80 border border-red-900/40 hover:border-red-500/50 rounded-3xl space-y-4 shadow-2xl opacity-90 w-full cursor-pointer transition">
                    <span class="text-5xl">🏆🔒</span>
                    <h4 class="font-bold text-red-400 text-base">Global Leaderboard 🔒</h4>
                    <p class="text-xs text-slate-400 uppercase tracking-widest font-semibold">GAME SEDANG DALAM PENGEMBANGAN</p>
                </div>
            </div>
        `;
    } else if (menuType === 'privacy') {
        title.innerText = "Keamanan & Privasi";
        container.innerHTML = `
            <div class="space-y-4 max-w-xl mx-auto w-full text-left">
                <div class="p-6 bg-slate-900/90 border border-sky-500/30 rounded-3xl space-y-4 shadow-xl">
                    <div class="flex items-center gap-3 border-b border-slate-800 pb-3">
                        <span class="text-2xl sm:text-3xl">🔒</span>
                        <div>
                            <h3 class="text-sm sm:text-base font-black text-sky-400">Protokol Keamanan Nexus Hub</h3>
                            <p class="text-[10px] sm:text-[11px] text-slate-400">Komitmen kami dalam melindungi data dan kenyamanan bermain Anda.</p>
                        </div>
                    </div>
                    <div class="space-y-3 text-[11px] sm:text-xs text-slate-300 leading-relaxed">
                        <div class="p-3 bg-slate-950 rounded-xl border border-slate-800">
                            <p class="font-bold text-sky-300 mb-1">🛡️ Penyimpanan Lokal Terenkripsi</p>
                            <p>Progress game, koin, dan inventori shop Anda disimpan aman menggunakan enkripsi lokal browser agar tidak mudah hilang.</p>
                        </div>
                        <div class="p-3 bg-slate-950 rounded-xl border border-slate-800">
                            <p class="font-bold text-amber-300 mb-1">👑 Akses Berbasis Peran (Role)</p>
                            <p>Sistem akun (Standard, VIP, Developer) dilindungi validasi token khusus untuk menjaga eksklusivitas fitur.</p>
                        </div>
                        <div class="p-3 bg-slate-950 rounded-xl border border-slate-800">
                            <p class="font-bold text-emerald-300 mb-1">⏰ Validasi Check-in Harian</p>
                            <p>Sistem waktu nyata memastikan klaim bonus koin harian berlaku tepat 1 kali setiap 24 jam secara adil.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};

window.buyShopItem = function(itemKey, cost) {
    if (userProfile.coins >= cost) {
        userProfile.coins -= cost;
        userProfile.inventory[itemKey]++;
        updateCoinDisplay();
        window.showModal("Pembelian Sukses", `Anda berhasil membeli 1x item bantuan!`, "🛒");
        window.openMenu('shop');
    } else {
        window.showModal("Koin Tidak Cukup", "Kumpulkan lebih banyak koin dengan melakukan Check-in Harian atau bermain game edukasi!", "⚠️");
    }
};

window.launchGamePlay = function(gameName) {
    window.goToPage('page-game-play');
    const screen = document.getElementById('game-screen-container');
    const title = document.getElementById('active-game-title');

    if (gameName === 'tebakkata') {
        title.innerText = "🧠 Tebak Kata (Ribuan Soal Dinamis)";
        initTebakKata(screen);
    } else if (gameName === 'susunkata') {
        title.innerText = "🔤 Susun Kata (Anagram Interaktif)";
        initSusunKata(screen);
    } else if (gameName === 'matematika') {
        title.innerText = "📐 Kuis Matematika Cepat";
        initMatematika(screen);
    } else if (gameName === 'bahasainggris') {
        title.innerText = "🇬🇧 Kuis Bahasa Inggris (Vocabulary)";
        initBahasaInggris(screen);
    } else if (gameName === 'catur') {
        title.innerText = "♟️ Catur Klasik (Hitam Putih) vs Bot Hard";
        screen.innerHTML = `
            <div class="text-center space-y-3 w-full flex flex-col items-center">
                <p id="chess-status" class="text-[11px] sm:text-xs text-amber-300 font-mono px-2">Giliran Anda (Putih). Ketuk bidak untuk melihat titik putih langkah.</p>
                <div id="chess-board" class="grid grid-cols-8 gap-0 w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] bg-black p-2 rounded-2xl border-2 border-slate-700 shadow-xl select-none mx-auto"></div>
                <div class="flex justify-center gap-3 pt-2">
                    <button onclick="resetChessGame()" class="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs uppercase shadow">Restart Game</button>
                </div>
            </div>
        `;
        initStandardChess();
    }
};

const bankTebakKata = [
    { q: "Ibu kota negara Indonesia", a: "jakarta" },
    { q: "Hewan berleher panjang dari Afrika", a: "jerapah" },
    { q: "Alat musik tradisional Bali dari bambu yang digetarkan", a: "angklung" },
    { q: "Benda langit yang memantulkan cahaya matahari pada malam hari", a: "bulan" },
    { q: "Planet terbesar di tata surya", a: "jupiter" },
    { q: "Alat pengukur suhu tubuh", a: "termometer" }
];

function initTebakKata(container) {
    if (!userProfile.games.tebakkata) {
        userProfile.games.tebakkata = { score: 0, index: 0 };
    }
    let state = userProfile.games.tebakkata;
    
    function render() {
        let qObj = bankTebakKata[state.index % bankTebakKata.length];
        container.innerHTML = `
            <div class="max-w-md w-full space-y-4 text-center">
                <div class="flex justify-between items-center bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
                    <span class="text-amber-400 font-bold">Skor: ${state.score}</span>
                    <div class="flex gap-3">
                        <span class="text-cyan-300">💡 Hint (${userProfile.inventory.hint})</span>
                        <span class="text-amber-300">⚡ 2x (${userProfile.inventory.doubleScore})</span>
                    </div>
                </div>
                <div class="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
                    <p class="text-sm text-amber-200 font-medium">Petunjuk: "${qObj.q}"</p>
                    <input type="text" id="ans-input" placeholder="Jawaban Anda..." class="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-center text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                    <div class="flex gap-2">
                        <button onclick="useHintTebak('${qObj.a}')" class="flex-1 py-2.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold">Gunakan Hint</button>
                        <button onclick="checkTebakKata()" class="flex-2 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-extrabold rounded-xl text-xs uppercase shadow">Jawab</button>
                    </div>
                </div>
                <button onclick="resetTebakKataGame()" class="text-xs text-slate-500 hover:underline">Reset Progress</button>
            </div>
        `;
        saveUserProfile();
    }

    window.useHintTebak = function(ans) {
        if (userProfile.inventory.hint > 0) {
            userProfile.inventory.hint--;
            updateCoinDisplay();
            window.showModal("Hint Pintar Aktif", `Huruf pertama jawaban adalah: "${ans.charAt(0).toUpperCase()}"`, "💡");
            render();
        } else {
            window.showModal("Hint Habis", "Beli item Hint terlebih dahulu di Shop!", "⚠️");
        }
    };

    window.checkTebakKata = function() {
        let userAns = document.getElementById('ans-input').value.trim().toLowerCase();
        let qObj = bankTebakKata[state.index % bankTebakKata.length];
        let earned = 15;
        if (userAns === qObj.a) {
            if (userProfile.inventory.doubleScore > 0) {
                userProfile.inventory.doubleScore--;
                earned *= 2;
                window.showModal("Double Score Aktif!", "Poin Anda digandakan 2x lipat!", "⚡");
            }
            state.score += earned;
            userProfile.coins += 10;
            state.index++;
            updateCoinDisplay();
            window.showModal("Jawaban Benar!", `Hebat! Anda mendapatkan +${earned} Poin & +10 Koin Sanctuary.`, "🎉");
            render();
        } else {
            if (userProfile.inventory.shield > 0) {
                userProfile.inventory.shield--;
                updateCoinDisplay();
                window.showModal("Shield Melindungi!", "Jawaban salah, namun Shield aktif sehingga skor aman.", "🛡️");
            } else {
                window.showModal("Kurang Tepat", "Coba pikirkan lagi atau gunakan Hint!", "❌");
            }
        }
    };

    window.resetTebakKataGame = function() {
        userProfile.games.tebakkata = { score: 0, index: 0 };
        state = userProfile.games.tebakkata;
        render();
    };

    render();
}

const bankSusunKata = ["kamera", "sekolah", "komputer", "buku", "jendela", "matahari"];

function initSusunKata(container) {
    if (!userProfile.games.susunkata) {
        userProfile.games.susunkata = { score: 0, index: 0 };
    }
    let state = userProfile.games.susunkata;

    function getScrambledWord(word) {
        let arr = word.split('');
        for (let i = arr.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        let scrambled = arr.join('');
        return scrambled === word ? getScrambledWord(word) : scrambled;
    }

    let currentWord = bankSusunKata[state.index % bankSusunKata.length];
    let scrambledWord = getScrambledWord(currentWord);

    function render() {
        currentWord = bankSusunKata[state.index % bankSusunKata.length];
        scrambledWord = getScrambledWord(currentWord);

        container.innerHTML = `
            <div class="max-w-md w-full space-y-4 text-center">
                <div class="flex justify-between items-center bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
                    <span class="text-cyan-400 font-bold">Skor: ${state.score}</span>
                    <span class="text-slate-400">Soal ke-${state.index + 1}</span>
                </div>
                <div class="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
                    <p class="text-xs text-slate-400">Susunlah huruf acak berikut:</p>
                    <p class="text-2xl font-black text-cyan-300 font-mono tracking-widest uppercase bg-slate-950 py-3 rounded-xl border border-slate-800">${scrambledWord}</p>
                    <input type="text" id="susun-input" placeholder="Jawaban..." class="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-center text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    <button onclick="checkSusunKata('${currentWord}')" class="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-extrabold rounded-xl text-xs uppercase shadow">Periksa Jawaban</button>
                </div>
                <button onclick="resetSusunKataGame()" class="text-xs text-slate-500 hover:underline">Reset Progress</button>
            </div>
        `;
        saveUserProfile();
    }

    window.checkSusunKata = function(ans) {
        let userAns = document.getElementById('susun-input').value.trim().toLowerCase();
        let earned = 20;
        if (userAns === ans) {
            if (userProfile.inventory.doubleScore > 0) {
                userProfile.inventory.doubleScore--;
                earned *= 2;
            }
            state.score += earned;
            userProfile.coins += 15;
            state.index++;
            updateCoinDisplay();
            window.showModal("Benar!", `Susunan kata tepat! +${earned} Poin & +15 Koin Sanctuary.`, "🎉");
            render();
        } else {
            window.showModal("Salah", "Susunan huruf belum tepat, coba lagi!", "❌");
        }
    };

    window.resetSusunKataGame = function() {
        userProfile.games.susunkata = { score: 0, index: 0 };
        state = userProfile.games.susunkata;
        render();
    };

    render();
}

function initMatematika(container) {
    if (!userProfile.games.matematika) {
        userProfile.games.matematika = { score: 0, index: 0 };
    }
    let state = userProfile.games.matematika;
    let currentCorrectAns = 0;

    function generateMathProblem() {
        let ops = ['+', '-', '*'];
        let op = ops[Math.floor(Math.random() * ops.length)];
        let a = Math.floor(Math.random() * 40) + 1;
        let b = Math.floor(Math.random() * 40) + 1;
        if (op === '-' && a < b) [a, b] = [b, a];
        if (op === '*') { a = Math.floor(Math.random() * 10) + 1; b = Math.floor(Math.random() * 10) + 1; }
        
        if (op === '+') currentCorrectAns = a + b;
        if (op === '-') currentCorrectAns = a - b;
        if (op === '*') currentCorrectAns = a * b;

        return `${a} ${op} ${b} = ?`;
    }

    let currentProblem = generateMathProblem();

    function render() {
        currentProblem = generateMathProblem();
        container.innerHTML = `
            <div class="max-w-md w-full space-y-4 text-center">
                <div class="flex justify-between items-center bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
                    <span class="text-emerald-400 font-bold">Skor: ${state.score}</span>
                    <span class="text-slate-400">Soal ke-${state.index + 1}</span>
                </div>
                <div class="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
                    <p class="text-3xl font-black text-emerald-300 font-mono tracking-wider bg-slate-950 py-4 rounded-xl border border-slate-800">${currentProblem}</p>
                    <input type="number" id="math-input" placeholder="Hasil..." class="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-center text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <button onclick="checkMathAnswer(${currentCorrectAns})" class="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold rounded-xl text-xs uppercase shadow">Kirim Jawaban</button>
                </div>
                <button onclick="resetMathGame()" class="text-xs text-slate-500 hover:underline">Reset Progress</button>
            </div>
        `;
        saveUserProfile();
    }

    window.checkMathAnswer = function(correctVal) {
        let userVal = parseInt(document.getElementById('math-input').value);
        let earned = 10;
        if (userVal === correctVal) {
            if (userProfile.inventory.doubleScore > 0) {
                userProfile.inventory.doubleScore--;
                earned *= 2;
            }
            state.score += earned;
            userProfile.coins += 10;
            state.index++;
            updateCoinDisplay();
            window.showModal("Benar!", `Hitungan akurat! +${earned} Poin & +10 Koin Sanctuary.`, "✨");
            render();
        } else {
            window.showModal("Kurang Tepat", `Jawaban yang benar adalah ${correctVal}`, "❌");
            state.index++;
            render();
        }
    };

    window.resetMathGame = function() {
        userProfile.games.matematika = { score: 0, index: 0 };
        state = userProfile.games.matematika;
        render();
    };

    render();
}

const bankEnglish = [
    { q: "Bahasa Inggris dari 'Kucing'", options: ["Dog", "Cat", "Bird", "Fish"], ans: "Cat" },
    { q: "What is the past tense of 'Go'?", options: ["Gone", "Going", "Went", "Goed"], ans: "Went" },
    { q: "Terjemahan dari 'Thank you very much'", options: ["Sampai jumpa", "Terima kasih banyak", "Selamat pagi", "Permisi"], ans: "Terima kasih banyak" },
    { q: "Choose the correct spelling:", options: ["Beautifull", "Beautiful", "Butifull", "Beautyfull"], ans: "Beautiful" }
];

function initBahasaInggris(container) {
    if (!userProfile.games.inggris) {
        userProfile.games.inggris = { score: 0, index: 0 };
    }
    let state = userProfile.games.inggris;

    function render() {
        let qObj = bankEnglish[state.index % bankEnglish.length];
        let optionsHTML = '';
        qObj.options.forEach(opt => {
            optionsHTML += `<button onclick="checkEnglishAnswer('${opt}', '${qObj.ans}')" class="w-full py-3 bg-slate-950 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500 rounded-xl text-white text-xs font-bold transition">${opt}</button>`;
        });

        container.innerHTML = `
            <div class="max-w-md w-full space-y-4 text-center">
                <div class="flex justify-between items-center bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
                    <span class="text-purple-400 font-bold">Skor: ${state.score}</span>
                    <span class="text-slate-400">Soal ke-${state.index + 1}</span>
                </div>
                <div class="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
                    <p class="text-sm text-purple-200 font-bold">${qObj.q}</p>
                    <div class="space-y-2">${optionsHTML}</div>
                </div>
                <button onclick="resetEnglishGame()" class="text-xs text-slate-500 hover:underline">Reset Progress</button>
            </div>
        `;
        saveUserProfile();
    }

    window.checkEnglishAnswer = function(selected, correct) {
        let earned = 15;
        if (selected === correct) {
            if (userProfile.inventory.doubleScore > 0) {
                userProfile.inventory.doubleScore--;
                earned *= 2;
            }
            state.score += earned;
            userProfile.coins += 15;
            state.index++;
            updateCoinDisplay();
            window.showModal("Correct!", `Great job! +${earned} Poin & +15 Koin Sanctuary.`, "🇬🇧");
            render();
        } else {
            window.showModal("Incorrect", `Jawaban yang benar adalah: ${correct}`, "❌");
            state.index++;
            render();
        }
    };

    window.resetEnglishGame = function() {
        userProfile.games.inggris = { score: 0, index: 0 };
        state = userProfile.games.inggris;
        render();
    };

    render();
}

const pieceSymbols = {
    'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
    'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔'
};

function initStandardChess() {
    chessGame = new Chess();
    selectedSquare = null;
    renderStandardBoard();
}

window.resetChessGame = function() {
    initStandardChess();
    document.getElementById('chess-status').innerText = "Game baru dimulai. Giliran Anda (Putih).";
};

function renderStandardBoard() {
    const boardEl = document.getElementById('chess-board');
    if (!boardEl) return;
    boardEl.innerHTML = '';

    const boardData = chessGame.board();
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    let validTargets = [];
    if (selectedSquare) {
        const moves = chessGame.moves({ square: selectedSquare, verbose: true });
        validTargets = moves.map(m => m.to);
    }

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const squareName = files[c] + (8 - r);
            const piece = boardData[r][c];
            const isDark = (r + c) % 2 === 1;
            const isSelected = selectedSquare === squareName;
            const isValidTarget = validTargets.includes(squareName);

            let bgClass = isDark ? 'bg-black text-white' : 'bg-white text-black';
            if (isSelected) bgClass = 'bg-amber-500 text-slate-950';

            const squareDiv = document.createElement('div');
            squareDiv.className = `${bgClass} relative flex items-center justify-center text-xl sm:text-2xl font-extrabold cursor-pointer transition select-none aspect-square`;

            if (piece) {
                let pieceColorClass = piece.color === 'w' ? 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,1)]' : 'text-zinc-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]';
                squareDiv.innerHTML = `<span class="${pieceColorClass}">${pieceSymbols[piece.color === 'w' ? piece.type.toUpperCase() : piece.type]}</span>`;
            }
            
            if (isValidTarget) {
                const dot = document.createElement('div');
                dot.className = 'absolute w-3 h-3 sm:w-3.5 sm:h-3.5 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.9)] z-10 pointer-events-none animate-pulse';
                squareDiv.appendChild(dot);
            }

            squareDiv.onclick = () => handleSquareClick(squareName);
            boardEl.appendChild(squareDiv);
        }
    }
}

function handleSquareClick(square) {
    if (chessGame.game_over()) return;
    if (chessGame.turn() !== 'w') return;

    if (!selectedSquare) {
        const piece = chessGame.get(square);
        if (piece && piece.color === 'w') {
            selectedSquare = square;
            renderStandardBoard();
        }
    } else {
        if (selectedSquare === square) {
            selectedSquare = null;
            renderStandardBoard();
            return;
        }

        const move = chessGame.move({
            from: selectedSquare,
            to: square,
            promotion: 'q'
        });

        if (move === null) {
            const piece = chessGame.get(square);
            if (piece && piece.color === 'w') {
                selectedSquare = square;
            } else {
                selectedSquare = null;
            }
            renderStandardBoard();
        } else {
            selectedSquare = null;
            renderStandardBoard();
            checkChessStatus();

            if (!chessGame.game_over()) {
                document.getElementById('chess-status').innerText = "Bot AI sedang berpikir...";
                setTimeout(makeBotMove, 300);
            }
        }
    }
}

function makeBotMove() {
    if (chessGame.game_over()) return;
    let moves = chessGame.moves({ verbose: true });
    if (moves.length === 0) return;
    let randomMove = moves[Math.floor(Math.random() * moves.length)];
    chessGame.move(randomMove);
    renderStandardBoard();
    checkChessStatus();
}

function checkChessStatus() {
    const statusEl = document.getElementById('chess-status');
    if (chessGame.in_checkmate()) {
        statusEl.innerText = "Checkmate! Game Berakhir.";
    } else if (chessGame.in_draw()) {
        statusEl.innerText = "Game Berakhir Seri (Draw)!";
    } else if (chessGame.in_check()) {
        statusEl.innerText = "Skak (Check)! Hati-hati.";
    } else {
        statusEl.innerText = chessGame.turn() === 'w' ? "Giliran Anda (Putih)." : "Giliran Bot (Hitam).";
    }
}
