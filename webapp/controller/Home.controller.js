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

		onInit() {
			Pomodoro.init();
			Pomodoro.tie(this);
			Pomodoro.setProperty('/settings/notification/show', this.requestNotificationPermission());
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

		handleFinishCurrentPhase() {
			const { status } = Pomodoro.getData();
			const { msTotal } = Pomodoro.getProperty('/settings/minFocus')
			const { ticking, msExpired } = Pomodoro.getProperty('/timer')
			if (ticking && status.isWorking && (msExpired < msTotal)) {
				Toast.show(`Focus for at least ${(msTotal / 60000).toFixed(0)} minutes!`);
			} else {
				Pomodoro.stopTicking();
				Pomodoro.setStatusNext();
				if ((msExpired > msTotal) || !status.isWorking) {
					const { task } = Pomodoro.getData();
					task.time = msExpired;
					task.status = status;
					task.msExpired = msExpired;
					Pomodoro.addToHistory({ ...task })
					Toast.show("Phase completed")
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