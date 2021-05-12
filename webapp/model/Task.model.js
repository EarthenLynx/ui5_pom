sap.ui.define(['sap/ui/model/json/JSONModel', './Config.model'], function (JSONModel, Config) {
  'use strict';

  const Task = JSONModel.extend(
    'sap.ui.demo.basicTemplate.model.TaskModel',
    {
      modelname: 'Task',

      tie(handler) {
        handler.getOwnerComponent().setModel(this, this.modelname);
      },

      addToHistory(task) {
        if (Config.getProperty('/settings/history/session') === true) {
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

          if (Config.getProperty('/settings/history/persistent') === true) {
            if (!localStorage.getItem('history')) {
              localStorage.setItem('history', JSON.stringify([]));
            }
            localStorage.setItem('history', JSON.stringify(historyItems));
          }
        }
      },

      updateTaskByTaskPath() {
        const { sPath, ...historyItem } = this.getProperty('/taskEditByUser');
        this.setProperty(sPath, historyItem);

        if (Config.getProperty('/settings/history/persistent') === true) {
          const historyItems = this.getProperty('/history')
          localStorage.setItem('history', JSON.stringify(historyItems))
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
    }
  );

  return new Task({
    task: { title: 'Nothing in particular', desc: '' },
    taskEditByUser: {},
    taskEstimation: 0,
    history: [],
  });
});
