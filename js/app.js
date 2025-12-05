mapboxgl.accessToken =
  "pk.eyJ1IjoiZGtldmluMTIiLCJhIjoiY21panNheXRoMThlcDNkcTI2dzh2ejJvaiJ9.jqrkLjBADpNtEb01BCiN9g";

console.log("app.js loaded");

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/dark-v11",
  center: [-122.33, 47.61],
  zoom: 11
});

//Map Resize
window.addEventListener("resize", () => {
  map.resize();
});

// filter state
// ENHANCED: Added neighborhood, timestamps, and statistics tracking
const state = {
  crimeType: "all",
  neighborhood: "all",  // NEW: neighborhood filtering
  startDate: null,
  endDate: null,
  startTs: null,        // NEW: timestamp versions for reliable comparison
  endTs: null,
  filteredCount: 0,     // NEW: track filtered count for statistics
  totalCount: 0         // NEW: track total count for statistics
};

// Store the original unfiltered data - used for statistics calculation
let allFeatures = [];

// Helper to parse many possible date string formats into epoch ms
// ENHANCED: More robust with additional format patterns
function parseDateToTs(s) {
  if (s === null || s === undefined) return NaN;
  const str = String(s).trim();
  if (!str) return NaN;

  // Quick ISO date at start: YYYY-MM-DD
  let m = str.match(/(\d{4}-\d{2}-\d{2})/);
  if (m) {
    const t = Date.parse(m[1] + "T00:00:00");
    if (!isNaN(t)) return t;
  }

  // Try direct parse
  let t = Date.parse(str);
  if (!isNaN(t)) return t;

  // Pattern like: 2024 Nov 13 08:34:00 PM -> convert to "Nov 13 2024 08:34:00 PM"
  m = str.match(/^(\d{4})\s+([A-Za-z]+)\s+(\d{1,2})\s+(\d{1,2}:\d{2}:\d{2})\s*(AM|PM)?$/i);
  if (m) {
    const year = m[1];
    const monDay = `${m[2]} ${m[3]}`;
    const time = m[4];
    const ampm = m[5] || "";
    const reform = `${monDay} ${year} ${time} ${ampm}`.trim();
    t = Date.parse(reform);
    if (!isNaN(t)) return t;
  }

  // Fallback: try to find any YYYY/MM/DD or MM/DD/YYYY
  m = str.match(/(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  if (m) {
    const iso = `${m[1]}-${String(m[2]).padStart(2, "0")}-${String(m[3]).padStart(2, "0")}`;
    t = Date.parse(iso + "T00:00:00");
    if (!isNaN(t)) return t;
  }

  // Give up
  return NaN;
}

function buildFilter() {
  const filters = ["all"];

  // Category filter
  if (state.crimeType && state.crimeType !== "all") {
    filters.push(["==", ["get", "Offense Category"], state.crimeType]);
  }

  // Neighborhood filter - NEW enhancement
  // Dynamically filter by selected neighborhood
  if (state.neighborhood && state.neighborhood !== "all") {
    filters.push(["==", ["get", "Neighborhood"], state.neighborhood]);
  }

  // Date filters - ENHANCED: use numeric timestamps instead of string comparison
  if (state.startTs !== null && !isNaN(state.startTs)) {
    filters.push([">=", ["get", "ts"], state.startTs]);
  }

  if (state.endTs !== null && !isNaN(state.endTs)) {
    filters.push(["<=", ["get", "ts"], state.endTs]);
  }

  return filters;
}

// NEW FUNCTION: Calculate and update statistics in real-time
function updateStatistics() {
  const filter = buildFilter();

  let filteredCount = 0;
  let violentCount = 0;
  let propertyCount = 0;
  let otherCount = 0;

  for (const feature of allFeatures) {
    const props = feature.properties;
    let matchesFilter = true;

    // Check crime type filter
    if (state.crimeType !== "all" && props["Offense Category"] !== state.crimeType) {
      matchesFilter = false;
    }

    // Check neighborhood filter
    if (matchesFilter && state.neighborhood !== "all" && props["Neighborhood"] !== state.neighborhood) {
      matchesFilter = false;
    }

    // Check date range filters using numeric timestamps
    if (matchesFilter && state.startTs !== null && !isNaN(state.startTs)) {
      if (props.ts < state.startTs) matchesFilter = false;
    }
    if (matchesFilter && state.endTs !== null && !isNaN(state.endTs)) {
      if (props.ts > state.endTs) matchesFilter = false;
    }

    // If feature matches all filters, increment counters
    if (matchesFilter) {
      filteredCount++;
      const category = props["Offense Category"];
      if (category === "VIOLENT CRIME") violentCount++;
      else if (category === "PROPERTY CRIME") propertyCount++;
      else if (category === "ALL OTHER") otherCount++;
    }
  }

  state.filteredCount = filteredCount;

  const summaryEl = document.getElementById("summary-text");
  if (summaryEl) {
    const pct = state.totalCount > 0 ? ((filteredCount / state.totalCount) * 100).toFixed(1) : 0;
    let summaryHtml = `<strong>Showing ${filteredCount.toLocaleString()} of ${state.totalCount.toLocaleString()} crimes (${pct}%)</strong><br/>`;

    if (filteredCount > 0) {
      summaryHtml += `Violent: ${violentCount.toLocaleString()} | Property: ${propertyCount.toLocaleString()} | Other: ${otherCount.toLocaleString()}<br/>`;
    }

    summaryHtml += `<br/>Use the filters above to explore crime patterns across Seattle. Zoom out to see overall hot spots as a heatmap, and zoom in to see individual incidents as points. Click a point for more details.`;

    summaryEl.innerHTML = summaryHtml;
  }

  const statsPanel = document.getElementById("stats-details");
  if (statsPanel && filteredCount > 0) {
    statsPanel.innerHTML = `
      <strong>Quick Stats</strong><br/>
      Total incidents: ${filteredCount.toLocaleString()}<br/>
      Violent: ${violentCount.toLocaleString()} (${((violentCount/filteredCount)*100).toFixed(1)}%)<br/>
      Property: ${propertyCount.toLocaleString()} (${((propertyCount/filteredCount)*100).toFixed(1)}%)<br/>
      Other: ${otherCount.toLocaleString()} (${((otherCount/filteredCount)*100).toFixed(1)}%)
    `;
  }
}

map.on("load", () => {
  console.log("map style loaded");

  // Add an empty source first
  map.addSource("crime", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] }
  });

  // Fetch the GeoJSON, normalize date fields into numeric `ts` (ms since epoch)
  fetch("assets/MergedData.geojson")
    .then((r) => r.json())
    .then((data) => {
      if (data && Array.isArray(data.features)) {
        data.features.forEach((f) => {
          const props = f.properties || {};

          const dateCandidates = [
            props["ts"] ? props["ts"] : null,
            props["Offense Date"],
            props["OffenseDate"],
            props["Occurred Date"],
            props["OccurredDate"],
            props["Report DateTime"],
            props["Report Date"]
          ];

          let ts = NaN;
          for (const c of dateCandidates) {
            if (c === null || c === undefined) continue;
            const parsed = parseDateToTs(c);
            if (!isNaN(parsed)) {
              ts = parsed;
              break;
            }
          }

          if (isNaN(ts)) {
            const extra = props["date"] || props["Date"] || props["Occurred DateTime"];
            ts = parseDateToTs(extra);
          }

          props.ts = isNaN(ts) ? null : ts;
          props.date_iso = props.ts ? new Date(props.ts).toISOString().slice(0, 10) : null;
          f.properties = props;
        });
      }

      allFeatures = data.features;
      state.totalCount = data.features.length;

      const src = map.getSource("crime");
      if (src) src.setData(data);

      populateNeighborhoodSelect();
      updateStatistics();
    })
    .catch((err) => console.error("Failed to load/normalize crime GeoJSON:", err));

  // Point markers layer
  map.addLayer({
    id: "crime-points",
    type: "circle",
    source: "crime",
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        10, 1.5,
        14, 6
      ],
      "circle-opacity": [
        "interpolate",
        ["linear"],
        ["zoom"],
        10, 0.0,
        12, 0.4,
        14, 0.8
      ],
      "circle-color": [
        "match",
        ["get", "Offense Category"],
        "VIOLENT CRIME", "#b91c1c",
        "PROPERTY CRIME", "#1d4ed8",
        "ALL OTHER", "#9ca3af",
        /* default */ "#9ca3af"
      ]
    }
  });

  // Heatmap layer
  map.addLayer(
    {
      id: "crime-heat",
      type: "heatmap",
      source: "crime",
      maxzoom: 15,
      paint: {
        "heatmap-weight": 1,
        "heatmap-intensity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10, 1,
          13, 2
        ],
        "heatmap-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10, 15,
          14, 25
        ],
        "heatmap-opacity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10, 1.0,
          12, 0.6,
          14, 0.0
        ]
      }
    },
    "crime-points"
  );

  // Point Click Popup
  map.on("click", "crime-points", (e) => {
    const feature = e.features[0];
    const props = feature.properties;

    const html = `
      <div style="font-size: 0.85rem;">
        <strong style="color: #b91c1c;">${props["Offense Category"] || "Crime"}</strong><br/>
        <em>${props["Offense Sub Category"] || "N/A"}</em><br/>
        <br/>
        <strong>Report #:</strong> ${props["Report Number"] || "N/A"}<br/>
        <strong>Date:</strong> ${props["date_iso"] || "N/A"}<br/>
        <strong>Neighborhood:</strong> ${props.Neighborhood || "N/A"}<br/>
        <strong>Precinct:</strong> ${props.Precinct || "N/A"}<br/>
        <strong>Beat:</strong> ${props.Beat || "N/A"}
      </div>
    `;

    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(html)
      .addTo(map);
  });

  // Pointer cursor on hover
  map.on("mouseenter", "crime-points", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "crime-points", () => {
    map.getCanvas().style.cursor = "";
  });

  // Hook up sidebar controls
  setupUI();
});

// Populate neighborhood select
function populateNeighborhoodSelect() {
  const neighborhoods = new Set();

  for (const feature of allFeatures) {
    const neighborhood = feature.properties?.Neighborhood;
    if (neighborhood) {
      neighborhoods.add(neighborhood);
    }
  }

  const neighborhoodSelect = document.getElementById("neighborhood-select");
  if (neighborhoodSelect) {
    const sortedNeighborhoods = Array.from(neighborhoods).sort();

    for (const neighborhood of sortedNeighborhoods) {
      const option = document.createElement("option");
      option.value = neighborhood;
      option.textContent = neighborhood;
      neighborhoodSelect.appendChild(option);
    }
  }
}

function setupUI() {
  const crimeTypeSelect = document.getElementById("crime-type-select");
  const neighborhoodSelect = document.getElementById("neighborhood-select");
  const startInput = document.getElementById("start-date");
  const endInput = document.getElementById("end-date");
  const applyDateBtn = document.getElementById("apply-date-btn");
  const resetBtn = document.getElementById("reset-filters-btn");

  if (crimeTypeSelect) {
    crimeTypeSelect.addEventListener("change", () => {
      state.crimeType = crimeTypeSelect.value;
      applyFilterToMap();
    });
  }

  if (neighborhoodSelect) {
    neighborhoodSelect.addEventListener("change", () => {
      state.neighborhood = neighborhoodSelect.value;
      applyFilterToMap();
    });
  }

  if (applyDateBtn) {
    applyDateBtn.addEventListener("click", () => {
      state.startDate = startInput?.value || null;
      state.endDate = endInput?.value || null;

      if (state.startDate) {
        state.startTs = Date.parse(state.startDate + "T00:00:00");
      } else {
        state.startTs = null;
      }

      if (state.endDate) {
        state.endTs = Date.parse(state.endDate + "T23:59:59");
      } else {
        state.endTs = null;
      }
      applyFilterToMap();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      state.crimeType = "all";
      state.neighborhood = "all";
      state.startDate = null;
      state.endDate = null;
      state.startTs = null;
      state.endTs = null;

      if (crimeTypeSelect) crimeTypeSelect.value = "all";
      if (neighborhoodSelect) neighborhoodSelect.value = "all";
      if (startInput) startInput.value = "";
      if (endInput) endInput.value = "";

      applyFilterToMap();
    });
  }
}

function applyFilterToMap() {
  const filter = buildFilter();

  if (map.getLayer("crime-points")) {
    map.setFilter("crime-points", filter);
  }
  if (map.getLayer("crime-heat")) {
    map.setFilter("crime-heat", filter);
  }

  updateStatistics();
}
