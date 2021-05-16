sap.ui.define([
	'./Basecontroller',
	'sap/ui/core/Fragment',
	'sap/m/MessageToast',
	'../model/Pomodoro.model',
	'../model/Task.model',
	'../model/Config.model',
	'../model/formatter'
], function (Controller, Fragment, Toast, Pomodoro, Task, Config, formatter) {
	'use strict';

	return Controller.extend('sap.ui.demo.basicTemplate.controller.Home', {

		formatter: formatter,

		async onInit() {
			Pomodoro.init();
			Pomodoro.tie(this);
			Pomodoro.setProperty('/settings/notification/desktopNotification', await this.requestNotificationPermission());
			Task.syncHistory();
			Task.tie(this);
			this.handleSetUserTheme();
		},

		handleToggleTimer() {
			const { ticking } = Pomodoro.getProperty('/timer');
			if (ticking) {
				Toast.show('Timer stopped');
				return Pomodoro.stopTicking();
			}
			if (!ticking) {
				Toast.show('Timer started');
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
			const { msTotal: msMinFocus } = Config.getProperty('/settings/minFocus')
			const { desktopNotification } = Config.getProperty('/settings/notification')
			const { ticking, msExpired, counter } = Pomodoro.getProperty('/timer')
			if (ticking && status.isWorking && (msExpired < msMinFocus)) {
				Toast.show(`Focus for at least ${(msMinFocus / 60000).toFixed(0)} minutes!`);
			} else {
				Pomodoro.stopTicking();
				Pomodoro.increaseCounter(1);
				Pomodoro.setStatusNext();
				if ((msExpired > msMinFocus) || !status.isWorking) {
					const { task } = Task.getData();
					task.status = status;
					task.msExpired = msExpired;
					task.msEstimated = (taskEstimation * 3600000); /* Estimation user input is in Hours */
					Task.addToHistory({ ...task })
					Toast.show('Phase completed')
					if (desktopNotification) {
						this.sendNotification('Phase completed', { body: `${(msExpired / 60000).toFixed(0)} minute/s passed. Click here and jump into the next phase` })
					}
				} else {
					Toast.show('Phase skipped')
				}
			}
		},

		handleResetCurrentPhase() {
			Pomodoro.stopTicking();
			Pomodoro.setStatusPrevious();
		},

		handleCreateNewTask() {
			const { task, taskEstimation } = Task.getData();
			task.status = {
				isWorking: true,
				isPausing: false
			}
			task.msExpired = 0;
			task.msEstimated = (taskEstimation * 3600000); /* Estimation user input is in Hours */
			Task.addToHistory({ ...task });
			Toast.show('Task added to tasklist.');
			this.handleCloseTaskDialog();
		},

		handleUpdateTaskByTaskPath() {
			Task.updateTaskByTaskPath();
			this.handleCloseTaskEditDialog()
		},

		handleOpenTaskDialog() {
			const oView = this.getView();
			// create dialog lazily
			if (!this.byId('task-dialog')) {
				// load asynchronous XML fragment
				Fragment.load({
					id: oView.getId(),
					name: 'sap.ui.demo.basicTemplate.view.Fragment.Task',
					controller: this
				}).then((oDialog) => {
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialog);
					oDialog.open();
				});
			} else {
				this.byId('task-dialog').open();
			}
		},

		handleCloseTaskDialog() {
			const oDialog = this.byId('task-dialog');
			if (oDialog) {
				oDialog.close();
			}
		},

		handleOpenTaskEditDialog(oEvent) {
			const oSource = oEvent.getSource();

			// Conditionally find the selected path
			let sPath;
			console.log(oSource)
			if (oSource.getSelectedAppointments) {
				console.log(oSource.getSelectedAppointments())
				sPath = oSource.getSelectedAppointments()[0].getBindingContext('Task').getPath();
			} else {
				sPath = oSource.getBindingContext('Task').getPath();
			}
			const oHistoryItem = Task.getProperty(sPath);
			oHistoryItem.sPath = sPath;
			Task.setProperty('/taskEditByUser', oHistoryItem);

			const oView = this.getView();

			if (!this.byId('task-edit-dialog')) {
				this._taskEditDialog = Fragment.load({
					id: oView.getId(),
					name: 'sap.ui.demo.basicTemplate.view.Fragment.TaskEdit',
					controller: this
				}).then((oDialog) => {
					oView.addDependent(oDialog);
					oDialog.open();
				});
			} else {
				this.byId('task-edit-dialog').open();
			}
		},

		handleCloseTaskEditDialog() {
			const oDialog = this.byId('task-edit-dialog');
			if (oDialog) {
				oDialog.close();
			}
		},

		handleSynchronizeHistory() {
			const wasSynced = Task.syncHistory()
			if (wasSynced) {
				Toast.show('Loaded session data from history')
			} else {
				Toast.show('No history data found')
			}
		},

		_setActiveTaskMsExpired(oEvent) {
			const hValue = oEvent.getSource().getValue();
			const msValue = hValue * (1000 * 60 * 60).toFixed(0);
			Task.setProperty('/taskEditByUser/msExpired', msValue)
		},

		_setActiveTaskMsEstimated(oEvent) {
			const hValue = oEvent.getSource().getValue();
			const msValue = hValue * (1000 * 60 * 60).toFixed(0);
			Task.setProperty('/taskEditByUser/msEstimated', msValue)
		},
	});
});