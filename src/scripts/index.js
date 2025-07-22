if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("../service-worker.js")
    .then((registration) => {
      console.log("ServiceWorker registration successful");
    })
    .catch((error) => {
      console.log("ServiceWorker registration failed");
    });
}

// utils/constants.ts
const STORAGE_KEY = "messcut_data";
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// utils/helpers.ts
class DateHelper {
  static formatDate(date) {
    return date.toISOString().split("T")[0];
  }

  static getMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  }

  static isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  static isSameMonth(date1, date2) {
    return (
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  }
}

// store/messCutStore.ts
class MessCutStore {
  constructor() {
    this.data = this.loadData();
  }

  loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error("Error loading data:", error);
      return {};
    }
  }

  saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error("Error saving data:", error);
    }
  }

  addMessCut(date, note = "") {
    const dateKey = DateHelper.formatDate(date);
    const monthKey = DateHelper.getMonthKey(date);

    if (!this.data[monthKey]) {
      this.data[monthKey] = {};
    }

    this.data[monthKey][dateKey] = { note, timestamp: Date.now() };
    this.saveData();
  }

  removeMessCut(date) {
    const dateKey = DateHelper.formatDate(date);
    const monthKey = DateHelper.getMonthKey(date);

    if (this.data[monthKey] && this.data[monthKey][dateKey]) {
      delete this.data[monthKey][dateKey];
      this.saveData();
    }
  }

  getMessCut(date) {
    const dateKey = DateHelper.formatDate(date);
    const monthKey = DateHelper.getMonthKey(date);

    return this.data[monthKey]?.[dateKey] || null;
  }

  getMonthlyCount(year, month) {
    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    const monthData = this.data[monthKey] || {};
    return Object.keys(monthData).length;
  }

  isMarked(date) {
    return this.getMessCut(date) !== null;
  }
}

// components/Calendar/Calendar.ts
class Calendar {
  constructor(containerId, store) {
    this.container = document.getElementById(containerId);
    this.store = store;
    this.currentDate = new Date();
    this.onDateClick = null;
  }

  render() {
    this.container.innerHTML = "";

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    // Add day headers
    DAYS_OF_WEEK.forEach((day) => {
      const dayHeader = document.createElement("div");
      dayHeader.className = "day-header";
      dayHeader.textContent = day;
      this.container.appendChild(dayHeader);
    });

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDate = new Date(year, month, -startingDayOfWeek + i + 1);
      const dayCell = this.createDayCell(prevMonthDate, false);
      this.container.appendChild(dayCell);
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayCell = this.createDayCell(date, true);
      this.container.appendChild(dayCell);
    }

    // Add days for next month to fill the grid
    const totalCells = this.container.children.length - 7; // Subtract day headers
    const remainingCells = 42 - totalCells; // 6 rows * 7 days - current cells

    for (let day = 1; day <= remainingCells; day++) {
      const nextMonthDate = new Date(year, month + 1, day);
      const dayCell = this.createDayCell(nextMonthDate, false);
      this.container.appendChild(dayCell);
    }
  }

  createDayCell(date, isCurrentMonth) {
    const dayCell = document.createElement("div");
    dayCell.className = "day-cell";
    dayCell.textContent = date.getDate();

    if (isCurrentMonth) {
      dayCell.classList.add("current-month");
    } else {
      dayCell.classList.add("other-month");
    }

    if (DateHelper.isToday(date)) {
      dayCell.classList.add("today");
    }

    if (this.store.isMarked(date)) {
      dayCell.classList.add("marked");
    }

    dayCell.addEventListener("click", () => {
      if (this.onDateClick) {
        this.onDateClick(date);
      }
    });

    return dayCell;
  }

  previousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.render();
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.render();
  }

  getCurrentMonth() {
    return this.currentDate;
  }
}

// components/Modal/Modal.ts
class Modal {
  constructor() {
    this.overlay = document.getElementById("modalOverlay");
    this.form = document.getElementById("messCutForm");
    this.titleElement = document.getElementById("modalTitle");
    this.noteTextarea = document.getElementById("noteTextarea");
    this.cancelBtn = document.getElementById("cancelBtn");
    this.saveBtn = document.getElementById("saveBtn");
    this.unmarkBtn = document.getElementById("unmarkBtn");

    this.currentDate = null;
    this.onSave = null;
    this.onUnmark = null;

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    this.cancelBtn.addEventListener("click", () => {
      this.close();
    });

    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSave();
    });

    this.unmarkBtn.addEventListener("click", () => {
      this.handleUnmark();
    });

    // Close modal on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.overlay.classList.contains("active")) {
        this.close();
      }
    });
  }

  open(date, existingData = null) {
    this.currentDate = date;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const dateString = `${day}/${month}/${year}`;

    if (existingData) {
      this.titleElement.textContent = `Edit Mess Cut - ${dateString}`;
      this.noteTextarea.value = existingData.note || "";
      this.unmarkBtn.style.display = "inline-block";
    } else {
      this.titleElement.textContent = `Mark Mess Cut - ${dateString}`;
      this.noteTextarea.value = "";
      this.unmarkBtn.style.display = "none";
    }

    this.overlay.classList.add("active");
    this.noteTextarea.focus();
  }

  close() {
    this.overlay.classList.remove("active");
    this.form.reset();
    this.currentDate = null;
  }

  handleSave() {
    const note = this.noteTextarea.value.trim();
    if (this.onSave) {
      this.onSave(this.currentDate, note);
    }
    this.close();
  }

  handleUnmark() {
    if (this.onUnmark) {
      this.onUnmark(this.currentDate);
    }
    this.close();
  }
}

// services/messCutService.ts
class MessCutService {
  constructor(store) {
    this.store = store;
  }

  markMessCut(date, note) {
    this.store.addMessCut(date, note);
  }

  unmarkMessCut(date) {
    this.store.removeMessCut(date);
  }

  getMessCutData(date) {
    return this.store.getMessCut(date);
  }

  getMonthlyStats(year, month) {
    return {
      count: this.store.getMonthlyCount(year, month),
    };
  }
}

// Main Application
class MessCutApp {
  constructor() {
    this.store = new MessCutStore();
    this.service = new MessCutService(this.store);
    this.calendar = new Calendar("calendarGrid", this.store);
    this.modal = new Modal();

    this.setupEventListeners();
    this.initialize();
  }

  setupEventListeners() {
    // Calendar navigation
    document.getElementById("prevMonth").addEventListener("click", () => {
      this.calendar.previousMonth();
      this.updateUI();
    });

    document.getElementById("nextMonth").addEventListener("click", () => {
      this.calendar.nextMonth();
      this.updateUI();
    });

    // Calendar date click
    this.calendar.onDateClick = (date) => {
      const existingData = this.service.getMessCutData(date);
      this.modal.open(date, existingData);
    };

    // Modal events
    this.modal.onSave = (date, note) => {
      this.service.markMessCut(date, note);
      this.refreshCalendar();
      this.updateStats();
    };

    this.modal.onUnmark = (date) => {
      this.service.unmarkMessCut(date);
      this.refreshCalendar();
      this.updateStats();
    };
  }

  initialize() {
    this.updateUI();
    this.refreshCalendar();
    this.updateStats();
  }

  updateUI() {
    const currentMonth = this.calendar.getCurrentMonth();
    const monthName = MONTHS[currentMonth.getMonth()];
    const year = currentMonth.getFullYear();

    document.getElementById(
      "calendarMonth"
    ).textContent = `${monthName} ${year}`;
    document.getElementById("currentMonthYear").textContent =
      new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
  }

  refreshCalendar() {
    this.calendar.render();
  }

  updateStats() {
    const currentMonth = this.calendar.getCurrentMonth();
    const stats = this.service.getMonthlyStats(
      currentMonth.getFullYear(),
      currentMonth.getMonth()
    );

    document.getElementById("messCutCount").textContent = stats.count;
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new MessCutApp();
});

// Register Service Worker for PWA
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then((registration) => {
      console.log("ServiceWorker registration successful");
    })
    .catch((error) => {
      console.log("ServiceWorker registration failed");
    });
}
