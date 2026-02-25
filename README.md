[![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://www.paypal.com/donate/?hosted_button_id=W6WPMAQ3YKK6G)
[![GitHub release](https://img.shields.io/github/release/NewImproved/Aduro-Stove-Card.svg)](https://github.com/NewImproved/Aduro-Stove-Card/releases)

# Aduro Stove Card

A custom Lovelace card for controlling Aduro Hybrid Stoves in Home Assistant.

<img width="510" height="826" alt="image" src="https://github.com/user-attachments/assets/f1f9c795-1a7b-4af0-899d-4ffb7a064266" />




## Features

- **Real-time Status Display** - Shows current stove state and operation mode
- **Temperature & Heat Level Control** - Easy +/- buttons for quick adjustments
- **Pellet Monitoring** - Visual pellet level indicator and a consumption since cleaning indicator
- **Depletion time** - Time and date for when stove either stops due to no pellets or target temperature is reached. More information in the integration.
- **CO level** - CO level indicator with the yellow and red thresholds
- **Power Control** - Start/stop the stove with a single tap
- **Mode Toggle** - Switch between Heat Level and Temperature modes
- **Alarm reset button** - Resets alarm
- **Force fan** - Forces fan for the configured time.
- **Auto-Resume & Auto-Shutdown** - Configure automatic behavior for wood mode and low pellet levels
- **Maintenance Tracking** - Quick access to pellet refill and stove cleaning buttons
- **Change Indicator** - Visual feedback when stove settings are updating

## Languages

- English
- French
- German
- Swedish
- Easy to add more languages

  
## Installation

### HACS (Recommended)

1. Open HACS in Home Assistant
2. Click the menu (three dots) in the top right
3. Select "Custom repositories"
4. Add this repository URL: `https://github.com/NewImproved/Aduro-Stove-Card`
5. Select category: "Dashboard"
6. Click "Add"
7. Search for "Aduro Stove Card" and install
8. Restart Home Assistant

### Manual Installation

1. Download `aduro-stove-card.js` from the latest release
2. Copy it to your `config/www` folder
3. Add the following to your Lovelace resources:

```yaml
resources:
  - url: /local/aduro-stove-card.js
    type: module
```

4. Restart Home Assistant

## Configuration

Add the card to your Lovelace dashboard:

```yaml
type: custom:aduro-stove-card
entity: sensor.aduro_h2 [Your stove]
title: My Custom Title
debug: false
```

### Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `entity` | string | Yes | - | The base entity for your Aduro stove (e.g., `sensor.aduro_h2`) |
| `debug` | boolean | No | false | enable debug logging to the console |

## Requirements

This card requires the [Aduro Hybrid Stove integration](https://github.com/NewImproved/Aduro) to be installed and configured in Home Assistant.

The card expects the following entities to be available:
- Sensors: `state`, `substate`, `display_format`, `smoke_temperature`, `pellet_percentage`, `consumption_since_cleaning`, `change_in_progress`, `carbon_monoxide`, `carbon_monoxide_yellow`, `carbon_monoxide_red`, `pellet_depletion`
- Switches: `power`, `auto_shutdown_at_low_pellets`, `auto_resume_after_wood_mode`, `force_fan`
- Numbers: `heat_level`, `target_temperature`
- Buttons: `toggle_mode`, `refill_pellets`, `clean_stove`, `reset_alarm`

## Usage

### Heat Level Control
- Use the +/- buttons in the Heat Level section to adjust between levels 1-3
- Changes take effect immediately

### Temperature Control
- Use the +/- buttons in the Target Temperature section to adjust between 5-35°C
- The display updates instantly while the stove processes the command

### Power Control
- Toggle the Power button to start or stop the stove
- The button shows the current state (ON/OFF)

### Mode Toggle
- Press the Toggle Mode button to switch between Heat Level and Temperature control modes
- A spinning icon appears while the mode change is in progress

### Maintenance
- **Pellets Refilled**: Press after refilling pellets to reset the consumption counter
- **Stove Cleaned**: Press after cleaning to reset the refill counter
- **Auto Resume**: Enable to automatically resume pellet operation after wood mode if the stove is in heat level mode
- **Auto Shutdown**: Enable to automatically shut down when pellet level is below you preset in the integration

### Force Fan
- Toggle the Force fan button to start or stop the fan.
- The button shows the current state (ON/OFF)

### Alarm Reset
- Press alarm reset button reset alarm.

## Customization

The card automatically adapts to your Home Assistant theme, using theme variables for colors and styling.

## Troubleshooting

**Card doesn't appear or shows error**
- Verify the Aduro integration is installed and working
- Check that the entity name in your configuration matches your actual entity
- Clear browser cache and refresh the page

**Buttons don't respond**
- Check browser console (F12) for errors
- Verify all required entities exist in Home Assistant
- Ensure the integration is connected to your stove

**Display shows "N/A" or dashes**
- The stove may be disconnected or the integration may be starting up
- Check the integration logs for connection issues

## Support

For issues, questions, or feature requests, please open an issue on the [GitHub repository](https://github.com/NewImproved/Aduro-Stove-Card/issues).

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Credits

Created for use with the [Aduro Hybrid Stove integration](https://github.com/NewImproved/Aduro) for Home Assistant.
