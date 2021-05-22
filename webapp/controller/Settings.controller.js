sap.ui.define(
  [
    './Basecontroller',
    'sap/ui/core/Fragment',
    'sap/m/MessageToast',
    "../model/Config.model",
    '../model/formatter'
  ],
  function (Controller, Fragment, Toast, Config,  formatter) {
    "use strict";

    return Controller.extend("apps.pomodoro.controller.Settings", {

      formatter: formatter,

      onInit() {
        Config.tie(this)
        this.handleSynchronizeUserSettings();
      },

      handleSynchronizeUserSettings() {
        const settingsWereSynced = Config.syncUserSettings()
        if (settingsWereSynced) {
          console.log('Loaded user session data from local storage')
        }
      },

      handleSetUserSettings() {
        try {
          Config.saveUserSettings();
          Toast.show('Saved your preferences');
        } catch (e) {
          Toast.show(`Could not save changes: ${e}`)
        }
      },
      handleResetUserSettings() {
        Config.resetUserSettings();
        Toast.show('Restored standard settings. Make sure to save them');
      },


      handleSynchronizeMinFocus() {
        const { pomodoro, minFocus } = Config.getProperty('/settings')
        if (pomodoro.msTotal < minFocus.msTotal) {
          Config.setProperty('/settings/minFocus/msTotal', pomodoro.msTotal);
        }
      },

      handleOpenHistoryDialog() {
        const oView = this.getView();
        // create dialog lazily
        if (!this.byId('history-dialog')) {
          // load asynchronous XML fragment
          Fragment.load({
            id: oView.getId(),
            name: 'apps.pomodoro.view.Fragment.History',
            controller: this
          }).then((oDialog) => {
            // connect dialog to the root view of this component (models, lifecycle)
            oView.addDependent(oDialog);
            oDialog.open();
          });
        } else {
          this.byId('history-dialog').open();
        }
      },

      handleCloseHistoryDialog() {
        const oDialog = this.byId('history-dialog');
        if (oDialog) {
          oDialog.close();
        }
      },
    });
  }
);
