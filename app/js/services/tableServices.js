define(['app', 'uuid'], function (app, uuid) {
	// 桌台服务
	app.service('TableService',[
		'$rootScope', '$location', '$filter', 'storage', 'CommonCallServer', 
		function ($rootScope, $location, $filter, storage, CommonCallServer) {
			IX.ns("Hualala");
			var HCMath = Hualala.Common.Math;
			var self = this;
			var AreaTableHT = new IX.IListManager(),
				TableHT = new IX.IListManager();

			/**
			 * 初始化桌台数据表，建立桌台与区域之间的关系数据结构，方便后面进行操作
			 * 桌台区域数据表AreaTableHT：{__ID__,areaName,tblLst}
			 * 桌台数据表TableHT: {areaName,tableCode,tableName,isRoom,defaultPerson,tableStatus,lockedBy,bookOrderNo,saasOrderKey,currPerson,orderCreateTime,orderTotalAmount}
			 * @param  {[type]} records [description]
			 * @return {[type]}         [description]
			 */
			var initTableDB = function (records) {
				AreaTableHT.clear();
				TableHT.clear();
				_.each(records, function (table) {
					var areaName = _.result(table, 'areaName'),
						tableName = _.result(table, 'tableName'),
						tableKey = _.result(table, 'itemID');
					var _area = AreaTableHT.get(areaName);
					TableHT.register(tableKey, _.extend(table, {__ID__ : tableKey}));
					if (_.isEmpty(_.result(_area, 'tblLst'))) {
						AreaTableHT.register(areaName, {
							__ID__ : IX.id(),
							areaName : areaName,
							tblLst : [tableKey]
						});
					} else {
						_area.tblLst.push(tableKey);
					}
				});
			};

			/**
			 * 更新本地桌台数据结构表
			 * @param  {[type]} records [description]
			 * @return {[type]}         [description]
			 */
			var updateTableDB = function (records) {
				_.each(records, function (table) {
					var areaName = _.result(table, 'areaName'),
						tableName = _.result(table, 'tableName'),
						itemID = _.result(table, 'itemID');
					var tbl = TableHT.get(itemID);
					// 更新桌台状态数据
					_.extend(tbl, table);
				});
			};

			/**
			 * 获取桌台及状态信息列表数据
			 * @param  {[type]} params [description]
			 * @return {[type]}        [description]
			 */
			this.loadTableStatusLst = function (params) {
				var callServer = null;
				var areaName = _.result(params, 'areaName', ''),
					tableName = _.result(params, 'tableName', '');
				callServer = CommonCallServer.getTableStatusLst({
					areaName : areaName,
					tableName : tableName
				}).success(function (data, status, headers, config) {
					var code = _.result(data, 'code'),
						_data = _.result(data, 'data', {}),
						records = _.result(_data, 'records', []);
					if (code == '000') {
						if (_.isEmpty(areaName) && _.isEmpty(tableName)) {
							// 如果获取全部桌台状态数据，需要初始化本地数据结构表
							initTableDB(records);
						} else {
							// 如果获取指定区域|桌台状态数据，只需要局部更新本地数据结构表
							updateTableDB(records);
						}
					}
				}).error(function (data, status, headers, config) {

				});
				return callServer;
			};

			/**
			 * 过滤桌台数据
			 * @return {[type]} [description]
			 */
			this.filterTableLst = function (tableStatus, areaName) {
				var tables = null, area = null;
				if (_.isEmpty(areaName)) {
					tables = TableHT.getAll();
				} else {
					area = AreaTableHT.get(areaName);
					tables = TableHT.getByKeys(_.result(area, 'tblLst', []));
				}
				if (tableStatus != -1) {
					tables = _.filter(tables, function (table) {
						return table.tableStatus == tableStatus;
					});
				}
				return tables;
			};

			/**
			 * 根据tableName查找桌台数据
			 * @param  {[type]} tableName [description]
			 * @return {[type]}           [description]
			 */
			this.queryTableByTableName = function (tableName) {
				var tables = TableHT.getAll();
				return _.find(tables, function (table) {
					return _.result(table, 'tableName') == tableName;
				});
			};

			/**
			 * 获取桌台区域数据
			 * @return {[type]} [description]
			 */
			this.getTableAreas = function () {
				var areas = AreaTableHT.getAll();
				return areas;
			};

			/**
			 * 根据itemID获取table数据
			 * 
			 * @param  {[type]} tableKey [description]
			 * @return {[type]}          [description]
			 */
			this.getTableByItemID = function (itemID) {
				return TableHT.get(itemID);
			};

			/**
			 * 根据桌台名称获取桌台数据
			 * @param  {[type]} tableName [description]
			 * @return {[type]}           [description]
			 */
			this.getTablesByTableName = function (tableName) {
				var tables = TableHT.getAll();
				// 先模糊匹配桌台
				var matchedTables = _.filter(tables, function (table) {
					var _name = _.result(table, 'tableName', '');
					return _name.indexOf(tableName) > -1;
				});

				// 从模糊匹配的桌台中查找是否有完全匹配的桌台
				// 如果没有取模糊匹配中的第一个匹配到的桌台
				// 如果有完全匹配的则去匹配到的桌台
				var equalTables = _.filter(matchedTables, function (table) {
					var _name = _.result(table, 'tableName', '');
					return _name == tableName;
				});
				return _.isEmpty(equalTables) ? matchedTables : equalTables;
			};
		}
	]);
});