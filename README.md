<SPAN ALIGN="CENTER">

[![homebridge-connect-my-pool-home-automation: Native HomeKit support for Astral Connect My Pool](https://github.com/michaelpettorosso/homebridge-connect-my-pool-home-automation)

# Homebridge Astral Connect My Pool Home Automation

[![Downloads](https://img.shields.io/npm/dt/homebridge-connect-my-pool-home-automation?color=38A8E0&style=for-the-badge)](https://www.npmjs.com/package/homebridge-connect-my-pool-home-automation)
[![Version](https://img.shields.io/npm/v/homebridge-connect-my-pool-home-automation?label=homebridge-connect-my-pool-home-automation&color=38A8E0&style=for-the-badge)](https://www.npmjs.com/package/homebridge-connect-my-pool-home-automation)
## HomeKit support for Astral Connect My Pool using Home Automation API with [Homebridge] (https://homebridge.io).
</SPAN>

`homebridge-connect-my-pool-home-automation` is a plugin for Homebridge intended to give you an integrated experience with your [Astral Connect My Pool](https://connectmypool.com.au) devices.

It currently only provides the HomeKit thermostat and sensor information services which includes current temperature, target tempertaure, and pool pump status via contact sensors.

## Installation

If you are new to Homebridge, please first read the Homebridge [documentation](https://www.npmjs.com/package/homebridge).

1. Install Homebridge:
```sh
sudo npm install -g --unsafe-perm homebridge
```

2. Install homebridge-connect-my-pool-home-automation:
```sh
sudo npm install -g --unsafe-perm homebridge-connect-my-pool-home-automation
```

## Plugin configuration
Add the platform in `config.json` in your home directory inside `.homebridge` and edit the required fields.

```js
"platforms": [
  {
    "name": "Connect My Pool Home Automation",
    "apikey": "apikey",
    "latitude": latitude,
    "longitude": longitude,
    "platform": "ConnectMyPoolHomeAutomation"
  }
]
```

### Notes


Only tested with my setup, I have EVO pool pump, EVO gas heater, spa jets and spa blower and lights.
