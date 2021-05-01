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
			Pomodoro.setProperty('/settings/showNotification', await this.requestNotificationPermission());
			this.handleSynchronizeUserSettings();
		},

		handleToggleTimer() {
			const { ticking } = Pomodoro.getProperty('/timer');
			if (ticking) {
				return Pomodoro.stopTicking();
			}
			if (!ticking) {
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
			const { status } = Pomodoro.getData();
			const { msTotal: msMinFocus } = Pomodoro.getProperty('/settings/minFocus')
			const { showNotification } = Pomodoro.getProperty("/settings")
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
					Pomodoro.addToHistory({ ...task })
					Toast.show("Phase completed")
					if (showNotification) {
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

		handleOpenTaskPopover(oEvent) {
			const oButton = oEvent.getSource();
			const oView = this.getView();

			if (!this._taskPopover) {
				this._taskPopover = Fragment.load({
					id: oView.getId(),
					name: "sap.ui.demo.basicTemplate.view.Fragment.Task",
					controller: this
				}).then((oPopover) => {
					oView.addDependent(oPopover);
					return oPopover;
				});
			}
			this._taskPopover.then((oPopover) => {
				oPopover.openBy(oButton);
			});
		},

		handleCloseTaskPopover() {
			this._taskPopover.then(popover => popover.close());
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

		handleExportHistory() { },

		handleSetUserTheme() {
			if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
				Pomodoro.setProperty('/settings/appearance/theme', 'dark');
			}
			// Check for user-theme localstorage
			if (localStorage.getItem('user-theme')) {
				const userTheme = localStorage.getItem('user-theme')
				this._toggleTheme(userTheme)
			}
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

		_toggleTheme(theme) {
			if (theme === 'dark') {
				Pomodoro.setProperty('/settings/appearance/theme', 'light');
				localStorage.setItem('user-theme', 'light')
				sap.ui.getCore().applyTheme('sap_fiori_3')
			} else if (theme === 'light') {
				Pomodoro.setProperty('/settings/appearance/theme', 'dark');
				localStorage.setItem('user-theme', 'dark')
				sap.ui.getCore().applyTheme('sap_fiori_3_dark')
			}
		}

	});
});