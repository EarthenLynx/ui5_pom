sap.ui.define(['sap/ui/model/json/JSONModel', './Config.model', './Task.model'], function (JSONModel, Config) {
  'use strict';

  const Pomodoro = JSONModel.extend(
    'apps.pomodoro.model.PomodoroModel',
    {
      modelname: 'Pomodoro',

      tie(handler) {
        handler.getOwnerComponent().setModel(this, this.modelname);
      },

      init() {
        const { msTotal } = Config.getProperty('/settings/pomodoro');
        this.setTimer(msTotal);
      },

      setStatusNext() {
        const { isWorking, isPausing } =
          this.getProperty('/status');
        if ((this.getProperty('/timer/counter')) / 8 >= 1 && isWorking === true) {
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

        if (statusName === 'Short break') {
          return this.setStatusPausingShort();
        }

        if (statusName === 'Long break') {
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
        const { msTotal, name } = Config.getProperty('/settings/pomodoro');
        this.setProperty('/status', {
          isWorking: true,
          isPausing: false,
        });
        this.setProperty('/statusName', name);
        this.setTimer(msTotal);
      },
      setStatusPausingShort() {
        const { msTotal, name } = Config.getProperty('/settings/shortBreak');
        this.setProperty('/status', {
          isWorking: false,
          isPausing: true,
        });
        this.setProperty('/statusName', name);
        this.setTimer(msTotal);
      },
      setStatusPausingLong() {
        const { msTotal, name } = Config.getProperty('/settings/longBreak');
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

      playPhaseDoneAudio() {
        const { soundUrl } = Config.getProperty('/settings/notification');
        const audio = new Audio(soundUrl);
        audio.play();
      },

      increaseCounter(value) {
        let { counter } = this.getProperty('/timer');
        counter += value;
        this.setProperty('/timer/counter', counter)
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
    intervalHandler: null,
  });
});
