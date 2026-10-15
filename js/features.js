// ========== MAKE SURE REQUIRED ELEMENTS EXIST ==========
(function ensureElements() {
  const nav = document.getElementById("navLinks");
  if (nav && !document.getElementById("themeToggle")) {
    nav.insertAdjacentHTML("beforeend",
      `<button type="button" class="icon-btn" id="themeToggle" aria-label="Toggle dark mode">🌙</button>
       <button type="button" class="btn btn-small" id="authBtn">Login</button>`);
  }
  if (!document.getElementById("modal")) {
    document.body.insertAdjacentHTML("beforeend",
      `<div class="modal" id="modal"><div class="modal-box">
         <button type="button" class="modal-close" id="modalClose" aria-label="Close">×</button>
         <div id="modalContent"></div>
       </div></div>`);
  }
})();

// ========== HELPERS ==========
const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function getBookings() {
  try { return JSON.parse(localStorage.getItem("bookings")) || []; }
  catch { return []; }
}

// ========== BOOKING HISTORY (skips itself if the section is missing) ==========
function renderHistory() {
  const list = document.getElementById("historyList");
  if (!list) return;
  const bookings = getBookings();
  if (!bookings.length) {
    list.innerHTML = `<p class="empty">No bookings yet. Book a car above!</p>`;
    return;
  }
  list.innerHTML = bookings.slice().reverse().map(b => `
    <div class="history-item">
      <div>
        <h3>${esc(b.carName)}</h3>
        <p>${esc(b.pickup)} → ${esc(b.returnDate)}</p>
        <small>Booked by ${esc(b.name)} on ${esc(b.created)}</small>
      </div>
      <div style="text-align:right">
        <span class="status ${esc(b.status)}">${esc(b.status)}</span>
        <p class="price">$${b.total}</p>
      </div>
    </div>`).join("");
}

const clearBtn = document.getElementById("clearHistory");
if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    if (confirm("Delete all booking history?")) {
      localStorage.removeItem("bookings");
      renderHistory();
    }
  });
}
renderHistory();

// ========== DARK MODE ==========
const themeToggle = document.getElementById("themeToggle");

function setTheme(dark) {
  document.body.classList.toggle("dark", dark);
  if (themeToggle) themeToggle.textContent = dark ? "☀️" : "🌙";
  localStorage.setItem("theme", dark ? "dark" : "light");
}

const savedTheme = localStorage.getItem("theme");
setTheme(savedTheme ? savedTheme === "dark"
  : window.matchMedia("(prefers-color-scheme: dark)").matches);

if (themeToggle) {
  themeToggle.addEventListener("click", () =>
    setTheme(!document.body.classList.contains("dark")));
}

// ========== POPUP ==========
const modal = document.getElementById("modal");
const modalBox = modal.querySelector(".modal-box");
const modalContent = document.getElementById("modalContent");

function openModal(html) {
  modalContent.innerHTML = html;
  modal.classList.add("show");
}
function closeModal() { modal.classList.remove("show"); }

document.getElementById("modalClose").addEventListener("click", closeModal);
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

// ========== CAR DETAILS ==========
document.addEventListener("click", e => {
  const btn = e.target.closest("button[data-details]");
  if (!btn) return;
  const car = cars.find(c => c.id === Number(btn.dataset.details));
  openModal(`
    <img src="${car.image}" alt="${esc(car.name)}" />
    <h3>${esc(car.name)}</h3>
    <p class="meta">${car.category} · ${car.fuel} · ${car.seats} seats</p>
    <p class="price">$${car.price} <small>/ day</small></p>
    <ul>
      <li>Air conditioning</li>
      <li>Bluetooth audio</li>
      <li>Insurance included</li>
      <li>Free cancellation up to 24 hours before pickup</li>
    </ul>
    <button type="button" class="btn" id="modalBook" data-id="${car.id}" ${car.available ? "" : "disabled"}>
      ${car.available ? "Book This Car" : "Currently Unavailable"}
    </button>
  `);
  document.getElementById("modalBook").addEventListener("click", closeModal);
});

// ========== LOGIN / SIGNUP ==========
const authBtn = document.getElementById("authBtn");

function getUsers() {
  try { return JSON.parse(localStorage.getItem("users")) || []; }
  catch { return []; }
}
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("currentUser")); }
  catch { return null; }
}
function updateAuthButton() {
  if (!authBtn) return;
  const u = getCurrentUser();
  authBtn.textContent = u ? `Logout (${u.name.split(" ")[0]})` : "Login";
}
function shakeModal() {
  modalBox.classList.remove("shake");
  void modalBox.offsetWidth;
  modalBox.classList.add("shake");
}

function showAuth(mode) {
  const isLogin = mode === "login";
  openModal(`
    <div class="auth">
      <div class="auth-icon">${isLogin ? "🔑" : "🚗"}</div>
      <h3>${isLogin ? "Welcome back" : "Create your account"}</h3>
      <p class="auth-sub">${isLogin ? "Login to manage your bookings." : "Sign up to book faster."}</p>
      <form id="authForm" novalidate>
        ${isLogin ? "" : `<label for="authName">Full Name</label><input id="authName" type="text" />`}
        <label for="authEmail">Email</label>
        <input id="authEmail" type="email" />
        <label for="authPass">Password</label>
        <div class="pass-wrap">
          <input id="authPass" type="password" />
          <button type="button" class="show-pass" id="showPass" aria-label="Show password">👁</button>
        </div>
        <small class="error" id="authError"></small>
        <button type="submit" class="btn">${isLogin ? "Login" : "Sign Up"}</button>
      </form>
      <p class="switch">
        ${isLogin ? `No account? <a href="#" id="switchAuth">Sign up</a>`
                  : `Already registered? <a href="#" id="switchAuth">Login</a>`}
      </p>
    </div>
  `);
  document.getElementById("showPass").addEventListener("click", () => {
    const p = document.getElementById("authPass");
    p.type = p.type === "password" ? "text" : "password";
  });
  document.getElementById("switchAuth").addEventListener("click", e => {
    e.preventDefault();
    showAuth(isLogin ? "signup" : "login");
  });
  document.getElementById("authForm").addEventListener("submit", e => {
    e.preventDefault();
    handleAuth(isLogin);
  });
}

function handleAuth(isLogin) {
  const err = document.getElementById("authError");
  const email = document.getElementById("authEmail").value.trim().toLowerCase();
  const pass = document.getElementById("authPass").value;
  const name = isLogin ? "" : document.getElementById("authName").value.trim();
  err.textContent = "";
  const fail = msg => { err.textContent = msg; shakeModal(); };

  if (!isLogin && name.length < 2) return fail("Please enter your name.");
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail("Enter a valid email.");
  if (pass.length < 6) return fail("Password must be at least 6 characters.");

  const users = getUsers();
  if (isLogin) {
    const u = users.find(x => x.email === email && x.pass === pass);
    if (!u) return fail("Wrong email or password.");
    localStorage.setItem("currentUser", JSON.stringify({ name: u.name, email: u.email }));
  } else {
    if (users.some(x => x.email === email)) return fail("That email is already registered.");
    users.push({ name, email, pass });
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("currentUser", JSON.stringify({ name, email }));
  }

  modalContent.innerHTML = `
    <div class="auth success-view">
      <div class="checkmark">✓</div>
      <h3>${isLogin ? "Logged in!" : "Account created!"}</h3>
    </div>`;
  updateAuthButton();
  setTimeout(closeModal, 1100);
}

if (authBtn) {
  authBtn.addEventListener("click", () => {
    if (getCurrentUser()) {
      localStorage.removeItem("currentUser");
      updateAuthButton();
    } else {
      showAuth("login");
    }
  });
}
updateAuthButton();

// ========== SCROLL ANIMATIONS ==========
const revealEls = document.querySelectorAll(".section, .footer");
revealEls.forEach(el => el.classList.add("reveal"));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

revealEls.forEach(el => observer.observe(el));