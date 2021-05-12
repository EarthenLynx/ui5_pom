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
    },
  };

  const Pomodoro = JSONModel.extend(
    'sap.ui.demo.basicTemplate.model.PomodoroModel',
    {
      modelname: 'Pomodoro',

      tie(handler) {
        handler.getOwnerComponent().setModel(this, this.modelname);
      },

      init() {
        const { msTotal } = this.getProperty('/settings/pomodoro');
        this.setTimer(msTotal);
      },

      setStatusNext() {
        const { isWorking, isPausing } =
          this.getProperty('/status');
        if ((this.getProperty("/timer/counter")) / 8 >= 1 && isWorking === true) {
          this.setProperty('/timer/counter', 0);
          return this.setStatusPausingLong();
        }

        if (isWorking) {
          return this.setStatusPausingShort();
        }

        if (isPausing) {
          return this.setStatusWorking();
        }
      },

      setStatusPrevious() {
        const { statusName } = this.getData();

        if (statusName === "Short break") {
          return this.setStatusPausingShort();
        }

        if (statusName === "Long break") {
          return this.setStatusPausingLong();
        }

        return this.setStatusWorking();
      },

      setTimer(ms) {
        this.setProperty('/timer/msTotal', ms);
        this.setProperty('/timer/msLeft', ms);
        this.setProperty('/timer/msExpired', 0);
      },

      // Status
      setStatusWorking() {
        const { msTotal, name } = this.getProperty('/settings/pomodoro');
        this.setProperty('/status', {
          isWorking: true,
          isPausing: false,
        });
        this.setProperty('/statusName', name);
        this.setTimer(msTotal);
      },
      setStatusPausingShort() {
        const { msTotal, name } = this.getProperty('/settings/shortBreak');
        this.setProperty('/status', {
          isWorking: false,
          isPausing: true,
        });
        this.setProperty('/statusName', name);
        this.setTimer(msTotal);
      },
      setStatusPausingLong() {
        const { msTotal, name } = this.getProperty('/settings/longBreak');
        this.setProperty('/status', {
          isWorking: false,
          isPausing: true,
        });
        this.setProperty('/statusName', name);
        this.setTimer(msTotal);
      },

      startTicking(handler) {
        this.stopTicking(true);
        const intervalHandler = setInterval(() => {
          this.tick(handler);
        }, 1000);
        this.setProperty('/intervalHandler', intervalHandler);
        this.setProperty('/timer/ticking', true);
      },

      stopTicking(hardReset = false) {
        const intervalHandler = this.getProperty('/intervalHandler');
        if (hardReset === true) {
          for (let i = 1; i < Math.max(); i++) {
            clearInterval(i);
          }
        }
        clearInterval(intervalHandler);
        this.setProperty('/timer/ticking', false);
      },

      tick(handler) {
        const { statusName } = this.getData();
        let { msLeft, msExpired } = this.getProperty('/timer');
        msLeft -= 1000;
        msExpired += 1000;
        document.title = `${statusName} - ${(msLeft / 60000).toFixed(
          1
        )} Minutes left`;
        if (msLeft === 0) {
          this.playPhaseDoneAudio();
          setTimeout(() => {
            document.title = `Finished ${statusName}`;
            handler.handleFinishCurrentPhase();
          }, 1000);
        }
        this.setProperty('/timer/msLeft', msLeft);
        this.setProperty('/timer/msExpired', msExpired);
      },

      addToHistory(task) {
        if (this.getProperty('/settings/history/session') === true) {
          const historyItems = this.getProperty('/history');

          const historyIndex = historyItems.findIndex((historyItem) => {
            return (
              historyItem.title == task.title &&
              historyItem.status.isWorking === task.status.isWorking &&
              historyItem.status.isPausing === task.status.isPausing
            );
          });
          if (historyIndex >= 0) {
            historyItems[historyIndex].msExpired += task.msExpired;
          } else {
            historyItems.push(task);
          }

          this.setProperty('/history', historyItems);

          if (this.getProperty('/settings/history/persistent') === true) {
            if (!localStorage.getItem('history')) {
              localStorage.setItem('history', JSON.stringify([]));
            }
            localStorage.setItem('history', JSON.stringify(historyItems));
          }
        }
      },

      clearHistory(clearLocalStorage = false) {
        this.setProperty('/history', []);
        if (clearLocalStorage === true) {
          localStorage.setItem('history', JSON.stringify([]));
        }
      },

      syncHistory() {
        const historyItemsLocal = localStorage.getItem('history');
        if (!!historyItemsLocal && historyItemsLocal !== '[]') {
          this.setProperty('/history', JSON.parse(historyItemsLocal));
          return true;
        } else {
          return false;
        }
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

      playPhaseDoneAudio() {
        const { soundUrl } = this.getProperty('/settings/notification');
        const audio = new Audio(soundUrl);
        audio.play();
      },

      increaseCounter(value) {
        let { counter } = this.getProperty("/timer");
        counter += value;
        this.setProperty("/timer/counter", counter)
      }
    }
  );

  return new Pomodoro({
    timer: {
      msTotal: 0,
      msLeft: 0,
      msExpired: 0,
      ticking: false,
      counter: 0
    },
    statusName: 'Working',
    status: {
      isWorking: true,
      isPausing: false,
    },
    settings: { ...pomodoroDefaultSettings },
    task: { title: 'Nothing in particular', desc: '' },
    taskEditByUser: {},
    taskEstimation: 0,
    history: [],
    intervalHandler: null,
  });
});
