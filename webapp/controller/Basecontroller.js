sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    'sap/m/MessageToast',
    "sap/m/Text",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/MessageStrip",
  ],
  function (Controller, Toast, Text, Dialog, Button, MessageStrip) {
    "use strict";

    return Controller.extend("sap.ui.demo.basicTemplate.controller.Basecontroller", {

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
    });
  }
);
