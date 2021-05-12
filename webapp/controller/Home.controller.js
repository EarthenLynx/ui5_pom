sap.ui.define([
	"./Basecontroller",
	'sap/ui/core/Fragment',
	'sap/m/MessageToast',
	"../model/Pomodoro.model",
	"../model/formatter"
], function (Controller, Fragment, Toast, Pomodoro, formatter) {
	"use strict";

	return Controller.extend("sap.ui.demo.basicTemplate.controller.Home", {

		formatter: formatter,

		async onInit() {
			Pomodoro.init();
			Pomodoro.tie(this);
			Pomodoro.setProperty('/settings/notification/desktopNotification', await this.requestNotificationPermission());
			this.handleSynchronizeUserSettings();
			this.handleSetUserTheme();
		},

		handleToggleTimer() {
			const { ticking } = Pomodoro.getProperty('/timer');
			if (ticking) {
				Toast.show("Timer stopped");
				return Pomodoro.stopTicking();
			}
			if (!ticking) {
				Toast.show("Timer started");
				return Pomodoro.startTicking(this);
			}
		},

		/**
		 * - Check whether user has focused for the min. amount of time
		 * - Stop time and set timer to next phase
		 * - Add item to history, given user has configured
		 * - Show a desktop notification
		 */
		handleFinishCurrentPhase() {
			const { status, taskEstimation } = Pomodoro.getData();
			const { msTotal: msMinFocus } = Pomodoro.getProperty('/settings/minFocus')
			const { desktopNotification } = Pomodoro.getProperty("/settings/notification")
			const { ticking, msExpired } = Pomodoro.getProperty('/timer')
			if (ticking && status.isWorking && (msExpired < msMinFocus)) {
				Toast.show(`Focus for at least ${(msMinFocus / 60000).toFixed(0)} minutes!`);
			} else {
				Pomodoro.stopTicking();
				Pomodoro.setStatusNext();
				if ((msExpired > msMinFocus) || !status.isWorking) {
					const { task } = Pomodoro.getData();
					task.status = status;
					task.msExpired = msExpired;
					task.msEstimated = (taskEstimation * 3600000); /* Estimation user input is in Hours */
					Pomodoro.addToHistory({ ...task })
					Toast.show("Phase completed")
					if (desktopNotification) {
						this.sendNotification('Phase completed', { body: `${(msExpired / 60000).toFixed(0)} minute/s passed. Click here and jump into the next phase` })
					}
				} else {
					Toast.show("Phase skipped")
				}
			}
		},

		handleResetCurrentPhase() {
			Pomodoro.stopTicking();
			Pomodoro.setStatusPrevious();
		},

		handleOpenTaskDialog() {
			const oView = this.getView();
			// create dialog lazily
			if (!this.byId("task-dialog")) {
				// load asynchronous XML fragment
				Fragment.load({
					id: oView.getId(),
					name: "sap.ui.demo.basicTemplate.view.Fragment.Task",
					controller: this
				}).then((oDialog) => {
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialog);
					oDialog.open();
				});
			} else {
				this.byId("task-dialog").open();
			}
		},

		handleCloseTaskDialog() {
			const oDialog = this.byId("task-dialog");
			if (oDialog) {
				oDialog.close();
			}
		},

		handleOpenHistoryDialog() {
			const oView = this.getView();
			// create dialog lazily
			if (!this.byId("history-dialog")) {
				// load asynchronous XML fragment
				Fragment.load({
					id: oView.getId(),
					name: "sap.ui.demo.basicTemplate.view.Fragment.History",
					controller: this
				}).then((oDialog) => {
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialog);
					oDialog.open();
				});
			} else {
				this.byId("history-dialog").open();
			}
		},

		handleCloseHistoryDialog() {
			const oDialog = this.byId("history-dialog");
			if (oDialog) {
				oDialog.close();
			}
		},

		handleSynchronizeHistory() {
			const wasSynced = Pomodoro.syncHistory()
			if (wasSynced) {
				Toast.show("Loaded session data from history")
			} else {
				Toast.show("No history data found")
			}
		},

		handleDeleteHistory(clearLocalStorage = false) {
			if (clearLocalStorage === true) {
				Toast.show("All historical data has been removed from your computer")
			}

			if (clearLocalStorage === false) {
				Toast.show("Session data cleared")
			}

			this.handleCloseHistoryDialog();
			Pomodoro.clearHistory(clearLocalStorage);
		},

		handleExportHistory() {
			const { history } = Pomodoro.getData();
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
			const a = document.createElement("a");
			a.href = URL.createObjectURL(csvFile);
			a.download = "filename.csv";
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		},

		handleSetUserSettings() {
			try {
				Pomodoro.saveUserSettings();
				Toast.show("Saved your preferences");
			} catch (e) {
				Toast.show(`Could not save changes: ${e}`)
			}
		},

		handleResetUserSettings() {
			Pomodoro.resetUserSettings();
			Toast.show("Restored standard settings. Make sure to save them");
		},

		handleSynchronizeUserSettings() {
			const settingsWereSynced = Pomodoro.syncUserSettings()
			if (settingsWereSynced) {
				console.log("Loaded user session data from local storage")
			}
		},

		handleSynchronizeMinFocus() {
			const { pomodoro, minFocus } = Pomodoro.getProperty('/settings')
			if (pomodoro.msTotal < minFocus.msTotal) {
				Pomodoro.setProperty('/settings/minFocus/msTotal', pomodoro.msTotal);
			}
		}
	});
});