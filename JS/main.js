// ---------- ELEMENTS ----------
const carGrid = document.getElementById("carGrid");
const featuredGrid = document.getElementById("featuredGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const priceFilter = document.getElementById("priceFilter");
const resetBtn = document.getElementById("resetFilters");
const resultCount = document.getElementById("resultCount");
const carSelect = document.getElementById("carSelect");

const form = document.getElementById("bookingForm");
const pickup = document.getElementById("pickup");
const returnDate = document.getElementById("returnDate");
const totalBox = document.getElementById("totalBox");
const today = new Date().toISOString().split("T")[0];

// ---------- RENDER CARS ----------
function carCard(car) {
  return `
    <article class="card">
      <img src="${car.image}" alt="${car.name}" />
      <div class="card-body">
        <span class="badge ${car.available ? "ok" : "no"}">${car.available ? "Available" : "Booked"}</span>
        <h3>${car.name}</h3>
        <p class="meta">${car.category} · ${car.fuel} · ${car.seats} seats</p>
        <p class="price">$${car.price} <small>/ day</small></p>
        <button type="button" class="btn btn-small" data-id="${car.id}" ${car.available ? "" : "disabled"}>
          ${car.available ? "Book Now" : "Unavailable"}
        </button>
        <button type="button" class="btn btn-small btn-ghost" data-details="${car.id}">Details</button>
      </div>
    </article>`;
}

function renderFeatured() {
  featuredGrid.innerHTML = cars.filter(c => c.featured).map(carCard).join("");
}

function renderCars(list) {
  resultCount.textContent = `${list.length} car(s) found`;
  carGrid.innerHTML = list.length
    ? list.map(carCard).join("")
    : `<p class="empty">No cars match your search. Try changing the filters.</p>`;
}

// ---------- FILL DROPDOWNS ----------
[...new Set(cars.map(c => c.category))].forEach(cat => {
  categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`;
});
cars.filter(c => c.available).forEach(c => {
  carSelect.innerHTML += `<option value="${c.id}">${c.name} - $${c.price}/day</option>`;
});

renderFeatured();
renderCars(cars);

// ---------- SEARCH & FILTER ----------
function applyFilters() {
  const text = searchInput.value.trim().toLowerCase();
  const cat = categoryFilter.value;
  const maxPrice = Number(priceFilter.value);

  const result = cars.filter(c =>
    c.name.toLowerCase().includes(text) &&
    (cat === "All" || c.category === cat) &&
    (maxPrice === 0 || c.price <= maxPrice)
  );
  renderCars(result);
}

searchInput.addEventListener("input", applyFilters);
categoryFilter.addEventListener("change", applyFilters);
priceFilter.addEventListener("change", applyFilters);
resetBtn.addEventListener("click", () => {
  searchInput.value = "";
  categoryFilter.value = "All";
  priceFilter.value = "0";
  applyFilters();
});

// ---------- "BOOK NOW" BUTTON ON CARDS ----------
document.addEventListener("click", e => {
  const btn = e.target.closest("button[data-id]");
  if (!btn) return;
  carSelect.value = btn.dataset.id;
  updateTotal();
  document.getElementById("booking").scrollIntoView({ behavior: "smooth" });
});

// ---------- MOBILE MENU ----------
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
menuToggle.addEventListener("click", () => navLinks.classList.toggle("open"));
navLinks.addEventListener("click", () => navLinks.classList.remove("open"));

// ---------- BOOKING FORM ----------
pickup.min = today;
returnDate.min = today;

function setError(id, msg) {
  document.getElementById(id + "Error").textContent = msg;
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

function updateTotal() {
  const car = cars.find(c => c.id === Number(carSelect.value));
  if (car && pickup.value && returnDate.value && returnDate.value > pickup.value) {
    const days = daysBetween(pickup.value, returnDate.value);
    totalBox.textContent = `Estimated total: $${days * car.price} (${days} day${days > 1 ? "s" : ""})`;
  } else {
    totalBox.textContent = "";
  }
}

pickup.addEventListener("change", () => {
  returnDate.min = pickup.value || today;
  updateTotal();
});
returnDate.addEventListener("change", updateTotal);
carSelect.addEventListener("change", updateTotal);

form.addEventListener("submit", e => {
  e.preventDefault();
  let valid = true;
  ["name", "phone", "email", "carSelect", "pickup", "returnDate"].forEach(id => setError(id, ""));
  document.getElementById("successMsg").textContent = "";

  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.replace(/[\s-]/g, "");
  const email = document.getElementById("email").value.trim();

  if (name.length < 2) { setError("name", "Please enter your full name."); valid = false; }
  if (!/^(\+254|254|0)\d{9}$/.test(phone)) { setError("phone", "Enter a valid phone number, e.g. 0712345678."); valid = false; }
  if (!/^\S+@\S+\.\S+$/.test(email)) { setError("email", "Enter a valid email address."); valid = false; }
  if (!carSelect.value) { setError("carSelect", "Please choose a car."); valid = false; }
  if (!pickup.value) { setError("pickup", "Choose a pickup date."); valid = false; }
  if (!returnDate.value) { setError("returnDate", "Choose a return date."); valid = false; }
  else if (pickup.value && returnDate.value <= pickup.value) {
    setError("returnDate", "Return date must be after pickup date."); valid = false;
  }

    if (valid) {
    const car = cars.find(c => c.id === Number(carSelect.value));
    const days = daysBetween(pickup.value, returnDate.value);

    // save the booking to LocalStorage
    const bookings = getBookings();
    bookings.push({
      id: Date.now(),
      name, phone, email,
      carName: car.name,
      pickup: pickup.value,
      returnDate: returnDate.value,
      total: days * car.price,
      status: "Pending",
      created: new Date().toLocaleString()
    });
    localStorage.setItem("bookings", JSON.stringify(bookings));
    renderHistory();

    const msg = document.getElementById("successMsg");
    msg.textContent =
      `Thank you, ${name}! Your request for the ${car.name} (${pickup.value} to ${returnDate.value}) has been received. We'll contact you shortly.`;
    form.reset();
    totalBox.textContent = "";
    pickup.min = today;
    returnDate.min = today;
    msg.scrollIntoView({ behavior: "smooth", block: "center" });
  }
});