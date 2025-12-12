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
      this._hass = hass;
      this._loadTranslations()
        .then(() => {
          this._initialize();
          this._updateContent();
        })
        .catch((e) => {
          console.error("Failed to load translations", e);
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
    
    if (this._initialized) {
      this._updateTitle();
    }
  }

  async _loadTranslations() {
    try {
      const haLang =
        this._hass && this._hass.language ? this._hass.language : null;
      this._lang = (haLang || navigator.language || "en").split("-")[0];

      const tryLang = this._lang || "en";

      const enUrl = `${TRANSLATIONS_BASE}/en.json`;
      const localUrl = `${TRANSLATIONS_BASE}/${tryLang}.json`;

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
    return (
      (this._translations[this._lang] && this._translations[this._lang][key]) ||
      (this._translations.en && this._translations.en[key]) ||
      key
    );
  }

  _getTitle() {
    return this._config.title || this._t("header_title");
  }

  _updateTitle() {
    const titleElement = this.shadowRoot.querySelector(".header-title");
    if (titleElement) {
      titleElement.textContent = this._getTitle();
    }
  }
	
  _initialize() {
    this._initialized = true;

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
		  border-radius: 16px;
		  margin-top: 16px;
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
		  padding: 16px;
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

        /* Carbon Monoxide Bar Section */
        .co-section {
          padding: 0 16px 8px 16px;
        }

        .co-bar-wrapper {
          position: relative;
          height: 12px;
          background: var(--divider-color);
          border-radius: 6px;
          overflow: visible;
        }

        .co-bar-fill {
          position: absolute;
          height: 100%;
          background: #4caf50;
          left: 0;
          border-radius: 6px;
          transition: width 0.3s ease;
        }

        .co-marker {
          position: absolute;
          width: 3px;
          height: 100%;
          top: 0;
          transition: left 0.3s ease;
        }

        .co-marker.yellow {
          background: #ffc107;
          z-index: 2;
        }

        .co-marker.red {
          background: #f44336;
          z-index: 3;
        }

        /* Consumption Card - Part of action grid */
        .consumption-card {
          background: var(--secondary-background-color);
          border: 1px solid var(--divider-color);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 4px;
        }
        
        .consumption-label {
          font-size: 12px;
          color: var(--secondary-text-color);
        }
        
        .consumption-value {
          font-size: 16px;
          font-weight: 600;
          color: var(--primary-text-color);
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
        
        /* Action Buttons - Now 2x2 grid */
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
            <div class="header-title">${this._getTitle()}</div>
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
            <div class="display-updating hidden" id="updating-text">${this._t("updating_text")}</div>
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
          </div>
        </div>

        <!-- Carbon Monoxide Bar -->
        <div class="co-section">
          <div class="co-bar-wrapper">
            <div class="co-bar-fill" id="co-bar-fill"></div>
            <div class="co-marker yellow" id="co-marker-yellow"></div>
            <div class="co-marker red" id="co-marker-red"></div>
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
        
        <!-- Action Buttons with Consumption -->
        <div class="action-section">
          <div class="consumption-card">
            <div class="consumption-header">
              <div class="consumption-label">${this._t("since_cleaning")}</div>
              <div class="consumption-value" id="consumption-display">0 kg</div>
            </div>
          </div>
          <button class="action-btn" id="clean-btn">
            <ha-icon icon="mdi:broom"></ha-icon>
            <span>${this._t("stove_cleaned")}</span>
          </button>
          <button class="control-btn toggle-btn" id="auto-shutdown-btn">
            <ha-icon icon="mdi:power-settings"></ha-icon>
            <span>${this._t("auto_shutdown")}</span>
          </button>
          <button class="control-btn toggle-btn" id="auto-resume-btn">
            <ha-icon icon="mdi:play-circle"></ha-icon>
            <span>${this._t("auto_resume")}</span>
          </button>
        </div>
      </div>
    `;

    this.shadowRoot.appendChild(card);
    this._setupEventListeners();
  }

  _getEntityId(suffix, domain = null) {
    const baseEntity = this._config.entity;
    const parts = baseEntity.split(".");
    const baseName = parts.length > 1 ? parts[1] : parts[0];

    const entityMap = {
      power: "switch.power",
      auto_shutdown: "switch.auto_shutdown_at_low_pellets",
      auto_resume_wood: "switch.auto_resume_after_wood_mode",
      heatlevel: "number.heat_level",
      temperature: "number.target_temperature",
      pellet_capacity: "number.pellet_capacity",
      notification_level: "number.low_pellet_notification_level",
      shutdown_level: "number.auto_shutdown_pellet_level",
      toggle_mode: "button.toggle_mode",
      refill_pellets: "button.refill_pellets",
      clean_stove: "button.clean_stove",
      resume_after_wood: "button.resume_after_wood_mode",
      force_auger: "button.force_auger",
      status_main: "sensor.status_main",
      status_sub: "sensor.status_sub",
      change_in_progress: "sensor.change_in_progress",
      display_format: "sensor.display_format",
      smoke_temp: "sensor.smoke_temp",
      pellet_percentage: "sensor.pellet_percentage",
      refill_counter: "sensor.refill_counter",
      consumption_since_cleaning: "sensor.consumption_since_cleaning",
      carbon_monoxide: "sensor.carbon_monoxide",
      carbon_monoxide_yellow: "sensor.carbon_monoxide_yellow",
      carbon_monoxide_red: "sensor.carbon_monoxide_red",
    };

    const mapped = entityMap[suffix];
    if (mapped) {
      const [mappedDomain, mappedName] = mapped.split(".");
      return `${mappedDomain}.${baseName}_${mappedName}`;
    }

    if (!domain) {
      domain = "sensor";
    }
    return `${domain}.${baseName}_${suffix}`;
  }

  _setupEventListeners() {
    const powerBtn = this.shadowRoot.querySelector("#power-btn");
    powerBtn.addEventListener("click", () => {
      const entityId = this._getEntityId("power");
      const powerEntity = this._hass.states[entityId];
      const isOn = powerEntity && powerEntity.state === "on";
      const message = isOn ? this._t("confirm_turn_off") : this._t("confirm_turn_on");
      if (confirm(message)) {
        this._hass.callService("switch", "toggle", { entity_id: entityId });
      }
    });

    const toggleBtn = this.shadowRoot.querySelector("#toggle-mode-btn");
    toggleBtn.addEventListener("click", () => {
      const entityId = this._getEntityId("toggle_mode");
      this._hass.callService("button", "press", { entity_id: entityId });
    });

    const autoResumeBtn = this.shadowRoot.querySelector("#auto-resume-btn");
    autoResumeBtn.addEventListener("click", () => {
      const entityId = this._getEntityId("auto_resume_wood");
      this._hass.callService("switch", "toggle", { entity_id: entityId });
    });

    const autoShutdownBtn = this.shadowRoot.querySelector("#auto-shutdown-btn");
    autoShutdownBtn.addEventListener("click", () => {
      const entityId = this._getEntityId("auto_shutdown");
      this._hass.callService("switch", "toggle", { entity_id: entityId });
    });

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

    const tempUpBtn = this.shadowRoot.querySelector("#temp-up");
    tempUpBtn.addEventListener("click", (e) => {
      const entityId = this._getEntityId("temperature");
      const currentEntity = this._hass.states[entityId];
      if (currentEntity) {
        const currentValue = this._pendingTempValue !== null ? this._pendingTempValue : parseFloat(currentEntity.state);
        const newValue = Math.min(currentValue + 1, 35);
        this._pendingTempValue = newValue;
        this.shadowRoot.querySelector("#temp-value").textContent = `${newValue}°C`;
        this._hass.callService("number", "set_value", {
          entity_id: entityId,
          value: newValue,
        });
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
        const currentValue = this._pendingTempValue !== null ? this._pendingTempValue : parseFloat(currentEntity.state);
        const newValue = Math.max(currentValue - 1, 5);
        this._pendingTempValue = newValue;
        this.shadowRoot.querySelector("#temp-value").textContent = `${newValue}°C`;
        this._hass.callService("number", "set_value", {
          entity_id: entityId,
          value: newValue,
        });
        clearTimeout(this._tempTimeout);
        this._tempTimeout = setTimeout(() => {
          this._pendingTempValue = null;
          this._updateContent();
        }, 5000);
      }
      setTimeout(() => e.currentTarget.blur(), 100);
    });

    const cleanBtn = this.shadowRoot.querySelector("#clean-btn");
    cleanBtn.addEventListener("click", () => {
      const entityId = this._getEntityId("clean_stove");
      this._hass.callService("button", "press", { entity_id: entityId });
    });
  }

  _updateContent() {
    if (!this._hass || !this._config) return;

    const baseEntity = this._config.entity;
    const parts = baseEntity.split(".");
    const baseName = parts.length > 1 ? parts[1] : parts[0];

    console.log("Looking for entities matching:", baseName);
    const matchingEntities = Object.keys(this._hass.states).filter((e) => e.includes(baseName));
    console.log("All matching entities:", matchingEntities);

    const statusMainEntity = this._hass.states[this._getEntityId("status_main")];
    if (statusMainEntity) {
      this.shadowRoot.querySelector("#status-main").textContent = statusMainEntity.state;
    }

    const statusSubEntity = this._hass.states[this._getEntityId("status_sub")];
    if (statusSubEntity) {
      this.shadowRoot.querySelector("#status-sub").textContent = statusSubEntity.state;
    }

    const changeInProgressEntity = this._hass.states[this._getEntityId("change_in_progress")];
    const changeIcon = this.shadowRoot.querySelector("#change-icon");
    const updatingText = this.shadowRoot.querySelector("#updating-text");

    if (changeInProgressEntity && changeInProgressEntity.state === "true") {
      changeIcon.classList.remove("hidden");
      updatingText.classList.remove("hidden");
    } else {
      changeIcon.classList.add("hidden");
      updatingText.classList.add("hidden");
    }

    const displayFormatEntity = this._hass.states[this._getEntityId("display_format")];
    if (displayFormatEntity) {
      this.shadowRoot.querySelector("#display-format").textContent = displayFormatEntity.state;
    }

    const smokeTempEntity = this._hass.states[this._getEntityId("smoke_temp")];
    if (smokeTempEntity && smokeTempEntity.state !== "unavailable") {
      const temp = Math.round(parseFloat(smokeTempEntity.state));
      this.shadowRoot.querySelector("#smoke-temp").textContent = `${temp}°C`;
    } else {
      this.shadowRoot.querySelector("#smoke-temp").textContent = "N/A";
    }

    const coEntity = this._hass.states[this._getEntityId("carbon_monoxide")];
    const coYellowEntity = this._hass.states[this._getEntityId("carbon_monoxide_yellow")];
    const coRedEntity = this._hass.states[this._getEntityId("carbon_monoxide_red")];

    console.log("CO Entity:", coEntity ? coEntity.state : "not found");
    console.log("CO Yellow Entity:", coYellowEntity ? coYellowEntity.state : "not found");
    console.log("CO Red Entity:", coRedEntity ? coRedEntity.state : "not found");

    if (coEntity && coYellowEntity && coRedEntity) {
      const coValue = parseFloat(coEntity.state) || 200;
      const coYellowValue = parseFloat(coYellowEntity.state) || 800;
      const coRedValue = parseFloat(coRedEntity.state) || 900;
      const maxValue = 1000;

      const greenWidth = Math.min((coValue / maxValue) * 100, 100);
      const yellowPos = Math.min((coYellowValue / maxValue) * 100, 100);
      const redPos = Math.min((coRedValue / maxValue) * 100, 100);

      console.log("CO Bar - Green width:", greenWidth, "Yellow pos:", yellowPos, "Red pos:", redPos);

      const fillBar = this.shadowRoot.querySelector("#co-bar-fill");
      const yellowMarker = this.shadowRoot.querySelector("#co-marker-yellow");
      const redMarker = this.shadowRoot.querySelector("#co-marker-red");

      if (fillBar && yellowMarker && redMarker) {
        fillBar.style.width = `${greenWidth}%`;
        yellowMarker.style.left = `${yellowPos}%`;
        redMarker.style.left = `${redPos}%`;
      }
    }

    const pelletEntity = this._hass.states[this._getEntityId("pellet_percentage")];
    if (pelletEntity) {
      const percentage = parseInt(pelletEntity.state) || 0;
      this.shadowRoot.querySelector("#pellet-percent").textContent = `${percentage}%`;
    }

    const consumptionEntity = this._hass.states[this._getEntityId("consumption_since_cleaning")];
    if (consumptionEntity) {
      const consumption = parseFloat(consumptionEntity.state) || 0;
      const consumptionElement = this.shadowRoot.querySelector("#consumption-display");
      if (consumptionElement) {
        consumptionElement.textContent = `${consumption} kg`;
      }
      console.log("Consumption since cleaning value:", consumption);
    }

    const powerEntity = this._hass.states[this._getEntityId("power")];
    const powerBtn = this.shadowRoot.querySelector("#power-btn");
    if (powerEntity && powerEntity.state === "on") {
      powerBtn.classList.add("on");
    } else {
      powerBtn.classList.remove("on");
    }

    const autoResumeEntity = this._hass.states[this._getEntityId("auto_resume_wood")];
    const autoResumeBtn = this.shadowRoot.querySelector("#auto-resume-btn");
    if (autoResumeEntity && autoResumeEntity.state === "on") {
      autoResumeBtn.classList.add("on");
    } else {
      autoResumeBtn.classList.remove("on");
    }

    const autoShutdownEntity = this._hass.states[this._getEntityId("auto_shutdown")];
    const autoShutdownBtn = this.shadowRoot.querySelector("#auto-shutdown-btn");
    if (autoShutdownEntity && autoShutdownEntity.state === "on") {
      autoShutdownBtn.classList.add("on");
    } else {
      autoShutdownBtn.classList.remove("on");
    }

    const heatLevelEntity = this._hass.states[this._getEntityId("heatlevel")];
    if (heatLevelEntity) {
      const level = parseInt(heatLevelEntity.state);
      this.shadowRoot.querySelector("#heat-level-value").textContent = level;
    }

    const tempEntity = this._hass.states[this._getEntityId("temperature")];
    if (tempEntity) {
      const temp = this._pendingTempValue !== null ? this._pendingTempValue : parseFloat(tempEntity.state);
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
