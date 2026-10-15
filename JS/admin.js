if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark");

const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function getBookings() {
  try { return JSON.parse(localStorage.getItem("bookings")) || []; }
  catch { return []; }
}
function saveBookings(list) {
  localStorage.setItem("bookings", JSON.stringify(list));
}

function render() {
  const bookings = getBookings();
  const revenue = bookings
    .filter(b => b.status !== "Cancelled")
    .reduce((sum, b) => sum + b.total, 0);

  document.getElementById("stats").innerHTML = `
    <div class="stat"><span>${bookings.length}</span>Total Bookings</div>
    <div class="stat"><span>${bookings.filter(b => b.status === "Pending").length}</span>Pending</div>
    <div class="stat"><span>$${revenue}</span>Revenue</div>
    <div class="stat"><span>${cars.filter(c => c.available).length}/${cars.length}</span>Cars Available</div>`;

  document.getElementById("bookingTable").innerHTML = bookings.length
    ? `<tr><th>Customer</th><th>Car</th><th>Dates</th><th>Total</th><th>Status</th><th></th></tr>` +
      bookings.map(b => `
        <tr>
          <td>${esc(b.name)}<br><small>${esc(b.phone)}</small></td>
          <td>${esc(b.carName)}</td>
          <td>${esc(b.pickup)} → ${esc(b.returnDate)}</td>
          <td>$${b.total}</td>
          <td>
            <select data-status="${b.id}">
              ${["Pending", "Confirmed", "Cancelled"].map(s =>
                `<option ${s === b.status ? "selected" : ""}>${s}</option>`).join("")}
            </select>
          </td>
          <td><button type="button" class="btn btn-small" data-del="${b.id}">Delete</button></td>
        </tr>`).join("")
    : `<tr><td>No bookings yet.</td></tr>`;

  document.getElementById("fleetTable").innerHTML =
    `<tr><th>Car</th><th>Category</th><th>Price/day</th><th>Seats</th><th>Status</th></tr>` +
    cars.map(c => `
      <tr>
        <td>${esc(c.name)}</td><td>${c.category}</td><td>$${c.price}</td><td>${c.seats}</td>
        <td><span class="badge ${c.available ? "ok" : "no"}">${c.available ? "Available" : "Booked"}</span></td>
      </tr>`).join("");
}

document.addEventListener("change", e => {
  const sel = e.target.closest("select[data-status]");
  if (!sel) return;
  const list = getBookings();
  const b = list.find(x => x.id === Number(sel.dataset.status));
  if (b) { b.status = sel.value; saveBookings(list); render(); }
});

document.addEventListener("click", e => {
  const btn = e.target.closest("button[data-del]");
  if (!btn || !confirm("Delete this booking?")) return;
  saveBookings(getBookings().filter(x => x.id !== Number(btn.dataset.del)));
  render();
});

render();