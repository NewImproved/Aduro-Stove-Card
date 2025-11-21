const TRANSLATIONS_BASE = "/hacsfiles/Aduro-Stove-Card/translations";

class AduroStoveCard extends HTMLElement {
  constructor() {
    super();
    this._pendingTempValue = null;
    this._initialized = false;
    this._translations = { en: {} };
    this._lang = "en";
  }

  set hass(hass) {
    if (!this._initialized) {
      // store hass first so translation loader can use hass.language
      this._hass = hass;
      this._loadTranslations()
        .then(() => {
          this._initialize();
          this._updateContent();
        })
        .catch((e) => {
          console.error("Failed to load translations", e);
          // fall back to initialize anyway
          this._initialize();
          this._updateContent();
        });
    } else {
      this._hass = hass;
      this._updateContent();
    }
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("Please define an entity");
    }
    this._config = config;
    console.log("Card configured with entity:", config.entity);
  }

  async _loadTranslations() {
    try {
      // Determine language — prefer Home Assistant language if available
      const haLang =
        this._hass && this._hass.language ? this._hass.language : null;
      this._lang = (haLang || navigator.language || "en").split("-")[0];

      // Always keep 'en' as fallback
      const tryLang = this._lang || "en";

      const enUrl = `${TRANSLATIONS_BASE}/en.json`;
      const localUrl = `${TRANSLATIONS_BASE}/${tryLang}.json`;

      // Fetch English + local (might be same as en)
      const [enResp, localResp] = await Promise.all([
        fetch(enUrl)
          .then((r) => (r.ok ? r.json() : {}))
          .catch(() => ({})),
        fetch(localUrl)
          .then((r) => (r.ok ? r.json() : {}))
          .catch(() => ({})),
      ]);

      this._translations = { en: enResp || {}, [tryLang]: localResp || {} };
      this._lang = tryLang;
      console.info("Aduro Stove Card: translations loaded for", this._lang);
    } catch (e) {
      console.error("Aduro Stove Card: error loading translations", e);
      this._translations = { en: {} };
      this._lang = "en";
    }
  }

  _t(key) {
    // safe accessor: first try current language, then english, else key
    return (
      (this._translations[this._lang] && this._translations[this._lang][key]) ||
      (this._translations.en && this._translations.en[key]) ||
      key
    );
  }

  _initialize() {
    this._initialized = true;

    // use shadow root so styles do not leak
    this.attachShadow({ mode: "open" });

    const card = document.createElement("ha-card");
    card.innerHTML = `
      <style>
        .card-content {
          padding: 0;
        }
        
        /* Header Section */
		.header-section {
		  padding: 20px;
		  color: var(--primary-text-color);
		  border-radius: 16px; /* schöne abgerundete Ecken */
		  margin-top: 16px; /* Abstand nach oben zu anderen Karten */
		}
        
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .header-title {
          font-size: 24px;
          font-weight: 600;
        }
        
        .status-icons {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .status-icon {
          width: 28px;
          height: 28px;
          animation: spin 2s linear infinite;
          transform-origin: center center;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .hidden {
          display: none;
        }
        
        .status-main {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 4px;
          color: var(--primary-text-color);
        }
        
        .status-sub {
          font-size: 14px;
          opacity: 0.7;
		  color: var(--secondary-text-color);
        }     
		
		.status-display,
		.display-format {
		  background: var(--secondary-background-color);
		  border: 1px solid var(--divider-color);
		  padding: 12px 16px;
		  border-radius: 12px;
		  margin-bottom: 12px;
		  color: var(--primary-text-color);
		}
		
		.status-display {
		  background: var(--secondary-background-color);
		  border: 1px solid var(--divider-color);
		  color: var(--primary-text-color);
		  border-radius: 12px;
		}
        		
        .display-updating {
          font-size: 11px;
          opacity: 0.7;
        }
        
        /* Info Cards Section */
        .info-section {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          padding: 16px;
          background: var(--card-background-color);
        }
        
		.info-card {
		  background: var(--secondary-background-color);
		  border-radius: 12px;
		  padding: 16px; /* etwas mehr für perfekte Balance */
		  text-align: center;
		  border: 1px solid var(--divider-color);
		  position: relative;

		  display: flex;
		  flex-direction: column;
		  justify-content: center; 
		  align-items: center;
		}
        
        .info-label {
          font-size: 12px;
          color: var(--secondary-text-color);
          margin-bottom: 4px;
        }
        
        .info-value {
          font-size: 18px;
          font-weight: 600;
          color: var(--primary-text-color);
        }
        
		.refill-badge {
		  position: static;
		  margin-top: 6px;
		  font-size: 11px;
		  color: var(--secondary-text-color);
		  background: var(--secondary-background-color);
		  padding: 2px 6px;
		  border-radius: 8px;
		  border: 1px solid var(--divider-color);
		  display: inline-block;
		}
        
        /* Pellet Section - Hidden */
        .pellet-section {
          display: none;
        }
        
        .pellet-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .pellet-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--primary-text-color);
        }
        
        .refill-count {
          font-size: 12px;
          color: var(--secondary-text-color);
          background: var(--secondary-background-color);
          padding: 4px 12px;
          border-radius: 12px;
        }
        
        .pellet-bar {
          height: 40px;
          background: var(--divider-color);
          border-radius: 20px;
          overflow: hidden;
          position: relative;
        }
        
        .pellet-fill {
          height: 100%;
          background: var(--primary-color);
          transition: width 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-primary-color);
          font-weight: 700;
          font-size: 16px;
        }
        
        .pellet-fill.low {
          background: var(--error-color);
        }
        
        /* Control Buttons Section */
        .control-buttons {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          padding: 0 16px 16px 16px;
        }
        
        .control-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          border: 1px solid var(--divider-color);
          border-radius: 12px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
          background: var(--secondary-background-color);
          color: var(--primary-text-color);
        }
        
        .control-btn:active {
          transform: scale(0.95);
        }
        
        .control-btn.toggle-btn {
          background: var(--secondary-background-color);
          color: var(--secondary-text-color);
          border: 1px solid var(--divider-color);
        }
        
        .control-btn.toggle-btn.on {
          background: var(--primary-color);
          color: var(--text-primary-color);
          border: 1px solid var(--primary-color);
        }
        
        /* Adjusters Section */
        .adjusters-section {
          padding: 0 16px 16px 16px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        
        .adjuster-card {
          background: var(--card-background-color);
          border: 1px solid var(--divider-color);
          border-radius: 12px;
          padding: 12px;
        }
        
        .adjuster-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .adjuster-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--primary-text-color);
        }
        
        .adjuster-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--primary-color);
        }
        
        .adjuster-controls {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 8px;
          align-items: center;
        }
        
        .adjuster-btn {
          width: 32px;
          height: 32px;
          border: 1px solid var(--divider-color);
          border-radius: 8px;
          background: var(--secondary-background-color);
          color: var(--primary-text-color);
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .adjuster-btn:active {
          transform: scale(0.9);
        }
        
        .adjuster-display {
          text-align: center;
          font-size: 20px;
          font-weight: 700;
          color: var(--primary-text-color);
        }
        
        /* Action Buttons */
        .action-section {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          padding: 0 16px 16px 16px;
        }
        
        .action-btn {
          padding: 16px;
          border: 1px solid var(--divider-color);
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--secondary-background-color);
          color: var(--primary-text-color);
        }
        
        .action-btn:hover {
          background: var(--primary-color);
          color: var(--text-primary-color);
          border-color: var(--primary-color);
        }
        
        .action-btn:active {
          transform: scale(0.95);
        }
        
        ha-icon {
          --mdc-icon-size: 20px;
        }
      </style>
      
      <div class="card-content">
        <!-- Header Section -->
        <div class="header-section">
          <div class="header-top">
            <div class="header-title">${this._t("header_title")}</div>
            <div class="status-icons">
              <ha-icon class="status-icon hidden" id="change-icon" icon="mdi:sync"></ha-icon>
            </div>
          </div>
          
          <div class="status-display">
            <div class="status-main" id="status-main">-</div>
            <div class="status-sub" id="status-sub">-</div>
          </div>
          
          <div class="display-format">
            <div id="display-format">-</div>
            <div class="display-updating hidden" id="updating-text">${this._t(
              "updating_text"
            )}</div>
          </div>
        </div>
        
        <!-- Info Cards -->
        <div class="info-section">
          <div class="info-card">
            <div class="info-label">${this._t("info_label")}</div>
            <div class="info-value" id="smoke-temp">-</div>
          </div>
          <div class="info-card">
            <div class="info-label">${this._t("pellets_left")}</div>
            <div class="info-value" id="pellet-percent">-</div>
            <div class="refill-badge" id="refill-counter">0 ${this._t(
              "refills"
            )}</div>
          </div>
        </div>
        
        <!-- Pellet Bar -->
        <div class="pellet-section">
          <div class="pellet-header">
            <div class="pellet-label">${this._t("pellet_level")}</div>
            <div class="refill-count" id="refill-counter">0 ${this._t(
              "refills_since_cleaning"
            )}</div>
          </div>
          <div class="pellet-bar">
            <div class="pellet-fill" id="pellet-fill">0%</div>
          </div>
        </div>
        
        <!-- Control Buttons -->
        <div class="control-buttons">
          <button class="control-btn toggle-btn" id="power-btn">
            <ha-icon icon="mdi:power"></ha-icon>
            <span>${this._t("power")}</span>
          </button>
          <button class="control-btn" id="toggle-mode-btn">
            <ha-icon icon="mdi:sync"></ha-icon>
            <span>${this._t("toggle_mode")}</span>
          </button>
        </div>
        
        <!-- Heat Level Adjuster -->
        <div class="adjusters-section">
          <div class="adjuster-card">
            <div class="adjuster-header">
              <div class="adjuster-label">${this._t("heat_level")}</div>
              <div class="adjuster-value" id="heat-level-display">-</div>
            </div>
            <div class="adjuster-controls">
              <button class="adjuster-btn" id="heat-down">−</button>
              <div class="adjuster-display" id="heat-level-value">3</div>
              <button class="adjuster-btn" id="heat-up">+</button>
            </div>
          </div>
          
          <!-- Temperature Adjuster -->
          <div class="adjuster-card">
            <div class="adjuster-header">
              <div class="adjuster-label">${this._t("target_temperature")}</div>
            </div>
            <div class="adjuster-controls">
              <button class="adjuster-btn" id="temp-down">−</button>
              <div class="adjuster-display" id="temp-value">20°C</div>
              <button class="adjuster-btn" id="temp-up">+</button>
            </div>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="action-section">
          <button class="action-btn" id="clean-btn">
            <ha-icon icon="mdi:broom"></ha-icon>
            <span>${this._t("stove_cleaned")}</span>
          </button>
          <button class="action-btn" id="refill-btn">
            <ha-icon icon="mdi:reload"></ha-icon>
            <span>${this._t("pellets_refilled")}</span>
          </button>
          <button class="control-btn toggle-btn" id="auto-resume-btn">
            <ha-icon icon="mdi:play-circle"></ha-icon>
            <span>${this._t("auto_resume")}</span>
          </button>
          <button class="control-btn toggle-btn" id="auto-shutdown-btn">
            <ha-icon icon="mdi:power-settings"></ha-icon>
            <span>${this._t("auto_shutdown")}</span>
          </button>
        </div>
      </div>
    `;

    // append to shadow root
    this.shadowRoot.appendChild(card);

    // setup listeners (use shadowRoot selectors)
    this._setupEventListeners();
  }

  _getEntityId(suffix, domain = null) {
    // Extract base name from entity (e.g., "sensor.aduro_h2" -> "aduro_h2")
    const baseEntity = this._config.entity;
    const parts = baseEntity.split(".");
    const baseName = parts.length > 1 ? parts[1] : parts[0];

    // Map internal names to actual entity names
    const entityMap = {
      // Switches
      power: "switch.power",
      auto_shutdown: "switch.auto_shutdown_at_low_pellets",
      auto_resume_wood: "switch.auto_resume_after_wood_mode",

      // Numbers
      heatlevel: "number.heat_level",
      temperature: "number.target_temperature",
      pellet_capacity: "number.pellet_capacity",
      notification_level: "number.low_pellet_notification_level",
      shutdown_level: "number.auto_shutdown_pellet_level",

      // Buttons
      toggle_mode: "button.toggle_mode",
      refill_pellets: "button.refill_pellets",
      clean_stove: "button.clean_stove",
      resume_after_wood: "button.resume_after_wood_mode",
      force_auger: "button.force_auger",

      // Sensors
      status_main: "sensor.status_main",
      status_sub: "sensor.status_sub",
      change_in_progress: "sensor.change_in_progress",
      display_format: "sensor.display_format",
      smoke_temp: "sensor.smoke_temperature",
      pellet_percentage: "sensor.pellet_percentage",
      refill_counter: "sensor.refill_counter",
    };

    const mapped = entityMap[suffix];
    if (mapped) {
      const [mappedDomain, mappedName] = mapped.split(".");
      return `${mappedDomain}.${baseName}_${mappedName}`;
    }

    // Fallback for unmapped entities
    if (!domain) {
      domain = "sensor";
    }
    return `${domain}.${baseName}_${suffix}`;
  }

  _setupEventListeners() {
    // Power button
    const powerBtn = this.shadowRoot.querySelector("#power-btn");
    powerBtn.addEventListener("click", () => {
      const entityId = this._getEntityId("power");
      const powerEntity = this._hass.states[entityId];
      const isOn = powerEntity && powerEntity.state === "on";

      const message = isOn
        ? this._t("confirm_turn_off")
        : this._t("confirm_turn_on");

      if (confirm(message)) {
        this._hass.callService("switch", "toggle", { entity_id: entityId });
      }
    });

    // Toggle mode button
    const toggleBtn = this.shadowRoot.querySelector("#toggle-mode-btn");
    toggleBtn.addEventListener("click", () => {
      const entityId = this._getEntityId("toggle_mode");
      this._hass.callService("button", "press", { entity_id: entityId });
    });

    // Auto resume button
    const autoResumeBtn = this.shadowRoot.querySelector("#auto-resume-btn");
    autoResumeBtn.addEventListener("click", () => {
      const entityId = this._getEntityId("auto_resume_wood");
      this._hass.callService("switch", "toggle", { entity_id: entityId });
    });

    // Auto shutdown button
    const autoShutdownBtn = this.shadowRoot.querySelector("#auto-shutdown-btn");
    autoShutdownBtn.addEventListener("click", () => {
      const entityId = this._getEntityId("auto_shutdown");
      this._hass.callService("switch", "toggle", { entity_id: entityId });
    });

    // Heat level controls
    const heatUpBtn = this.shadowRoot.querySelector("#heat-up");
    heatUpBtn.addEventListener("click", (e) => {
      const entityId = this._getEntityId("heatlevel");
      const currentEntity = this._hass.states[entityId];
      if (currentEntity) {
        const currentValue = parseFloat(currentEntity.state);
        const newValue = Math.min(currentValue + 1, 3);
        this._hass.callService("number", "set_value", {
          entity_id: entityId,
          value: newValue,
        });
      }
      setTimeout(() => e.currentTarget.blur(), 100);
    });

    const heatDownBtn = this.shadowRoot.querySelector("#heat-down");
    heatDownBtn.addEventListener("click", (e) => {
      const entityId = this._getEntityId("heatlevel");
      const currentEntity = this._hass.states[entityId];
      if (currentEntity) {
        const currentValue = parseFloat(currentEntity.state);
        const newValue = Math.max(currentValue - 1, 1);
        this._hass.callService("number", "set_value", {
          entity_id: entityId,
          value: newValue,
        });
      }
      setTimeout(() => e.currentTarget.blur(), 100);
    });

    // Temperature controls
    const tempUpBtn = this.shadowRoot.querySelector("#temp-up");
    tempUpBtn.addEventListener("click", (e) => {
      const entityId = this._getEntityId("temperature");
      const currentEntity = this._hass.states[entityId];
      if (currentEntity) {
        // Use pending value if available, otherwise use actual value
        const currentValue =
          this._pendingTempValue !== null
            ? this._pendingTempValue
            : parseFloat(currentEntity.state);
        const newValue = Math.min(currentValue + 1, 35);

        // Update display immediately
        this._pendingTempValue = newValue;
        this.shadowRoot.querySelector(
          "#temp-value"
        ).textContent = `${newValue}°C`;

        // Send command
        this._hass.callService("number", "set_value", {
          entity_id: entityId,
          value: newValue,
        });

        // Clear pending value after 5 seconds
        clearTimeout(this._tempTimeout);
        this._tempTimeout = setTimeout(() => {
          this._pendingTempValue = null;
          this._updateContent();
        }, 5000);
      }
      setTimeout(() => e.currentTarget.blur(), 100);
    });

    const tempDownBtn = this.shadowRoot.querySelector("#temp-down");
    tempDownBtn.addEventListener("click", (e) => {
      const entityId = this._getEntityId("temperature");
      const currentEntity = this._hass.states[entityId];
      if (currentEntity) {
        // Use pending value if available, otherwise use actual value
        const currentValue =
          this._pendingTempValue !== null
            ? this._pendingTempValue
            : parseFloat(currentEntity.state);
        const newValue = Math.max(currentValue - 1, 5);

        // Update display immediately
        this._pendingTempValue = newValue;
        this.shadowRoot.querySelector(
          "#temp-value"
        ).textContent = `${newValue}°C`;

        // Send command
        this._hass.callService("number", "set_value", {
          entity_id: entityId,
          value: newValue,
        });

        // Clear pending value after 5 seconds
        clearTimeout(this._tempTimeout);
        this._tempTimeout = setTimeout(() => {
          this._pendingTempValue = null;
          this._updateContent();
        }, 5000);
      }
      setTimeout(() => e.currentTarget.blur(), 100);
    });

    // Action buttons
    const cleanBtn = this.shadowRoot.querySelector("#clean-btn");
    cleanBtn.addEventListener("click", () => {
      const entityId = this._getEntityId("clean_stove");
      this._hass.callService("button", "press", { entity_id: entityId });
    });

    const refillBtn = this.shadowRoot.querySelector("#refill-btn");
    refillBtn.addEventListener("click", () => {
      const entityId = this._getEntityId("refill_pellets");
      this._hass.callService("button", "press", { entity_id: entityId });
    });
  }

  _updateContent() {
    if (!this._hass || !this._config) return;

    // Debug: Log all available entities that match our pattern
    const baseEntity = this._config.entity;
    const parts = baseEntity.split(".");
    const baseName = parts.length > 1 ? parts[1] : parts[0];

    console.log("Looking for entities matching:", baseName);
    const matchingEntities = Object.keys(this._hass.states).filter((e) =>
      e.includes(baseName)
    );
    console.log("All matching entities:", matchingEntities); // Show all

    // Update status displays
    const statusMainEntity =
      this._hass.states[this._getEntityId("status_main")];
    if (statusMainEntity) {
      this.shadowRoot.querySelector("#status-main").textContent =
        statusMainEntity.state;
    }

    const statusSubEntity = this._hass.states[this._getEntityId("status_sub")];
    if (statusSubEntity) {
      this.shadowRoot.querySelector("#status-sub").textContent =
        statusSubEntity.state;
    }

    // Update change in progress
    const changeInProgressEntity =
      this._hass.states[this._getEntityId("change_in_progress")];
    const changeIcon = this.shadowRoot.querySelector("#change-icon");
    const updatingText = this.shadowRoot.querySelector("#updating-text");

    if (changeInProgressEntity && changeInProgressEntity.state === "true") {
      changeIcon.classList.remove("hidden");
      updatingText.classList.remove("hidden");
    } else {
      changeIcon.classList.add("hidden");
      updatingText.classList.add("hidden");
    }

    // Update display format
    const displayFormatEntity =
      this._hass.states[this._getEntityId("display_format")];
    if (displayFormatEntity) {
      this.shadowRoot.querySelector("#display-format").textContent =
        displayFormatEntity.state;
    }

    // Update smoke temperature
    const smokeTempEntity = this._hass.states[this._getEntityId("smoke_temp")];
    if (smokeTempEntity && smokeTempEntity.state !== "unavailable") {
      const temp = Math.round(parseFloat(smokeTempEntity.state));
      this.shadowRoot.querySelector("#smoke-temp").textContent = `${temp}°C`;
    } else {
      this.shadowRoot.querySelector("#smoke-temp").textContent = "N/A";
    }

    // Update pellet percentage
    const pelletEntity =
      this._hass.states[this._getEntityId("pellet_percentage")];
    if (pelletEntity) {
      const percentage = parseInt(pelletEntity.state) || 0;
      this.shadowRoot.querySelector(
        "#pellet-percent"
      ).textContent = `${percentage}%`;

      const pelletFill = this.shadowRoot.querySelector("#pellet-fill");
      pelletFill.style.width = `${percentage}%`;
      pelletFill.textContent = `${percentage}%`;

      if (percentage <= 20) {
        pelletFill.classList.add("low");
      } else {
        pelletFill.classList.remove("low");
      }
    }

    // Update refill counter
    const refillCounterEntity =
      this._hass.states[this._getEntityId("refill_counter")];
    if (refillCounterEntity) {
      const count = parseInt(refillCounterEntity.state) || 0;
      this.shadowRoot.querySelector(
        "#refill-counter"
      ).textContent = `${count} ${this._t("refills")}`;
    }

    // Update power button
    const powerEntity = this._hass.states[this._getEntityId("power")];
    const powerBtn = this.shadowRoot.querySelector("#power-btn");
    if (powerEntity && powerEntity.state === "on") {
      powerBtn.classList.add("on");
    } else {
      powerBtn.classList.remove("on");
    }

    // Update auto resume button
    const autoResumeEntity =
      this._hass.states[this._getEntityId("auto_resume_wood")];
    const autoResumeBtn = this.shadowRoot.querySelector("#auto-resume-btn");
    if (autoResumeEntity && autoResumeEntity.state === "on") {
      autoResumeBtn.classList.add("on");
    } else {
      autoResumeBtn.classList.remove("on");
    }

    // Update auto shutdown button
    const autoShutdownEntity =
      this._hass.states[this._getEntityId("auto_shutdown")];
    const autoShutdownBtn = this.shadowRoot.querySelector("#auto-shutdown-btn");
    if (autoShutdownEntity && autoShutdownEntity.state === "on") {
      autoShutdownBtn.classList.add("on");
    } else {
      autoShutdownBtn.classList.remove("on");
    }

    // Update heat level
    const heatLevelEntity = this._hass.states[this._getEntityId("heatlevel")];
    if (heatLevelEntity) {
      const level = parseInt(heatLevelEntity.state);
      this.shadowRoot.querySelector("#heat-level-value").textContent = level;
    }

    // Update temperature
    const tempEntity = this._hass.states[this._getEntityId("temperature")];
    if (tempEntity) {
      // Use pending value if available, otherwise use actual value
      const temp =
        this._pendingTempValue !== null
          ? this._pendingTempValue
          : parseFloat(tempEntity.state);
      this.shadowRoot.querySelector("#temp-value").textContent = `${temp}°C`;
    }
  }

  getCardSize() {
    return 8;
  }
}

customElements.define("aduro-stove-card", AduroStoveCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "aduro-stove-card",
  name: "Aduro Stove Card",
  description: "A custom card for controlling Aduro stoves",
});
