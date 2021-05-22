sap.ui.define(['sap/ui/model/json/JSONModel', './Config.model'], function (JSONModel, Config) {
  'use strict';

  const Task = JSONModel.extend(
    'apps.pomodoro.model.TaskModel',
    {
      modelname: 'Task',
      modelpath: 'http://192.168.2.159:9001/pomodoro-histories/',

      tie(handler) {
        handler.getOwnerComponent().setModel(this, this.modelname);
      },

      async addToHistory(task) {
        if (Config.getProperty('/settings/history/session') === true) {
          const response = await this._post('', task);
        }
      },

      async getTaskById(id) {
        const response = await this._get(id);
        return await response.json();
      },

      async updateTaskById(id, task) {
        const response = await this._put(id, task);
      },

      async deleteTaskById(id) {
        const response = await this._delete(id);
      },

      clearHistory(clearLocalStorage = false) {
        this.setProperty('/history', []);
        if (clearLocalStorage === true) {
          localStorage.setItem('history', JSON.stringify([]));
        }
      },

      async getActiveTask(id) {
        const activeTask = await this._get(id);
        this.setProperty("/task", activeTask);
      },

      async getHistory() {
        const history = await this._get();
        if (!!history) {
          this.setProperty('/history', history);
          return true;
        } else {
          return false;
        }
      },

      async _get(path = '') {
        const url = this.modelpath + path;
        const headers = { 'content-type': 'application/json' }
        const options = { method: 'get', headers };
        const response = await fetch(url, options);
        return await response.json();
      },

      async _post(path = '', payload) {
        const url = this.modelpath + path;
        const headers = { 'content-type': 'application/json' }
        const body = JSON.stringify(payload)
        const options = { method: 'post', headers, body };
        const response = await fetch(url, options);
        return await response.json();
      },

      async _put(path, payload) {
        const url = this.modelpath + path;
        const headers = { 'content-type': 'application/json' }
        const body = JSON.stringify(payload)
        const options = { method: 'put', headers, body };
        const response = await fetch(url, options);
        return await response.json();
      },

      async _delete(path) {
        const url = this.modelpath + path;
        const options = { method: 'delete' };
        const response = await fetch(url, options);
        return await response.json();
      }
    }
  );

  return new Task({
    task: {},
    taskEditByUser: {},
    taskEstimation: 0,
    history: [],
  });
});
