sap.ui.define(['sap/ui/model/json/JSONModel'], function (JSONModel) {
  'use strict';

  const pomodoroDefaultSettings = {
    pomodoro: {
      name: 'Working',
      msTotal: 1500000,
    },
    shortBreak: {
      name: 'Short break',
      msTotal: 300000,
    },
    longBreak: {
      name: 'Long break',
      msTotal: 900000,
    },
    minFocus: {
      msTotal: 600000,
    },
    appearance: {
      theme: 'dark',
    },
    notification: {
      desktopNotification: false,
      soundUrl: '/assets/boxing_gong.mp3',
    },
    history: {
      session: true,
      persistent: false,
      calenderStartHour: 6,
      calenderEndHour: 20
    },
  };

  const Config = JSONModel.extend(
    'sap.ui.demo.basicTemplate.model.SettingsModel',
    {
      modelname: 'Config',

      tie(handler) {
        handler.getOwnerComponent().setModel(this, this.modelname);
      },

      init() {
        const { msTotal } = this.getProperty('/settings/pomodoro');
        this.setTimer(msTotal);
      },

      saveUserSettings() {
        const { settings } = this.getData();
        localStorage.setItem(
          'pomodoro-user-settings',
          JSON.stringify(settings)
        );
      },

      syncUserSettings() {
        const settings = localStorage.getItem('pomodoro-user-settings');
        if (!!settings) {
          this.setProperty('/settings', JSON.parse(settings));
          return true;
        } else {
          return false;
        }
      },

      resetUserSettings() {
        // FIXME: after one reset, a second reset is not possible
        this.setProperty('/settings', { ...pomodoroDefaultSettings });
      },
    }
  );

  return new Config({
    settings: { ...pomodoroDefaultSettings },
  });
});
