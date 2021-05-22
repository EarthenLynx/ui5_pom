sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    'sap/m/MessageToast',
    "sap/m/Text",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/MessageStrip",
    "../model/Pomodoro.model",
    "../model/Task.model",
  ],
  function (Controller, Toast, Text, Dialog, Button, MessageStrip, Pomodoro, Task) {
    "use strict";

    return Controller.extend("apps.pomodoro.controller.Basecontroller", {

      async requestNotificationPermission() {
        const isGranted = Notification.permission;
        if (isGranted !== 'granted') {
          const userPermission = await Notification.requestPermission()
          if (userPermission === 'granted') {
            Toast.show('You will now receive notifications whenever a phase is over')
            return true;
          } else {
            Toast.show('You will receive no notifications. You can change your decision in the Settings panel');
            return false
          }
        }
      },

      async sendNotification(title, body) {
        const permission = await Notification.requestPermission()
        // If the user accepts, let's create a notification
        if (permission === "granted") {
          const notification = new Notification(title, body);
          notification.onclick = (event) => {
            event.preventDefault(); // prevent the browser from focusing the Notification's tab
            window.focus()
            notification.close()
          }
        }
      },

      _handleCreateMessageStrip(text, type, oId) {
        const oItem = this.getView().byId(oId);
        const oMsgStrip = new MessageStrip({
          text,
          type,
          showCloseButton: true,
          showIcon: true,
        });
        oItem.addContent(oMsgStrip);
      },

      _handleCreateConfirmationPopup(text, action) {
        var oDialog = new Dialog({
          title: "Information",
          type: "Message",
          state: "Information",
          content: new Text({
            text: text,
          }),

          beginButton: new Button({
            text: "Cancel",
            type: "Reject",
            press() {
              oDialog.close();
              return;
            },
          }),

          endButton: new Button({
            text: "Confirm",
            type: "Accept",
            press() {
              if (action) {
                action();
              }
              oDialog.close();
            },
          }),

          afterClose() {
            oDialog.destroy();
          },
        });
        oDialog.open();
        return;
      },

      handleSetUserTheme() {
        // Check for media preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          this._setTheme('dark')
        }

        // Then, check for user-theme localstorage and overwrite, if necessary
        if (localStorage.getItem('user-theme')) {
          const userTheme = localStorage.getItem('user-theme')
          this._setTheme(userTheme)
        }
      },

      handleToggleUserTheme() {
        const userTheme = localStorage.getItem('user-theme')
        if (userTheme === 'dark') {
          this._setTheme('light')
        } else {
          this._setTheme('dark')
        }
      },

      handleDeleteHistory(clearLocalStorage = false) {
        if (clearLocalStorage === true) {
          Toast.show('All historical data has been removed from your computer')
        }

        if (clearLocalStorage === false) {
          Toast.show('Session data cleared')
        }

        this.handleCloseHistoryDialog();
        Task.clearHistory(clearLocalStorage);
      },

      handleExportHistory() {
        const { history } = Task.getData();
        const rowHeaders = Object.keys(history[0])
        const replacer = (key, value) => { return value === null ? '' : value }
        let csv = history.map((row) => {
          return rowHeaders.map((fieldName) => {
            return JSON.stringify(row[fieldName], replacer)
          }).join(';')
        })

        csv.unshift(rowHeaders.join(';')) // add header column
        csv = csv.join('\r\n');

        const csvFile = new Blob([csv]);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(csvFile);
        a.download = 'filename.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },

      _setTheme(theme) {
        if (theme === 'dark') {
          // FIXME: Remove the pomodoro or replace it if you have other dependencies
          Pomodoro.setProperty('/settings/appearance/theme', 'dark');
          localStorage.setItem('user-theme', 'dark')
          sap.ui.getCore().applyTheme('sap_fiori_3_dark')
        } else if (theme === 'light') {
          Pomodoro.setProperty('/settings/appearance/theme', 'light');
          localStorage.setItem('user-theme', 'light')
          sap.ui.getCore().applyTheme('sap_fiori_3')
        }
      }
    });
  }
);
