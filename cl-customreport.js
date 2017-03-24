define(["jquery","underscore","qlik","ng!$q","ng!$http","./properties","./initialproperties","client.utils/state","./lib/js/extensionUtils","./lib/external/Sortable/Sortable","text!./lib/css/style.css","text!./lib/partials/customreport.ng.html"],function(a,b,c,d,e,f,g,h,i,j,k,l){"use strict";return i.addStyleToHeader(k),{definition:f,initialProperties:g,support:{snapshot:!0,"export":!1},resize:function(a,b){this.$scope.size.clientHeight=a[0].clientHeight,this.$scope.size.clientWidth=a[0].clientWidth,this.$scope.handleResize(a,b.props.allowCollapse)},paint:function(a,b){const d=this;return d.$scope.size.clientHeight=a[0].clientHeight,d.$scope.size.clientWidth=a[0].clientWidth,d.$scope.handleResize(a,b.props.allowCollapse),d.$scope.isInitialized()?void d.$scope.deserializeReport().then(function(){return d.$scope.showLimits(),c.Promise.resolve()}):c.Promise.resolve()},getExportRawDataOptions:function(c,d,e){var f=a("#cl-customreport-container"+d.id);d.getVisualization().then(function(){f.scope().collapsed||c.addItem(f.scope().fieldsAndSortbarVisible?{translation:"AppOverview.Expand",tid:"Expand",icon:"icon-maximize",select:function(){f.parents(".qv-inner-object").css("overflow","visible"),f.scope().hideFieldAndSortbar()}}:{translation:"AppOverview.Collapse",tid:"Collapse",icon:"icon-minimize",select:function(){f.parents(".qv-inner-object").css("overflow","hidden"),f.scope().showFieldAndSortbar()}});var a=b.countBy(f.scope().report.usedDimensionsAndMeasures,"type"),d=a.dimension?f.scope().report.dimensions.length-a.dimension:f.scope().report.dimensions.length,g=a.measure?f.scope().report.measures.length-a.measure:f.scope().report.measures.length;if(d||g){var h=c.addItem({translation:"properties.add",tid:"add-submenu",icon:"icon-add"});if(d){var i=h.addItem({translation:"Visualization.Requirements.AddDimension",tid:"add-dimension-submenu",icon:"icon-add"});b.each(f.scope().report.dimensions,function(a){a.selected||i.addItem({translation:a.title,tid:"dimension",select:function(){f.scope().selectItem(a)}})})}if(g){var j=h.addItem({translation:"Visualization.Requirements.AddMeasure",tid:"add-measure-submenu",icon:"icon-add"});b.each(f.scope().report.measures,function(a){a.selected||j.addItem({translation:a.title,tid:"switch",select:function(){f.scope().selectItem(a)}})})}}if(a.dimension||a.measure){var k=c.addItem({translation:"Common.Delete",tid:"remove-submenu",icon:"icon-remove"});if(a.dimension){var l=k.addItem({translation:"Common.Dimension",tid:"remove-dimension-submenu",icon:"icon-remove"});b.each(f.scope().report.dimensions,function(a){a.selected&&l.addItem({translation:a.title,tid:"dimension",select:function(){f.scope().removeItem(a)}})})}if(a.measure){var m=k.addItem({translation:"Common.Measure",tid:"remove-measure-submenu",icon:"icon-remove"});b.each(f.scope().report.measures,function(a){a.selected&&m.addItem({translation:a.title,tid:"switch",select:function(){f.scope().removeItem(a)}})})}}var n=f.scope().data.masterObjectList;if(n.length>1){var o=c.addItem({translation:"library.Visualizations",tid:"switch-submenu",icon:"icon-cogwheel"});b.each(f.scope().data.masterObjectList,function(a){a.qInfo.qId!=f.scope().data.activeTable.qInfo.qId&&o.addItem({translation:a.qMeta.title,tid:"switch",icon:"icon-table",select:function(){f.scope().data.activeTable=a,f.scope().changeTable()}})})}var p=f.scope().report.visualScope;return p&&p.object&&p.object.canShowExploreMenu()&&c.addItem({translation:p.object.showExploreMenu?"contextMenu.closeVisualExploration":"contextMenu.openVisualExploration",tid:"nav-menu-explore",icon:"icon-control",select:function(){var a=f.scope().report.visualScope,b=a&&a.object;b&&(b.showExploreMenu?(b.toggleExploreMenu(),b.resize()):(a.options.zoomEnabled=!0,a.options.isZoomed=!0,b&&(f.scope().object=b,b.toggleExploreMenu(!0),b.resize())))}}),c.addItem({translation:"contextMenu.export",tid:"export",icon:"icon-toolbar-sharelist",select:function(){f.scope().exportData("exportToExcel")}}),void e.resolve()})},template:l,controller:["$scope",function(e){function f(){var a=d.defer();return m.getAppObjectList("masterobject",function(c){e.data.masterObjectList=b.reduce(c.qAppObjectList.qItems,function(a,c){return"All tables"==e.data.tag?a.push(c):c.qMeta&&b.each(c.qMeta.tags,function(b){b==e.data.tag&&a.push(c)}),a},[]),e.isShowMasterObjectList=e.data.masterObjectList.length>1,!e.data.activeTable&&e.data.masterObjectList.length>0&&(e.data.activeTable=e.data.masterObjectList[0]),a.resolve(!0)}),a.promise}function g(){m.getList("MeasureList",function(a){e.data.masterMeasures=a.qMeasureList}),m.getList("DimensionList",function(a){e.data.masterDimensions=a.qDimensionList})}function i(){var a=d.defer(),c=b.reduce(e.report.usedDimensionsAndMeasures,function(a,b){return"dimension"==b.type&&(b.columnOptions.dataId=b.dataId,a.push(b.columnOptions)),a},[]),f=b.reduce(e.report.usedDimensionsAndMeasures,function(a,b){return"measure"==b.type&&(b.columnOptions.dataId=b.dataId,a.push(b.columnOptions)),a},[]),g=[],h=0,i=0;b.each(e.report.usedDimensionsAndMeasures,function(a){"measure"==a.type?(g.push(c.length+h),h+=1):(g.push(i),i+=1)});for(var j=[],k=0;k<e.report.usedDimensionsAndMeasures.length;k++)j.push(-1);return e.getInterColumnSortOrder().then(function(b){a.resolve({dimensions:c,measures:f,columnOrder:g,columnWidths:j,qInterColumnSortOrder:b&&b.qInterColumnSortOrder,interColumnSortOrder:b&&b.interColumnSortOrder,qNoOfLeftDims:b&&b.NoOfLeftDims||e.report.NoOfLeftDims||c.length})}),a.promise}e.customReportId=e.layout.qInfo.qId,e.size={clientHeight:-1,clientWidth:-1},e.fieldsAndSortbarVisible=!0,e.collapsed=!1,e.minWidthCollapsed=200,e.minHeightCollapsed=200,e.isShouldCommitChanges=!1,e.data={tag:null,tagColor:!0,sortOrder:"SortByA",activeTable:null,displayText:"Custom Report",masterObjectList:[],masterDimensions:null,masterMeasures:null};var k=c.currApp().model.layout.permissions;e.isUpdateRights=k&&k.update,e.isShowMasterObjectList=!1,e.report={title:null,visual:null,visualizationType:null,usedDimensionsAndMeasures:[],layout:null,dimensions:[],measures:[],interColumnSortOrder:[],columnOrder:[],NoOfLeftDims:null,currentState:null,limits:{dimensions:0,measures:0},selections:{dimension:0,measure:0}};var l=function(a){a.preventDefault(),a.stopPropagation()};e.reportConfig={group:{name:"report",put:["dim","measure"]},animation:150,ghostClass:"ghost",onStart:function(){a("body").on("dragstart",".qv-panel-wrap",l),a("body").on("dragover",".qv-panel-wrap",l)},onEnd:function(){a("body").off("dragstart",".qv-panel-wrap",l),a("body").off("dragover",".qv-panel-wrap",l)},onSort:function(a){e.report.usedDimensionsAndMeasures.splice(a.newIndex,0,e.report.usedDimensionsAndMeasures.splice(a.oldIndex,1)[0]),e.createChart()}},e.isInitialized=function(){return e.data.masterMeasures&&e.data.masterDimensions&&e.data.masterObjectList.length>0};var m=c.currApp(),n=e.$parent.layout.qExtendsId?e.$parent.layout.qExtendsId:e.$parent.layout.qInfo.qId;e.handleResize=function(a,b){a[0].clientHeight<e.minHeightCollapsed||a[0].clientWidth<e.minWidthCollapsed?!e.collapsed&&b&&(e.collapsed=!0,e.createChart()):e.collapsed&&(e.collapsed=!1,e.createChart())},e.getClass=function(){return h.isInAnalysisMode()?"":"no-interactions"},e.getDimensionsProps=function(a,c){return b.map(a,function(a){if(a.qLibraryId){var d=b.find(e.data.masterDimensions.qItems,function(b){return b.qInfo.qId==a.qLibraryId}),f=a;return f.qType="dimension",{title:d.qMeta.title,description:d.qMeta.description,columnOptions:f,type:"dimension",selected:c?!0:!1,dataId:a.qLibraryId}}return{title:""==a.qDef.qFieldLabels[0]?a.qDef.qFieldDefs[0]:a.qDef.qFieldLabels[0],description:"",columnOptions:a,type:"dimension",selected:c?!0:!1,dataId:a.qDef.cId}})},e.getMeasuresProps=function(a,c){return b.map(a,function(a){if(a.qLibraryId){var d=b.find(e.data.masterMeasures.qItems,function(b){return b.qInfo.qId==a.qLibraryId}),f=a;return f.qType="measure",{title:d.qMeta.title,description:d.qMeta.description,columnOptions:f,type:"measure",selected:c?!0:!1,dataId:a.qLibraryId}}return{title:a.qDef.qLabel?a.qDef.qLabel:a.qDef.qDef,description:"",columnOptions:a,type:"measure",selected:c?!0:!1,dataId:a.qDef.cId}})},e.loadActiveTable=function(){var a=d.defer();return null!==e.data.activeTable?setTimeout(function(){e.data.activeTable&&m.getObjectProperties(e.data.activeTable.qInfo.qId).then(function(c){e.report.title=c.properties.title,e.report.visualizationType=c.properties.visualization;var d=[];d=d.concat(e.getDimensionsProps(c._properties.qHyperCubeDef.qDimensions));var f=[];f=f.concat(e.getMeasuresProps(c._properties.qHyperCubeDef.qMeasures)),c._properties.qHyperCubeDef.qLayoutExclude&&c._properties.qHyperCubeDef.qLayoutExclude.qHyperCubeDef&&(d=d.concat(e.getDimensionsProps(c._properties.qHyperCubeDef.qLayoutExclude.qHyperCubeDef.qDimensions)),f=f.concat(e.getMeasuresProps(c._properties.qHyperCubeDef.qLayoutExclude.qHyperCubeDef.qMeasures))),e.report.dimensions="SortByA"==e.data.sortOrder?b.sortBy(d,function(a){return a.title}):d,e.report.measures="SortByA"==e.data.sortOrder?b.sortBy(f,function(a){return a.title}):f,a.resolve(!0)})},500):a.resolve(!1),a.promise},e.showLimits=function(){var a=e.data.activeTable,c=a&&b.find(e.layout.props.constraints,function(b){return b.object===a.qInfo.qId});if(c){e.report.limits.dimensions=c.dimension,e.report.limits.measures=c.measure;var d=b.countBy(e.report.usedDimensionsAndMeasures,"type");e.report.selections.dimension=d.dimension||0,e.report.selections.measure=d.measure||0}else e.report.limits.dimensions=0,e.report.limits.measures=0},e.changeTable=function(){e.data.activeTable&&(e.isShouldCommitChanges=!1,e.closeVisualization(),e.loadActiveTable().then(function(){e.deserializeReport({isLoadStateOnly:!0,qId:e.data.activeTable.qInfo.qId}).then(e.showLimits)}))},e.updateUsedDimensionsMeasures=function(a){var b=[];b=b.concat(e.getDimensionsProps(a.qDimensions,!0)),b=b.concat(e.getMeasuresProps(a.qMeasures,!0)),e.report.usedDimensionsAndMeasures=b},e.visualizationChanged=function(){var a=e.report.visual&&e.report.visual.model;if(a&&e.layout.props.variableExp===e.report.currentState){"pivot-table"===e.report.visualizationType&&(e.report.NoOfLeftDims=a.layout.qHyperCube.qNoOfLeftDims);var c=b.filter(b.keys(a.layout),function(a){return!a.match(/^q/)});e.report.layout=b.pick(a.layout,c),e.report.qInterColumnSortOrder=[],b.each(a.layout.qHyperCube.qEffectiveInterColumnSortOrder,function(a){e.report.qInterColumnSortOrder.push(a)}),a.effectiveProperties.qHyperCubeDef?(e.updateUsedDimensionsMeasures(a.effectiveProperties.qHyperCubeDef),e.serializeReport()):a.getEffectiveProperties().then(function(a){e.report.visual&&e.report.visualizationType===a.visualization&&(e.updateUsedDimensionsMeasures(a.qHyperCubeDef),e.serializeReport())})}},e.closeVisualization=function(){e.report.visual&&(e.report.visual.model.Validated.unbind(e.visualizationChanged),e.report.visual.close(),e.report.visual=null,e.report.visualScope=null)},e.createVisualization=function(){var c=d.defer();return e.closeVisualization(),i().then(function(d){if(e.report.visualizationType&&d.dimensions.length>0&&d.measures.length>0){var f={qDimensions:d.dimensions,qMeasures:d.measures,columnWidths:d.columnWidths};"table"===e.report.visualizationType&&d.columnOrder&&d.columnOrder.length>0&&(f.columnOrder=d.columnOrder),"pivot-table"!==e.report.visualizationType||isNaN(d.qNoOfLeftDims)||(f.qNoOfLeftDims=d.qNoOfLeftDims),d.qInterColumnSortOrder&&d.qInterColumnSortOrder.length>0&&(f.qInterColumnSortOrder=d.qInterColumnSortOrder);var g={};e.report.layout&&(g=b.extend(g,e.report.layout)),g.title=""==e.report.title?e.data.activeTable.qMeta.title:e.report.title,g.qHyperCubeDef=f,m.visualization.create(e.report.visualizationType,null,g).then(function(b){var d=(e.fieldsAndSortbarVisible?"customreporttable":"customreporttablezoomed")+e.customReportId;b.show(d),e.report.visual=b,e.report.visualScope=a("#"+d).find(".qv-object-content-container").scope(),e.report.visual.model.Validated.bind(e.visualizationChanged),c.resolve(!0)})}}),c.promise},e.prepareTable=function(b){var c=d.defer();return a("#cl-customreport-container"+e.customReportId+" .rain").show(),e.loadActiveTable().then(function(){b?(a("#cl-customreport-container"+e.customReportId+" .rain").hide(),c.resolve(!0)):e.deserializeReport({isLoadStateOnly:!0}).then(function(){a("#cl-customreport-container"+e.customReportId+" .rain").hide(),c.resolve(!0),e.showLimits()})}),c.promise},e.getInterColumnSortOrder=function(){var a=d.defer();if(e.report.visual&&0==e.report.interColumnSortOrder.length){var c=e.report.visual.model;c.getEffectiveProperties().then(function(d){var f=d.qHyperCubeDef.qDimensions.length,g=[],h=[];b.each(c.layout.qHyperCube.qEffectiveInterColumnSortOrder,function(a){if(h.push(a),a>=f){var c={dataId:d.qHyperCubeDef.qMeasures[a-f].dataId,type:"measure"};c.qSortBy=d.qHyperCubeDef.qMeasures[a-f].qSortBy,d.qHyperCubeDef.qMeasures[a-f].qDef.qReverseSort&&(c.qReverseSort=!0),g.push(c)}else if(a>=0){var c={dataId:d.qHyperCubeDef.qDimensions[a].dataId,type:"dimension"};d.qHyperCubeDef.qDimensions[a].qDef.qReverseSort&&(c.qReverseSort=!0),g.push(c)}else-1==a&&b.each(d.qHyperCubeDef.qMeasures,function(a){var b={dataId:a.dataId,type:"measure"};b.qSortBy=a.qSortBy,g.push(b)})}),e.report.NoOfLeftDims=d.qHyperCubeDef.qNoOfLeftDims,e.report.interColumnSortOrder=g,e.report.qInterColumnSortOrder=h,a.resolve(e.report)})}else{if(e.report.interColumnSortOrder.length!=e.report.usedDimensionsAndMeasures.length){var f=[],g=[];b.each(e.report.usedDimensionsAndMeasures,function(a,b){"pivot-table"===e.report.visualizationType&&"measure"===a.type?-1===f.indexOf(-1)&&f.push(-1):f.push(b),g.push({dataId:a.dataId,type:a.type})}),e.report.qInterColumnSortOrder=f,e.report.interColumnSortOrder=g}a.resolve(e.report)}return a.promise},e.setReportState=function(a,c,f){var g=d.defer(),h=c?d.resolve():e.prepareTable(f);return h.then(function(){a&&a.usedDimensionsAndMeasures&&b.each(a.usedDimensionsAndMeasures,function(a){var b=e.report.dimensions.map(function(a){return a.dataId}).indexOf(a.dataId);b>-1?e.report.dimensions[b].selected=!0:(b=e.report.measures.map(function(a){return a.dataId}).indexOf(a.dataId),b>-1&&(e.report.measures[b].selected=!0))}),g.resolve()}),g.promise},e.createChart=function(){e.createVisualization().then(function(){e.serializeReport()})},e.selectItem=function(a){var c=e.report.usedDimensionsAndMeasures.map(function(a){return a.dataId}).indexOf(a.dataId);if(c>-1){a.selected=!1,e.report.usedDimensionsAndMeasures.splice(c,1);var d=e.report.selections[a.type];d>0&&(e.report.selections[a.type]=d-1)}else{var f=e.data.activeTable,g=f&&b.find(e.layout.props.constraints,function(a){return a.object===f.qInfo.qId});if(g){var d=b.countBy(e.report.usedDimensionsAndMeasures,"type");if(g[a.type]>0&&d[a.type]>=g[a.type])return;e.report.selections[a.type]=(d[a.type]||0)+1}a.selected=!0,e.report.usedDimensionsAndMeasures.push(a)}e.isShouldCommitChanges=!0},e.commitChanges=function(){e.isShouldCommitChanges=!1,e.createChart()},e.clearAll=function(){b.each(e.report.dimensions,function(a){a.selected=!1}),b.each(e.report.measures,function(a){a.selected=!1}),e.report.usedDimensionsAndMeasures=[],e.report.interColumnSortOrder=[],e.report.qInterColumnSortOrder=[],e.showLimits(),e.createChart()},e.removeItem=function(a){if(e.report.usedDimensionsAndMeasures=b.without(e.report.usedDimensionsAndMeasures,a),"measure"==a.type){var c=e.report.measures.map(function(a){return a.dataId}).indexOf(a.dataId);c>=0&&c<e.report.measures.length&&(e.report.measures[c].selected=!1)}else{var c=e.report.dimensions.map(function(a){return a.dataId}).indexOf(a.dataId);c>=0&&c<e.report.dimensions.length&&(e.report.dimensions[c].selected=!1)}e.showLimits(),e.createChart()},e.hideFieldAndSortbar=function(){e.fieldsAndSortbarVisible=!1,e.createChart()},e.showFieldAndSortbar=function(){e.fieldsAndSortbarVisible=!0,e.createChart()},e.exportData=function(a){if(e.report.usedDimensionsAndMeasures.length>0){var b={};switch(a){case"exportToExcel":b={download:!0};break;case"exportAsCSV":b={format:"CSV_C",download:!0};break;case"exportAsCSVTab":b={format:"CSV_T",download:!0};break;case"exportToClipboard":b={download:!0}}e.report.visual&&m.visualization.get(e.report.visual.id).then(function(a){a.table.exportData(b)})}},e.storeSessionData=function(a){var b=n+"_"+a.activeTableId;sessionStorage.setItem(b,JSON.stringify(a))},e.restoreSessionData=function(a){var b=n+"_"+a;return sessionStorage.getItem(b)},e.serializeReportData=function(){if(!e.data.activeTable)return d.reject();var a=d.defer(),b=e.data.activeTable.qInfo.qId,c={activeTableId:b,fieldsAndSortbarVisible:e.fieldsAndSortbarVisible,states:{}};return c.states[b]={qId:b,visualizationType:e.data.activeTable.qData.visualization,usedDimensionsAndMeasures:e.report.usedDimensionsAndMeasures,layout:e.report.layout,qNoOfLeftDims:e.report.NoOfLeftDims},e.getInterColumnSortOrder().then(function(d){d&&(c.states[b].interColumnSortOrder=d.interColumnSortOrder,c.states[b].qInterColumnSortOrder=d.qInterColumnSortOrder),a.resolve(c)}),a.promise},e.serializeReport=function(){e.serializeReportData().then(function(a){e.storeSessionData(a);var b=JSON.stringify(a);if(e.report.currentState!=b){e.report.currentState=b;var c=e.layout.props.variable;c&&m.variable.getByName(c).then(function(a){a?a.setProperties({qName:c,qDefinition:b,qIncludeInBookmark:!0}):m.variable.create({qName:c,qDefinition:b,qIncludeInBookmark:!0})})}})},e.deserializeReport=function(a){var c=a&&a.isLoadStateOnly,f=a&&a.qId,g=f,h=d.defer(),i=e.layout.props.variableExp;if(g&&(i=e.restoreSessionData(f)),i)if(e.report.currentState!=i){var j,k={};try{j=JSON.parse(i)}catch(l){}if(j){var m=f||j.activeTableId;e.fieldsAndSortbarVisible=j.fieldsAndSortbarVisible,k=j.states&&j.states[m],k&&(e.report.visualizationType=k.visualizationType,isNaN(k.qNoOfLeftDims)||(e.report.NoOfLeftDims=k.qNoOfLeftDims),e.report.qInterColumnSortOrder=k.qInterColumnSortOrder?k.qInterColumnSortOrder:[],e.report.interColumnSortOrder=k.interColumnSortOrder?k.interColumnSortOrder:[],e.report.layout=k.layout,e.data.activeTable=b.find(e.data.masterObjectList,function(a){return a.qInfo.qId==m&&a.qData.visualization==e.report.visualizationType}))}e.report.usedDimensionsAndMeasures=k&&k.usedDimensionsAndMeasures||[],e.setReportState(k,c,!0).then(function(){!c||g?e.createChart():e.report.usedDimensionsAndMeasures.length>0&&e.serializeReport(),h.resolve()})}else h.resolve();else e.data.activeTable=f?b.find(e.data.masterObjectList,function(a){return a.qInfo.qId==f}):null,e.report.visualizationType=e.data.activeTable&&e.data.activeTable.qData.visualization||null,e.fieldsAndSortbarVisible=!0,e.report.interColumnSortOrder=[],e.report.qInterColumnSortOrder=[],e.report.usedDimensionsAndMeasures=[],e.report.currentState=null,e.report.NoOfLeftDims=null,e.report.layout=null,h.resolve();return h.promise},e.$on("$destroy",function(){e.serializeReport()}),e.$watchCollection("layout.props.tagSetting",function(a){e.data.tag=a,f()}),e.$watchCollection("layout.props.tagColor",function(a){e.data.tagColor=a}),e.$watchCollection("layout.props.collapseMinWidth",function(a){e.minWidthCollapsed=a}),e.$watchCollection("layout.props.collapseMinHeight",function(a){e.minHeightCollapsed=a}),e.$watchCollection("layout.props.displayText",function(a){e.data.displayText=a}),e.$watchCollection("layout.props.dimensionSortOrder",function(a){e.data.sortOrder=a,e.loadActiveTable()}),e.getListMaxHeight=function(a){var b=38,c=e.report.dimensions.length,d=e.report.measures.length,f=140,g=(e.size.clientHeight-f)/2,h=b*c>g?0:g-b*c,i=b*d>g?0:g-b*d;return c>0?"dimension"==a?{"max-height":g+i+"px"}:{"max-height":g+h+"px"}:{height:g+"px"}},e.getTableHeight=function(){var b=70,c=a("#cl-customreport-container"+e.customReportId+" #reportSortable").height();return e.fieldsAndSortbarVisible?{height:e.size.clientHeight-b-c+"px","padding-top":"18px"}:{height:e.size.clientHeight+"px"}},e.getContainerWidth=function(a){var b=220,c={};return c="left"==a?b:e.fieldsAndSortbarVisible?e.size.clientWidth-b-20:e.size.clientWidth,{width:c+"px"}},g(),f().then(function(){var b=a("#cl-customreport-container"+e.customReportId+" #reportSortable")[0];j.create(b,e.reportConfig),e.deserializeReport().then(e.showLimits),a("#cl-customreport-container"+e.customReportId+" .rain").hide(),e.fieldsAndSortbarVisible||a("#cl-customreport-container"+e.customReportId).parents(".qv-inner-object").css("overflow","visible")})}]}});