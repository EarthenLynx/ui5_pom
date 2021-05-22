sap.ui.define([
	'./Basecontroller',
	'sap/ui/core/Fragment',
	'sap/m/MessageToast',
	'sap/ui/model/Sorter',
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	'../model/Pomodoro.model',
	'../model/Task.model',
	'../model/Config.model',
	'../model/formatter'
], function (Controller, Fragment, Toast, Sorter, Filter, FilterOperator, Pomodoro, Task, Config, formatter) {
	'use strict';

	return Controller.extend('apps.pomodoro.controller.Home', {

		formatter: formatter,

		async onInit() {
			Pomodoro.init();
			Pomodoro.tie(this);
			Pomodoro.setProperty('/settings/notification/desktopNotification', await this.requestNotificationPermission());
			Task.getHistory();
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
		async handleFinishCurrentPhase() {
			const { status } = Pomodoro.getData();
			const { msTotal: msMinFocus } = Config.getProperty('/settings/minFocus')
			const { desktopNotification } = Config.getProperty('/settings/notification')
			const { ticking, msExpired, counter } = Pomodoro.getProperty('/timer')
			if (ticking && status.isWorking && (msExpired < msMinFocus)) {
				Toast.show(`Focus for at least ${(msMinFocus / 60000).toFixed(0)} minutes!`);
			} else {

				// Prepare for the next phase
				Pomodoro.stopTicking();
				Pomodoro.increaseCounter(1);
				Pomodoro.setStatusNext();

				// If phase ends automatically or is a break
				const { id, ...task } = Task.getProperty('/task');
				if (status.isWorking) {

					// Update item only if task exists
					if (!!id) {
						task.msExpired += msExpired;
						task.startDate = new Date(task.startDate)
						task.endDate = new Date();
						await Task.updateTaskById(id, task)
						Task.getHistory();
					}

					// Notify user phase is completed
					Toast.show('Phase completed')
					if (desktopNotification) {
						this.sendNotification('Phase completed', { body: `${(msExpired / 60000).toFixed(0)} minute/s passed. Click here and jump into the next phase` })
					}
				}

				// Notify user break is completed
				if (!status.isWorking) {
					Toast.show('Pausing finished')
				}

			}
		},

		handleResetCurrentPhase() {
			Pomodoro.stopTicking();
			Pomodoro.setStatusPrevious();
		},

		handleGetActiveTask(oEvent) {
			const sText = oEvent.getParameters().selectedItem.mProperties.text;
			const id = sText.split(' - ')[0];
			Task.getActiveTask(id)
		},

		async handleCreateNewTask() {
			try {
				const { task } = Task.getData();
				task.startDate = new Date(task.startDate || new Date().getTime())
				task.endDate = new Date(task.endDate || new Date().getTime())
				await Task.addToHistory(task);
				await Task.getHistory();
				Toast.show('Task added to tasklist.');
				this.handleCloseTaskDialog();
			} catch (e) {
				Toast.show(`Could not add task to tasklist: ${e}`);
			}
		},

		handleUpdateHistoryItem() {
			const { id, ...task } = Task.getProperty('/taskEditByUser');
			task.startDate = new Date(task.startDate)
			task.endDate = new Date(task.endDate)
			Task.updateTaskById(id, task);
			this.handleCloseTaskEditDialog()
		},

		handleOpenTaskDialog() {
			const oView = this.getView();
			// create dialog lazily
			if (!this.byId('task-dialog')) {
				// load asynchronous XML fragment
				Fragment.load({
					id: oView.getId(),
					name: 'apps.pomodoro.view.Fragment.Task',
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

			// Conditionally find the selected path based on event source (tasklist, calender)
			const sPath = oSource.getSelectedAppointments ?
				oSource.getSelectedAppointments()[0].getBindingContext('Task').getPath() :
				oSource.getBindingContext('Task').getPath();

			const oHistoryItem = Task.getProperty(sPath);
			oHistoryItem.sPath = sPath;
			Task.setProperty('/taskEditByUser', oHistoryItem);

			const oView = this.getView();

			if (!this.byId('task-edit-dialog')) {
				this._taskEditDialog = Fragment.load({
					id: oView.getId(),
					name: 'apps.pomodoro.view.Fragment.TaskEdit',
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

		async handleGetHistory() {
			const wasSynced = await Task.getHistory()
			if (wasSynced) {
				Toast.show('Loaded session data from history')
			} else {
				Toast.show('No history data found')
			}
		},

		/* Sorting & Filter functions */
		// Tasklist - Search for tasks
		handleApplySearchTaskList(oEvent) {
			const aTableFilters = []
			const sQuery = oEvent.getParameter("query");

			if (sQuery && sQuery.length > 0) {
				const titleFilter = new Filter({ path: "title", operator: FilterOperator.Contains, value1: sQuery })
				const descFilter = new Filter({ path: "desc", operator: FilterOperator.Contains, value1: sQuery })
				aTableFilters.push(new Filter({ filters: [titleFilter, descFilter], and: false }));
			}

			this.byId("task-table").getBinding("items").filter(aTableFilters, "Application");
		},

		// Tasklist - Group items by their date
		handleApplyDateSorter() {
			const aSorters = [];
			aSorters.push(new Sorter('startDate', true, this._groupByDay))
			this.byId('task-table').getBinding('items').sort(aSorters)
		},

		// Taskfragment - Update msExpired whenever user changes value
		_setNewTaskMsExpired(oEvent) {
			const hValue = oEvent.getSource().getValue();
			const msValue = hValue * (1000 * 60 * 60).toFixed(0);
			Task.setProperty('/task/msExpired', msValue)
		},

		// Taskfragment - Update msEstimated whenever user changes value
		_setNewTaskMsEstimated(oEvent) {
			const hValue = oEvent.getSource().getValue();
			const msValue = hValue * (1000 * 60 * 60).toFixed(0);
			Task.setProperty('/task/msEstimated', msValue)
		},

		// TaskUpdatefragment - Update msExpired whenever user changes value
		_setActiveTaskMsExpired(oEvent) {
			const hValue = oEvent.getSource().getValue();
			const msValue = hValue * (1000 * 60 * 60).toFixed(0);
			Task.setProperty('/taskEditByUser/msExpired', msValue)
		},

		// TaskUpdatefragment - Update msEstimated whenever user changes value
		_setActiveTaskMsEstimated(oEvent) {
			const hValue = oEvent.getSource().getValue();
			const msValue = hValue * (1000 * 60 * 60).toFixed(0);
			Task.setProperty('/taskEditByUser/msEstimated', msValue)
		},

		// Util function for handleApplyDateSorter
		_groupByDay(oContext) {
			const sDate = oContext.getProperty("startDate");

			return {
				key: formatter.formatStringToDateDay(sDate),
				text: formatter.formatStringToDateDay(sDate)
			};
		},
	});
});