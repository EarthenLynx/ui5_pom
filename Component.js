sap.ui.define(["sap/ui/core/UIComponent","sap/ui/Device","./model/models"],function(e,t,i){"use strict";return e.extend("apps.pomodoro.Component",{metadata:{manifest:"json"},init:function(){e.prototype.init.apply(this,arguments);this.setModel(i.createDeviceModel(),"device");this.getRouter().initialize()}})});