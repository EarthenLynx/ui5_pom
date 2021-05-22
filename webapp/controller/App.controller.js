sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"apps/pomodoro/model/formatter"
], function(Controller, formatter) {
	"use strict";

	return Controller.extend("apps.pomodoro.controller.App", {

		formatter: formatter,

		onInit: function () {

		}
	});
});