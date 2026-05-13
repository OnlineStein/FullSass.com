const data = window.longhornData;

const summaryGrid = document.querySelector("#summary-grid");
const tableBody = document.querySelector("#table-body");
const sortSelect = document.querySelector("#sort-select");
const filterSelect = document.querySelector("#filter-select");
const tableCaption = document.querySelector("#table-caption");

const formatPct = (value) => value.toFixed(3).replace(/^0/, "");

const pctClass = (value) => {
  if (value >= 0.7) return "good";
  if (value < 0.5) return "bad";
  return "";
};

const sorters = {
  best: (a, b) => b.winPct - a.winPct || b.wins - a.wins || a.losses - b.losses || a.startYear - b.startYear,
  worst: (a, b) => a.winPct - b.winPct || a.wins - b.wins || b.losses - a.losses || a.startYear - b.startYear,
  startYearAsc: (a, b) => a.startYear - b.startYear,
  startYearDesc: (a, b) => b.startYear - a.startYear,
  winsDesc: (a, b) => b.wins - a.wins || b.winPct - a.winPct,
};

const filters = {
  all: (windowItem) => true,
  top10: (_windowItem, index, sortedList) => sortedList[index] && index < 10,
  bottom10: (_windowItem, index, sortedList) => sortedList[index] && index < 10,
  above800: (windowItem) => windowItem.winPct >= 0.8,
  below500: (windowItem) => windowItem.winPct < 0.5,
};

function renderSummary() {
  const cards = [
    {
      className: "best",
      label: "Best window",
      value: `${data.bestWindow.startYear}-${data.bestWindow.endYear}`,
      body: `${data.bestWindow.record} (${formatPct(data.bestWindow.winPct)})`,
    },
    {
      className: "worst",
      label: "Worst window",
      value: `${data.worstWindow.startYear}-${data.worstWindow.endYear}`,
      body: `${data.worstWindow.record} (${formatPct(data.worstWindow.winPct)})`,
    },
    /*{
      label: "Total windows",
      value: `${data.windowCount}`,
      body: `Built from ${data.seasonCount} seasons on the source table.`,
    },*/
    {
      label: "Method",
      value: "Win percentage",
      body: "Ties count as half a win when ranking each four-season stretch.",
    },
  ];

  summaryGrid.innerHTML = cards
    .map(
      (card) => `
        <article class="summary-card ${card.className || ""}">
          <span class="label">${card.label}</span>
          <strong>${card.value}</strong>
          <p>${card.body}</p>
        </article>
      `,
    )
    .join("");
}

function renderTable() {
  const sortMode = sortSelect.value;
  const filterMode = filterSelect.value;
  const sorted = [...data.windows].sort(sorters[sortMode]);
  const visibleBase = filterMode === "bottom10" ? [...data.windows].sort(sorters.worst) : sorted;
  const visible = visibleBase.filter((windowItem, index, list) => filters[filterMode](windowItem, index, list));

  tableCaption.textContent = `${visible.length} of ${data.windowCount} four-year windows shown. Source: Wikipedia season list.`;

  tableBody.innerHTML = visible
    .map(
      (windowItem, index) => `
        <tr>
          <td class="rank-col rank-value">${index + 1}</td>
          <td><span class="stretch-pill">${windowItem.startYear}-${windowItem.endYear}</span></td>
          <td>${windowItem.record}</td>
          <td class="win-pct ${pctClass(windowItem.winPct)}">${formatPct(windowItem.winPct)}</td>
          <td>${windowItem.wins}</td>
          <td>${windowItem.losses}</td>
          <td>${windowItem.ties}</td>
          <td>${windowItem.coachLabel}</td>
          <td>
            <div class="season-stack">
              ${windowItem.seasonRecords
                .map((season) => `<span>${season.year}: ${season.record}</span>`)
                .join("")}
            </div>
          </td>
        </tr>
      `,
    )
    .join("");
}

renderSummary();
renderTable();

sortSelect.addEventListener("change", renderTable);
filterSelect.addEventListener("change", renderTable);
