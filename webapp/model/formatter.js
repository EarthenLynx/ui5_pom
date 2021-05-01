sap.ui.define([], function () {
	"use strict";
	return {
		formatMsToMinutes(ms) {
			if (ms) {
				const minutes = Math.floor(ms / 60000);
				const seconds = ((ms % 60000) / 1000).toFixed(0);
				return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;

			} else {
				return "00:00";
			}
		},

		formatStatusToString(obj) {
			if (obj) {
				if (obj.isWorking === true) {
					return "Work"
				} else {
					return "Break"
				}
			}
		},

		formatUniqueHistory(array) {
			if (array) {
				return array.map(item => item.title)
					.filter((value, index, self) => self.indexOf(value) === index)
			} else {
				return []
			}
		}
	};
});