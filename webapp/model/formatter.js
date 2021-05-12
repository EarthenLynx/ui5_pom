sap.ui.define([], function () {
	"use strict";
	return {
		formatMsToMinutes(ms) {
			if (ms) {
				const minutes = Math.floor(ms / 60000);
				const seconds = ((ms % 60000) / 1000).toFixed(0);
				return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;

			} else {
				return "0:00";
			}
		},

		formatMsToHours(ms) {
			if (ms) {
				return (ms / (1000 * 60 * 60)).toFixed(2);
			} else {
				return "0.00";
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

		formatStringToDate(string) {
			if(string) {
				return new Date(string)
			} else {
				return new Date();
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