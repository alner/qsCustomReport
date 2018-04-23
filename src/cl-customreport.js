define([
        'jquery',
        'underscore',
        'qlik',
        'ng!$q',
        'ng!$http',
        './properties',
        './initialproperties',
        'client.utils/state',
        './lib/js/extensionUtils',
        './lib/external/Sortable/Sortable',
        'text!./lib/css/style.css',
        'text!./lib/partials/customreport.ng.html',
    ],
    function($, _, qlik, $q, $http, props, initProps, stateUtil, extensionUtils, sortable, cssContent, ngTemplate) {
        'use strict';

        extensionUtils.addStyleToHeader(cssContent);

        return {

            definition: props,
            initialProperties: initProps,
            support: {
                snapshot: true,
                export: false
            },

            resize: function($element, layout) {
                this.$scope.size.clientHeight = $element[0].clientHeight;
                this.$scope.size.clientWidth = $element[0].clientWidth;

                this.$scope.handleResize($element,layout.props.allowCollapse);

            },

            paint: function($element, layout) {
                const self = this;
                self.$scope.size.clientHeight = $element[0].clientHeight //$element.context.clientHeight;
                self.$scope.size.clientWidth = $element[0].clientWidth;

                self.$scope.handleResize($element,layout.props.allowCollapse);

                //const readyToPrint = new qlik.Promise(function(resolve, reject){                
                if(self.$scope.isInitialized()) {
                //if(!this.$scope.isChangedTable) {
                    //this.$scope.closeVisualization();
                    self.$scope.deserializeReport().then(function(){
                        self.$scope.showLimits();
                        return qlik.Promise.resolve();
                    }); // {isProhibitVariableChange: true}
                //}
                //else
                //this.$scope.isChangedTable = false; // reset flag
                } else {
                    return qlik.Promise.resolve();
                }
                //});
            },

            getExportRawDataOptions: function(a, c, e) {
                var customReportContainer$ = $('#cl-customreport-container' + c.id);
                c.getVisualization().then(function(visualization) {
                    if (!customReportContainer$.scope().collapsed) {
                        if (customReportContainer$.scope().fieldsAndSortbarVisible) {
                            a.addItem({
                                translation: "AppOverview.Expand", //"Hide fields/sortbar",
                                tid: "Expand",
                                icon: "icon-maximize",
                                select: function() {
                                    //console.log($('#cl-customreport-container').scope());
                                    customReportContainer$.parents('.qv-inner-object').css('overflow', 'visible');
                                    customReportContainer$.scope().hideFieldAndSortbar();
                                }
                            });

                        } else {
                            a.addItem({
                                translation: "AppOverview.Collapse",//"Show fields/sortbar",
                                tid: "Collapse",
                                icon: "icon-minimize",
                                select: function() {
                                    //console.log($('#cl-customreport-container').scope());
                                    customReportContainer$.parents('.qv-inner-object').css('overflow', 'hidden');
                                    customReportContainer$.scope().showFieldAndSortbar();
                                }
                            });
                        }
                    }
                    var count = _.countBy(customReportContainer$.scope().report.usedDimensionsAndMeasures, 'type');

                    var unselectedDimensionCount = count.dimension ? customReportContainer$.scope().report.dimensions.length - count.dimension
                                                                   : customReportContainer$.scope().report.dimensions.length;
                    var unselectedMeasuresCount = count.measure ? customReportContainer$.scope().report.measures.length - count.measure
                                                                   : customReportContainer$.scope().report.measures.length;
                    //Add fields
                    if (unselectedDimensionCount || unselectedMeasuresCount) {

                        var submenuAdd = a.addItem({
                            translation: "properties.add", //"Add fields",
                            tid: "add-submenu",
                            icon: "icon-add"
                        });
                        if (unselectedDimensionCount) {

                            var submenuAddDimension = submenuAdd.addItem({
                                translation: "Visualization.Requirements.AddDimension",//"Add dimension",
                                tid: "add-dimension-submenu",
                                icon: "icon-add"
                            });

                             _.each(customReportContainer$.scope().report.dimensions, function(item){
                                //console.log(item);
                                if (!item.selected) {
                                    submenuAddDimension.addItem({
                                        translation: item.title,
                                        tid: "dimension",
                                        select: function() {
                                            customReportContainer$.scope().selectItem(item);
                                        }
                                    });
                                }
                             });
                         }

                         if (unselectedMeasuresCount) {

                            var submenuAddMeasure = submenuAdd.addItem({
                                translation: "Visualization.Requirements.AddMeasure",//"Add measure",
                                tid: "add-measure-submenu",
                                icon: "icon-add"
                            });

                             _.each(customReportContainer$.scope().report.measures, function(item){
                                //console.log(item);
                                if (!item.selected) {
                                    submenuAddMeasure.addItem({
                                        translation: item.title,
                                        tid: "switch",
                                        select: function() {
                                            customReportContainer$.scope().selectItem(item);
                                        }
                                    });
                                }
                             });
                         }

                     }

                    //Remove fields
                    //console.log('count',count);
                    if (count.dimension || count.measure) {

                        var submenuRemove = a.addItem({
                            translation: "Common.Delete", //"Remove fields",
                            tid: "remove-submenu",
                            icon: "icon-remove"
                        });
                        if (count.dimension) {

                            var submenuRemoveDimension = submenuRemove.addItem({
                                translation: "Common.Dimension", //"Remove dimension",
                                tid: "remove-dimension-submenu",
                                icon: "icon-remove"
                            });

                             _.each(customReportContainer$.scope().report.dimensions, function(item){
                                //console.log(item);
                                if (item.selected) {
                                    submenuRemoveDimension.addItem({
                                        translation: item.title,
                                        tid: "dimension",
                                        select: function() {
                                            customReportContainer$.scope().removeItem(item);
                                        }
                                    });
                                }
                             });
                         }

                         if (count.measure) {

                            var submenuRemoveMeasure = submenuRemove.addItem({
                                translation: "Common.Measure", //"Remove measure",
                                tid: "remove-measure-submenu",
                                icon: "icon-remove"
                            });

                             _.each(customReportContainer$.scope().report.measures, function(item){
                                //console.log(item);
                                if (item.selected) {
                                    submenuRemoveMeasure.addItem({
                                        translation: item.title,
                                        tid: "switch",
                                        select: function() {
                                            customReportContainer$.scope().removeItem(item);
                                        }
                                    });
                                }
                             });
                         }

                     }

                    var masterObjectList = customReportContainer$.scope().data.masterObjectList;
                    if(masterObjectList.length > 1) {
                      var submenuSwitchTable = a.addItem({
                              translation: "library.Visualizations", //"Switch table",
                              tid: "switch-submenu",
                              icon: "icon-cogwheel"
                      });
                       _.each(customReportContainer$.scope().data.masterObjectList, function(item){
                          //console.log(item);
                          if (item.qInfo.qId !=  customReportContainer$.scope().data.activeTable.qInfo.qId) {
                              submenuSwitchTable.addItem({
                                  translation: item.qMeta.title,
                                  tid: "switch",
                                  icon: "icon-table",
                                  select: function() {
                                      customReportContainer$.scope().data.activeTable = item;
                                      customReportContainer$.scope().changeTable();
                                  }
                              });
                          }
                       });
                    }
                   
                    var visualScope = customReportContainer$.scope().report.visualScope;
                    //var currentObject; // to store original object from scope
                    if(visualScope && visualScope.object && visualScope.object.canShowExploreMenu())
                    a.addItem({
                        translation: visualScope.object.showExploreMenu ? "contextMenu.closeVisualExploration" : "contextMenu.openVisualExploration",
                        tid: "nav-menu-explore",
                        icon: "icon-control",
                        select: function() {                            
                            var visualScope = customReportContainer$.scope().report.visualScope;
                            var visualObject = visualScope && visualScope.object;
                            if(!visualObject) return;
                            
                            if(visualObject.showExploreMenu) {
                                // Close exploration menu
                                visualObject.toggleExploreMenu();
                                visualObject.resize();
                            } else {
                                // Open exploration menu                                
                                // TODO ? store original object currentObject = customReportContainer$.scope().object
                                // and restore on ... ?
                                 
                                // isZoomed should be set to be able to show Exploration menu
                                visualScope.options.zoomEnabled = true;
                                visualScope.options.isZoomed = true;
                                if(visualObject) {
                                    //currentObject = customReportContainer$.scope().object; // store original object 
                                    customReportContainer$.scope().object = visualObject;
                                    visualObject.toggleExploreMenu(true);
                                    //customReportContainer$.scope().object.toggleExploreMenu(true);                                                            
                                    //customReportContainer$.scope().object.ext.mappedSoftDefinition = object.ext.mappedSoftDefinition;
                                    visualObject.resize();
                                }
                                //}
                                // if need it to zoom on action use the following code
                                // var exploreMenuItem = _.find(c.navMenu.items, function(item) {
                                //     return item.tid == "nav-menu-explore";
                                // });
                                // exploreMenuItem.action();
                            }
                        }
                    });


                    return a.addItem({
                        translation: "contextMenu.export",
                        tid: "export",
                        icon: "icon-toolbar-sharelist",
                        select: function() {
                            customReportContainer$.scope().exportData('exportToExcel');
                        }
                    }), void e.resolve();
                });
            },

            template: ngTemplate,

            controller: ['$scope', function($scope) {
                $scope.customReportId = $scope.layout.qInfo.qId;
                $scope.size = {
                    clientHeight: -1,
                    clientWidth: -1
                }

                $scope.fieldsAndSortbarVisible = true;
                $scope.collapsed = false;
                $scope.minWidthCollapsed = 200;
                $scope.minHeightCollapsed = 200;
                //$scope.isChangedTable = false;
                $scope.isShouldCommitChanges = false;

                $scope.data = {
                    tag: null,
                    tagColor: true,
                    sortOrder: 'SortByA',
                    activeTable: null,
                    displayText: 'Custom Report',
                    vizualizationsLabel: $scope.layout.props.visualizationsLabel,
                    dimensionsLabel: $scope.layout.props.dimensionsLabel,
                    measuresLabel: $scope.layout.props.measuresLabel,
                    masterObjectList: [],
                    masterDimensions: null,
                    masterMeasures: null,
                    user: '',
                };
                // {
                //     tag: null,
                //     tagColor: true,
                //     sortOrder: 'SortByA',
                //     activeTable: null,
                //     displayText: 'Custom Report',
                //     masterObjectList: [],
                //     masterDimensions: null,
                //     masterMeasures: null,                     
                // };
                var permissions = qlik.currApp().model.layout.permissions;
                $scope.isUpdateRights = permissions && permissions.update;
                $scope.isShowMasterObjectList  = false;

                // Current (displayed) report configuration
                $scope.report = {
//                    tableID: null,
                    title: null,
                    visual: null, // qlik visual object
                    visualizationType: null, // visual type name. e.g. "pivot-table", "table", etc.
                    // report: [], ???
                    usedDimensionsAndMeasures: [], // current displayed report configuration
                    layout: null,
                    dimensions: [],
                    measures: [],
                    interColumnSortOrder: [],
                    columnOrder: [],
                    NoOfLeftDims: null,
                    currentState: null,
                    limits: {
                        dimensions: 0, // current report dimensions limit. 0 - no limits
                        measures: 0, // current report measures limit. 0 - no limits
                        //objects: {} // limits for all objects
                    },
                    selections: {
                        dimension: 0, // count of selected dimensions
                        measure: 0 // count of selected measures
                    }
                };

                var dragoverHandler = function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                };

                $scope.reportConfig = {
                    group: {
                        name: "report",
                        put: ['dim', 'measure']
                    },
                    animation: 150,
                    ghostClass: "ghost",
                    onStart: function( /** ngSortEvent */ evt) {
                        $('body').on('dragstart', '.qv-panel-wrap', dragoverHandler);
                        $('body').on('dragover', '.qv-panel-wrap', dragoverHandler);
                    },
                    onEnd: function( /** ngSortEvent */ evt) {
                        $('body').off('dragstart', '.qv-panel-wrap', dragoverHandler);
                        $('body').off('dragover', '.qv-panel-wrap', dragoverHandler);
                    },
                    onSort: function( /** ngSortEvent */ evt) {
                        $scope.report.usedDimensionsAndMeasures.splice(evt.newIndex, 0, $scope.report.usedDimensionsAndMeasures.splice(evt.oldIndex, 1)[0]);
                        $scope.createChart();
                    },
                };

                $scope.isInitialized = function(){
                  return $scope.data.masterMeasures &&
                    $scope.data.masterDimensions &&
                    $scope.data.masterObjectList.length > 0;
                }

                var app = qlik.currApp();

                var localStorageId = $scope.$parent.layout.qExtendsId ? $scope.$parent.layout.qExtendsId : $scope.$parent.layout.qInfo.qId;

                $scope.handleResize = function($element, allowCollapse) {

                    if ($element[0].clientHeight < $scope.minHeightCollapsed || $element[0].clientWidth < $scope.minWidthCollapsed) {
                        if (!$scope.collapsed && allowCollapse) {
                            $scope.collapsed = true;
                            $scope.createChart();
                        }
                    } else {
                         if ($scope.collapsed) {
                            $scope.collapsed = false;
                            $scope.createChart();
                        }
                    }
                }


                $scope.getClass = function() {
                    return stateUtil.isInAnalysisMode() ? "" : "no-interactions";
                };

                function initMasterItems() {
                    var deferred = $q.defer();

                    //app.getAppObjectList('masterobject', function(reply) {
                    //app.getList('MasterObject').then(function(reply) {
                    app.createGenericObject({
                        qInfo: {
                            qType:"MasterObject",
                            qId:"MUMkRcqL"
                        },
                        qAppObjectListDef: {
                            qType:"masterobject",
                            qData:{ 
                                name:"/metadata/name",
                                visualization:"/visualization",
                                title:"/title",
                                tags:"/metadata/tags"
                            }
                        }
                        // user: {
                        //     qStringExpression: "=PurgeChar(replace(replace(osuser( ), ';', '_'), '=', '_'), ' ''')"
                        // },
                    }).then(function(model) {
                        var reply = model.layout;
                        //$scope.data.user = reply.user;
                        $scope.data.masterObjectList = _.reduce(reply.qAppObjectList.qItems, function(acc, obj) {
                            //if (obj.qData.visualization == 'table') {
                                if ($scope.data.tag == 'All tables') {
                                    acc.push(obj);
                                } else {
                                    if(obj.qMeta)
                                        _.each(obj.qMeta.tags, function(tag) {
                                            if (tag == $scope.data.tag) {
                                                acc.push(obj);
                                            }
                                        });
                                }
                            //}
                            return acc;
                        }, []);
                        $scope.isShowMasterObjectList = $scope.data.masterObjectList.length > 1;

                        if(!$scope.data.activeTable && $scope.data.masterObjectList.length > 0)
                            $scope.data.activeTable = $scope.data.masterObjectList[0];

                        app.destroySessionObject(model.id);

                        deferred.resolve(true);
                    });
                    return deferred.promise;
                }

                function initLibraryItems() {
                    app.getList('MeasureList', function(reply) {
                        $scope.data.masterMeasures = reply.qMeasureList;
                    });
                    app.getList('DimensionList', function(reply) {
                        $scope.data.masterDimensions = reply.qDimensionList;
                    });
                }

                function getObjectProperties() {
                  var deferred = $q.defer();

                  var dimensions = _.reduce($scope.report.usedDimensionsAndMeasures, function(acc, obj) {
                      if (obj.type == 'dimension') {
                          obj.columnOptions.dataId = obj.dataId
                          acc.push(obj.columnOptions);
                      }
                      return acc;
                  }, []);

                  var measures = _.reduce($scope.report.usedDimensionsAndMeasures, function(acc, obj) {
                      if (obj.type == 'measure') {
                          obj.columnOptions.dataId = obj.dataId
                          acc.push(obj.columnOptions);
                      }
                      return acc;
                  }, []);

                  var columnOrder = []; //$scope.report.columnOrder; //[];
                  var measureCount = 0;
                  var dimensionCount = 0;

                  _.each($scope.report.usedDimensionsAndMeasures, function(obj) {
                      if (obj.type == 'measure') {
                          columnOrder.push(dimensions.length + measureCount);
                          measureCount = measureCount + 1;
                      } else {
                          columnOrder.push(dimensionCount);
                          dimensionCount = dimensionCount + 1;
                      }
                  });

                  var columnWidths = [];

                  for (var i = 0; i < $scope.report.usedDimensionsAndMeasures.length; i++) {
                      columnWidths.push(-1);
                  }

                  $scope.getInterColumnSortOrder().then(function(report) {
                      //var qInterColumnSortOrder = [];

                      /*
                      if(report)
                        _.each(report.interColumnSortOrder, function(item) {
                            if (item.type == "measure") {
                                var idx = measures.map(function(x) {
                                    return x.dataId;
                                }).indexOf(item.dataId);
                                if (idx > -1) {
                                    //qInterColumnSortOrder.push(idx + dimensionCount);
                                    measures[idx].qSortBy = item.qSortBy;
                                    if (item.qReverseSort) {
                                        measures[idx].qDef.autoSort = false
                                        measures[idx].qDef.qReverseSort = item.qReverseSort
                                    }
                                }
                            } else {
                                var idx = dimensions.map(function(x) {
                                    return x.dataId;
                                }).indexOf(item.dataId);
                                if (idx > -1) {
                                    //qInterColumnSortOrder.push(idx);
                                    if (item.qReverseSort) {
                                        dimensions[idx].qDef.autoSort = false
                                        dimensions[idx].qDef.qReverseSort = item.qReverseSort
                                    }
                                }
    
                            }
                        });
                        */

                      //add newly added item to qInterColumnSortOrder
                      // if (qInterColumnSortOrder.length != columnOrder.length) {
                      //     var missingValues = _.difference(columnOrder, qInterColumnSortOrder)
                      //     _.each(missingValues, function(value) {
                      //         qInterColumnSortOrder.push(value);
                      //     })
                      // }
                      
                      deferred.resolve({
                        dimensions: dimensions,
                        measures: measures,
                        columnOrder: columnOrder,
                        columnWidths: columnWidths,
                        qInterColumnSortOrder: report && report.qInterColumnSortOrder,
                        interColumnSortOrder: report && report.interColumnSortOrder,
                        qNoOfLeftDims: (report && report.NoOfLeftDims) || $scope.report.NoOfLeftDims || dimensions.length
                      });
                  });

                  return deferred.promise;
                }
                
                $scope.getDimensionsProps = function (qDimensions, isSelected) {
                    //var dataId = defaultDataId;
                    return _.map(qDimensions.dimensionInfos, function(dimensionInfo) {
                        //dataId = dataId + 1;
                        var dimension = _.find(qDimensions.dimensionDefs, function(item) {
                            return item.qDef.cId == dimensionInfo.cId;
                        });
                        var dimensionOptions = dimension;

                        if (dimension.qLibraryId) {
                            dimensionOptions.qType = 'dimension';
                        }
                                                    
                        // if (dimension.qLibraryId) {
                        //     var libraryItem = _.find($scope.data.masterDimensions.qItems, function(item) {
                        //         return item.qInfo.qId == dimension.qLibraryId;
                        //     });
                        //     dimensionOptions = libraryItem;
                        //     dimensionOptions.qType = 'dimension';                                
                        // } else {
                        //     dimensionOptions = dimension;
                        // }

                        return {
                            title: dimensionInfo.qFallbackTitle || (dimension.qDef && dimension.qDef.qFieldLabels[0] == '' ? dimension.qDef.qFieldDefs[0] : dimension.qDef.qFieldLabels[0]),
                            description: '',
                            columnOptions: dimensionOptions,
                            type: 'dimension',
                            selected: isSelected ? true : false,
                            dataId: dimension.qLibraryId || dimension.qDef.cId
                        };
                    });
                    
                    //return dataId;
                }
                
                $scope.getMeasuresProps = function(qMeasures, isSelected){
                    // var dataId = defaultDataId;
                    return _.map(qMeasures.measureInfos, function(measureInfo) {
                        // dataId = dataId + 1;
                        var measure = _.find(qMeasures.measureDefs, function(item) {
                            return item.qDef.cId == measureInfo.cId;
                        });
                        var measureOptions = measure;

                        if (measure.qLibraryId) {
                            measureOptions.qType = 'measure';
                        }

                        // if (measure.qLibraryId) {
                        //     var libraryItem = _.find($scope.data.masterMeasures.qItems, function(item) {
                        //         return item.qInfo.qId == measure.qLibraryId;
                        //     });

                        //     measureOptions = libraryItem;
                        //     measureOptions.qType = 'measure';
                        // } else {
                        //     measureOptions = measure;
                        // }

                        return {
                            title: measureInfo.qFallbackTitle || (measure.qDef && measure.qDef.qLabel ? measure.qDef.qLabel : measure.qDef.qDef),
                            description: '',
                            columnOptions: measureOptions,
                            type: 'measure',
                            selected: isSelected ? true : false,
                            dataId: measure.qLibraryId || measure.qDef.cId
                        };
                    });
                    
                    // return dataId;
                }

                $scope.applyDimensionsAndMeasures = function(dimensions, measures) {
                    $scope.report.dimensions = $scope.data.sortOrder == 'SortByA' ? _.sortBy(dimensions, function(item) {
                        return item.title;
                    }) : dimensions;                                
                    
                    $scope.report.measures = $scope.data.sortOrder == 'SortByA' ? _.sortBy(measures, function(item) {
                        return item.title;
                    }) : measures;
                } 

                $scope.getDimensionsAndMeasuresFor = function(qId) {
                    if(!qId) return $q.resolve();

                    var deferred = $q.defer();
                    app.getFullPropertyTree(qId)
                    .then(function(model) {
                        model.getLayout().then(function(layout) {
                            $scope.report.title = layout.title; //model.properties.title;
                            $scope.report.visualizationType = layout.visualization; //model.properties.visualization;                            
                            // Dimensions                                
                            var dimensions = []; // result dimensions array                                                
                            dimensions = dimensions.concat($scope.getDimensionsProps({
                                dimensionInfos: layout.qHyperCube.qDimensionInfo,
                                dimensionDefs: model.propertyTree.qProperty.qHyperCubeDef.qDimensions
                            }));

                            // Measures
                            var measures = [];                            
                            measures = measures.concat($scope.getMeasuresProps({
                                measureInfos: layout.qHyperCube.qMeasureInfo,
                                measureDefs: model.propertyTree.qProperty.qHyperCubeDef.qMeasures
                            }));

                            if(model.propertyTree.qProperty.qHyperCubeDef.qLayoutExclude && 
                            model.propertyTree.qProperty.qHyperCubeDef.qLayoutExclude.qHyperCubeDef) {
                                var qExcludedHyperCubeDef = model.propertyTree.qProperty.qHyperCubeDef.qLayoutExclude.qHyperCubeDef; //JSON.parse(JSON.stringify(model.propertyTree.qProperty.qHyperCubeDef.qLayoutExclude.qHyperCubeDef));
                                qExcludedHyperCubeDef.qCalcCond.qv = '=false()';
                                app.createCube(qExcludedHyperCubeDef).then(function(reply){
                                    dimensions = dimensions.concat($scope.getDimensionsProps({
                                        dimensionInfos: reply.layout.qHyperCube.qDimensionInfo,
                                        dimensionDefs: qExcludedHyperCubeDef.qDimensions
                                    }));

                                    measures = measures.concat($scope.getMeasuresProps({
                                        measureInfos: reply.layout.qHyperCube.qMeasureInfo,
                                        measureDefs: qExcludedHyperCubeDef.qMeasures
                                    }));

                                    $scope.applyDimensionsAndMeasures(dimensions, measures);
                                    deferred.resolve(true);
                                    app.destroySessionObject(reply.id);
                                })
                                .catch(function(err){
                                    deferred.reject();
                                });
                            } else {
                                $scope.applyDimensionsAndMeasures(dimensions, measures);
                                deferred.resolve(true);
                            }
                        }).catch(function(err){
                            deferred.reject();
                        });
                    }).catch(function(err){
                        deferred.reject();
                    });

                    return deferred.promise;
                }

                $scope.loadActiveTable = function() {
                    var deferred = $q.defer();
                    // used dimensions and measures for 
                    //$scope.report.usedDimensionsAndMeasures = [];
                    //$scope.createChart();
                    if( $scope.data.activeTable !== null) {
                        setTimeout(function() {
                          if($scope.data.activeTable)
                            //app.getObjectProperties($scope.data.activeTable.qInfo.qId).then(function(model) {
                            $scope.getDimensionsAndMeasuresFor($scope.data.activeTable.qInfo.qId).then(function(){
                                deferred.resolve(true);
                            }).catch(function(err){
                                deferred.reject();
                            });
                            /*
                            app.getFullPropertyTree($scope.data.activeTable.qInfo.qId)
                            .then(function(model) {
                                model.getLayout().then(function(layout) {
                                    $scope.report.title = layout.title; //model.properties.title;
                                    $scope.report.visualizationType = layout.visualization; //model.properties.visualization;
                                    
                                    //var dataId = -1;
                                    
                                    // Dimensions                                
                                    var dimensions = []; // result dimensions array
                                    dimensions = dimensions.concat($scope.getDimensionsProps(
                                        //model._properties.qHyperCubeDef.qDimensions
                                        {
                                            dimensionInfos: layout.qHyperCube.qDimensionInfo,
                                            dimensionDefs: model.propertyTree.qProperty.qHyperCubeDef.qDimensions
                                        }
                                    ));

                                    // Measures
                                    var measures = [];
                                    measures = measures.concat($scope.getMeasuresProps(
                                        //model._properties.qHyperCubeDef.qMeasures 
                                        {
                                            measureInfos: layout.qHyperCube.qMeasureInfo,
                                            measureDefs: model.propertyTree.qProperty.qHyperCubeDef.qMeasures
                                        }
                                    ));

                                    if(model.propertyTree.qProperty.qHyperCubeDef.qLayoutExclude && 
                                    model.propertyTree.qProperty.qHyperCubeDef.qLayoutExclude.qHyperCubeDef) {
                                        var qExcludedHyperCubeDef = model.propertyTree.qProperty.qHyperCubeDef.qLayoutExclude.qHyperCubeDef; //JSON.parse(JSON.stringify(model.propertyTree.qProperty.qHyperCubeDef.qLayoutExclude.qHyperCubeDef));
                                        qExcludedHyperCubeDef.qCalcCond.qv = '=false()';
                                        app.createCube(qExcludedHyperCubeDef).then(function(reply){
                                            dimensions = dimensions.concat($scope.getDimensionsProps({
                                                dimensionInfos: reply.layout.qHyperCube.qDimensionInfo,
                                                dimensionDefs: qExcludedHyperCubeDef.qDimensions
                                            }));

                                            measures = measures.concat($scope.getMeasuresProps({
                                                measureInfos: reply.layout.qHyperCube.qMeasureInfo,
                                                measureDefs: qExcludedHyperCubeDef.qMeasures
                                            }));

                                            $scope.applyDimensionsAndMeasures(dimensions, measures);
                                            deferred.resolve(true);
                                            app.destroySessionObject(reply.id);
                                        })
                                        .catch(function(err){
                                            deferred.reject(false);
                                        });
                                    } else {
                                        $scope.applyDimensionsAndMeasures(dimensions, measures);
                                        deferred.resolve(true);                                        
                                    }                                                                        
                                });
                            });
                            */
                        }, 500);
                    } else {
                        deferred.resolve(false);
                    }

                    return deferred.promise;
                }

                // $scope.loadState = function(isLoadStateOnly) {
                //   var deferred = $q.defer();
                //   var state = {};
                //   /*
                //   var localStorageToken = JSON.parse(localStorage.getItem(localStorageId));
                //   if (undefined != localStorageToken && undefined != localStorageToken.states) {
                //       state = localStorageToken.states[$scope.data.activeTable.qInfo.qId];
                //       if (state) {
                //           $scope.report.interColumnSortOrder = state.qInterColumnSortOrder ? state.qInterColumnSortOrder : [];
                //       }
                //   }
                //   */
                //   $scope.deserializeReport(isLoadStateOnly)
                //   $scope.setReportState(state, isLoadStateOnly).then(function(){
                //     if(!isLoadStateOnly)
                //       $scope.createChart();
                //     deferred.resolve();
                //   });
                //   return deferred.promise;
                // }

                // $scope.limitsChanged = function() {
                //     var activeTableId = $scope.data.activeTable.qInfo.qId;
                //     if(activeTableId) {
                //         console.log($scope.report.limits.dimensions);
                //         console.log($scope.report.limits.measures);
                //         var limits = $scope.report.limits.objects[activeTableId];
                //         if(!limits) $scope.report.limits.objects[activeTableId] = {};
                //         $scope.report.limits.objects[activeTableId].dimensions = $scope.report.limits.dimensions;
                //         $scope.report.limits.objects[activeTableId].measures = $scope.report.limits.measures;
                //     }

                //     $scope.serializeReport();
                // }

                $scope.showLimits = function() {
                    // show limits for dimensions/measures if applied...
                    var activeObject = $scope.data.activeTable;
                    var limits = activeObject && _.find($scope.layout.props.constraints, function(limit) {
                        return limit.object === activeObject.qInfo.qId;
                    });

                    if(limits) {
                        // Current object limits
                        $scope.report.limits.dimensions = limits.dimension;
                        $scope.report.limits.measures = limits.measure;

                        var count = _.countBy($scope.report.usedDimensionsAndMeasures, 'type');
                        $scope.report.selections.dimension = count.dimension || 0;
                        $scope.report.selections.measure = count.measure || 0;
                    } else {
                        $scope.report.limits.dimensions = 0;
                        $scope.report.limits.measures = 0;
                    }
                }

                $scope.changeTable = function() {
                  if($scope.data.activeTable) {
                        //$scope.isChangedTable = true;
                        $scope.isShouldCommitChanges = false;
                        //$scope.report.visualizationType = $scope.data.activeTable.qData.visualization;
                        $scope.closeVisualization();
                        $scope.loadActiveTable().then(function(){
                            $scope.deserializeReport({
                                isLoadStateOnly: true,
                                qId: $scope.data.activeTable.qInfo.qId
                            }).then($scope.showLimits);

                        });                        
                  }
                  //$scope.prepareTable();
                  //$scope.deserializeReport({isLoadStateOnly: false, qId: $scope.data.activeTable.qInfo.qId});
                }

                $scope.updateUsedDimensionsMeasures = function(qHyperCubeDef, qHyperCube) {
                    var usedDimensionsAndMeasures = [];
                    usedDimensionsAndMeasures = usedDimensionsAndMeasures.concat($scope.getDimensionsProps(
                        {
                            dimensionInfos: qHyperCube.qDimensionInfo,
                            dimensionDefs: qHyperCubeDef.qDimensions
                        },
                        true // all dimensions selected
                    ));

                    usedDimensionsAndMeasures = usedDimensionsAndMeasures.concat($scope.getMeasuresProps(
                        {
                            measureInfos: qHyperCube.qMeasureInfo,
                            measureDefs: qHyperCubeDef.qMeasures
                        },
                        true // all measures selected
                    ));

                    $scope.report.usedDimensionsAndMeasures = usedDimensionsAndMeasures;
                };

                $scope.visualizationChanged = function() {
                  var model = $scope.report.visual && $scope.report.visual.model;
                  if(!model || ($scope.layout.props.variableExp !== $scope.report.currentState))
                    return;

                  if($scope.report.visualizationType === 'pivot-table') {
                        // tracking qNoOfLeftDims and qInterColumnSortOrder as for now only
                        $scope.report.NoOfLeftDims = model.layout.qHyperCube.qNoOfLeftDims;

                        // $scope.report.qInterColumnSortOrder = [];
                        // _.each(model.layout.qHyperCube.qEffectiveInterColumnSortOrder, function(item) {
                        //     $scope.report.qInterColumnSortOrder.push(item);
                        // });
                  }
                    
                  // check if something changed using exploration menu
                  //var visualScope = $scope.report.visualScope;
                  //if(visualScope && visualScope.object && visualScope.object.showExploreMenu) {                      
                        // layout changed
                        var propsWhiteList = _.filter(_.keys(model.layout), function(item){
                            return !item.match(/^q/); // exclude all props started with "q" (whose are process by engine)
                        });
                        // store layout without q-properties
                        $scope.report.layout = _.pick(model.layout, propsWhiteList);

                        $scope.report.qInterColumnSortOrder = [];
                        _.each(model.layout.qHyperCube.qEffectiveInterColumnSortOrder, function(item) {
                            $scope.report.qInterColumnSortOrder.push(item);
                        });                        
                      
                        /*
                            _.each(model.layout.qHyperCube.qDimensionInfo, function(dimension, index) {
                                var itemToMove = _.find($scope.report.usedDimensionsAndMeasures, function(item) {
                                    return item.type == 'dimension' && 
                                        (item.columnOptions.dataId == dimension.cId || 
                                        item.columnOptions.dataId == dimension.qLibraryId);
                                });
                                if(itemToMove)
                                    usedDimensionsAndMeasures.push(itemToMove);
                            });
                            
                            _.each(model.layout.qHyperCube.qMeasureInfo, function(measure, index) {
                                var itemToMove = _.find($scope.report.usedDimensionsAndMeasures, function(item) {
                                    return item.type == 'measure' && 
                                        (item.columnOptions.dataId == measure.cId || 
                                        item.columnOptions.dataId == measure.qLibraryId);
                                });
                                if(itemToMove)
                                    usedDimensionsAndMeasures.push(itemToMove);                            
                            });
                        */                      
                       // Change dimension and measures order, sorting oder
                       $scope.getDimensionsAndMeasuresFor($scope.data.activeTable && $scope.data.activeTable.qInfo.qId).then(function(){
                            // model.getEffectiveProperties().then(function(reply) {
                            if(model.effectiveProperties && model.effectiveProperties.qHyperCubeDef) {
                                $scope.updateUsedDimensionsMeasures(model.effectiveProperties.qHyperCubeDef, model.layout.qHyperCube);
                                $scope.serializeReport();
                            } else {
                                model.getEffectiveProperties().then(function(reply){
                                    if($scope.report.visual
                                    && $scope.report.visualizationType === reply.visualization) {
                                        $scope.updateUsedDimensionsMeasures(reply.qHyperCubeDef, model.layout.qHyperCube);
                                        $scope.serializeReport();
                                    }
                                });
                            }
                        });                        
                  //}                  
                }

                $scope.closeVisualization = function(){
                  if($scope.report.visual) {
                    $scope.report.visual.model.Validated.unbind($scope.visualizationChanged);
                    $scope.report.visual.close();
                    $scope.report.visual = null;
                    $scope.report.visualScope = null;
                  }
                }

                $scope.createVisualization = function() {
                  var deferred = $q.defer();

                  $scope.closeVisualization();

                  getObjectProperties().then(function(data){
                    //console.log('createVisualization DATA', data, $scope.report.visualization);
                    if($scope.report.visualizationType
                    && data.dimensions.length > 0
                    && data.measures.length > 0) {
                        var HyperCubeDef = {
                          qDimensions: data.dimensions,
                          qMeasures: data.measures,
                          columnWidths: data.columnWidths
                        };

                        if($scope.report.visualizationType === 'table'
                        && data.columnOrder && data.columnOrder.length > 0)
                          HyperCubeDef.columnOrder= data.columnOrder;

                        if($scope.report.visualizationType === 'pivot-table'
                        && !isNaN(data.qNoOfLeftDims))
                          HyperCubeDef.qNoOfLeftDims = data.qNoOfLeftDims;

                        if(data.qInterColumnSortOrder && data.qInterColumnSortOrder.length > 0)
                          HyperCubeDef.qInterColumnSortOrder = data.qInterColumnSortOrder;

                        //console.log('HyperCubeDef ', HyperCubeDef);
                        var options = {};                         
                        if($scope.report.layout) {
                         options = _.extend(options, $scope.report.layout);    
                        }                        
                        options.title = $scope.report.title == '' ? $scope.data.activeTable.qMeta.title : $scope.report.title;
                        options.qHyperCubeDef = HyperCubeDef;
                        
                        app.visualization.create($scope.report.visualizationType, [], options).then(function(visual) {
                            //$scope.report.tableID = visual.id;
                            var id = ($scope.fieldsAndSortbarVisible ? 'customreporttable' : 'customreporttablezoomed') + $scope.customReportId;
                            visual.show(id);
                            $scope.report.visual = visual;
                            $scope.report.visualScope = $('#'+id).find('.qv-object-content-container').scope();
                            // Invalidated
                            $scope.report.visual.model.Validated.bind($scope.visualizationChanged);
                            deferred.resolve(true);
                        });
                    }
                  });

                  return deferred.promise;
                }

                $scope.prepareTable = function(isOmitDeserialization) {
                    var deferred = $q.defer();
                    $('#cl-customreport-container' + $scope.customReportId + ' .rain').show();
                    $scope.loadActiveTable().then(function() {
                        //$scope.loadState(true)
                        if(!isOmitDeserialization)
                            $scope.deserializeReport({isLoadStateOnly: true}).then(function(){
                                $('#cl-customreport-container' + $scope.customReportId + ' .rain').hide();                                
                                deferred.resolve(true);
                                $scope.showLimits();
                            });
                        else {
                                $('#cl-customreport-container' + $scope.customReportId + ' .rain').hide();
                                deferred.resolve(true);
                        }
                        // $scope.createVisualization().then(function(){
                        //   $(".rain").hide();
                        //   deferred.resolve(true);
                        // });
                    });
                    return deferred.promise;
                }

                $scope.getInterColumnSortOrder = function() {
                    var deferred = $q.defer();


                    if ($scope.report.visual && $scope.report.interColumnSortOrder.length == 0) {
                        //app.getObject($scope.report.visual.id).then(function(model) {                            
                            var model = $scope.report.visual.model;
                            model.getEffectiveProperties().then(function(reply) {
                                // reply.qHyperCubeDef - just serialize it !!!
                                var dimCount = reply.qHyperCubeDef.qDimensions.length;
                                var interColSortOrder = [];
                                var qInterColSortOrder = [];
                                // reply.qHyperCubeDef.qInterColumnSortOrder
                                //model.layout.qHyperCube.qEffectiveInterColumnSortOrder
                                //var newOrder = 0;
                                // model.
                                _.each(model.layout.qHyperCube.qEffectiveInterColumnSortOrder, function(item) {

                                    qInterColSortOrder.push(item);
                                    // if(item >= 0)
                                    //   qInterColSortOrder.push(newOrder++); // item
                                    // else
                                    //   qInterColSortOrder.push(item); // -1

                                    if (item >= dimCount) {
                                        var newItem = {
                                            dataId: reply.qHyperCubeDef.qMeasures[item - dimCount].dataId,
                                            type: "measure"
                                        }
                                        newItem.qSortBy = reply.qHyperCubeDef.qMeasures[item - dimCount].qSortBy;
                                        if (reply.qHyperCubeDef.qMeasures[item - dimCount].qDef.qReverseSort) {
                                            newItem.qReverseSort = true
                                        }
                                        interColSortOrder.push(newItem);
                                    } else if(item >= 0) {
                                        var newItem = {
                                            dataId: reply.qHyperCubeDef.qDimensions[item].dataId,
                                            type: "dimension"
                                        }
                                        if (reply.qHyperCubeDef.qDimensions[item].qDef.qReverseSort) {
                                            newItem.qReverseSort = true
                                        }
                                        interColSortOrder.push(newItem);
                                    } else if (item == -1) {
                                      // pivot tables - measures
                                      _.each(reply.qHyperCubeDef.qMeasures, function(measure) {
                                          var newItem = {
                                              dataId: measure.dataId,
                                              type: "measure"
                                          }
                                          newItem.qSortBy = measure.qSortBy; // ?
                                          interColSortOrder.push(newItem);
                                      });
                                    }
                                });
                                $scope.report.NoOfLeftDims = reply.qHyperCubeDef.qNoOfLeftDims;
                                //$scope.report.columnOrder = reply.qHyperCubeDef.columnOrder;
                                $scope.report.interColumnSortOrder = interColSortOrder;
                                $scope.report.qInterColumnSortOrder = qInterColSortOrder;
                                deferred.resolve($scope.report);
                            })
                        //});
                    } else {
                        // get stored data
                        if($scope.report.interColumnSortOrder.length != $scope.report.usedDimensionsAndMeasures.length) {
                            var qInterColumnSortOrder = [];
                            var interColumnSortOrder = []; 

                            _.each($scope.report.usedDimensionsAndMeasures, function(item, index) {
                                if($scope.report.visualizationType === 'pivot-table' 
                                && item.type === 'measure') {
                                    if(qInterColumnSortOrder.indexOf(-1) === -1)
                                        qInterColumnSortOrder.push(-1);
                                } else
                                    qInterColumnSortOrder.push(index);

                                interColumnSortOrder.push({
                                    dataId: item.dataId,
                                    type: item.type
                                });
                            });

                            $scope.report.qInterColumnSortOrder = qInterColumnSortOrder;
                            $scope.report.interColumnSortOrder = interColumnSortOrder; 
                        }
                        deferred.resolve($scope.report);
                    }
                    return deferred.promise;
                };

                $scope.setReportState = function(state, isSetStateOnly, isOmitDeserialiation) {
                    var deferred = $q.defer();
                    var promise = isSetStateOnly ? $q.resolve() : $scope.prepareTable(isOmitDeserialiation);
                    promise.then(function() {
                            //var newState = [];
                            if(state && state.usedDimensionsAndMeasures)
                            _.each(state.usedDimensionsAndMeasures, function(item) {
                                var idx = $scope.report.dimensions.map(function(x) {
                                    return x.dataId;
                                }).indexOf(item.dataId);
                                if (idx > -1) {
                                    $scope.report.dimensions[idx].selected = true;
                                    //newState.push($scope.report.dimensions[idx]);
                                } else {
                                    idx = $scope.report.measures.map(function(x) {
                                        return x.dataId;
                                    }).indexOf(item.dataId);
                                    if (idx > -1) {
                                        $scope.report.measures[idx].selected = true;
                                        //newState.push($scope.report.measures[idx]);
                                    }
                                }
                            });
                            //$scope.report.usedDimensionsAndMeasures = newState;
                            deferred.resolve();
                    });
                    return deferred.promise;
                };

                $scope.createChart = function() {
                    //if ($scope.report.tableID != '') {
                    //if ($scope.report.usedDimensionsAndMeasures.length > 0) {
                      $scope.createVisualization().then(function AfterCreateVisualization(){
                        $scope.serializeReport();
                      });
                      //$(".rain").hide();
                    //}
                }

                $scope.selectItem = function(item) {
                    var idx = $scope.report.usedDimensionsAndMeasures.map(function(x) {
                        return x.dataId;
                    }).indexOf(item.dataId);
                    if (idx > -1) {
                        item.selected = false;
                        $scope.report.usedDimensionsAndMeasures.splice(idx, 1);
                        var count = $scope.report.selections[item.type];
                        if(count > 0)
                          $scope.report.selections[item.type] = count - 1; // deselected one
                    } else {
                        // check limits
                        // ... if limits exists
                        var activeObject = $scope.data.activeTable;
                        // ... find limits for "active" object
                        var limits = activeObject && _.find($scope.layout.props.constraints, function(limit) {
                            return limit.object === activeObject.qInfo.qId;
                        });

                        if(limits) {
                            var count = _.countBy($scope.report.usedDimensionsAndMeasures, 'type');
                            if(limits[item.type] > 0 && count[item.type] >= limits[item.type])
                                return;

                            $scope.report.selections[item.type] = (count[item.type] || 0) + 1;                                
                        }

                        item.selected = true;
                        $scope.report.usedDimensionsAndMeasures.push(item);
                    }
                    $scope.isShouldCommitChanges = true;
                    //$scope.createChart();
                }

                $scope.commitChanges = function(){
                  $scope.isShouldCommitChanges = false;
                  $scope.createChart();
                }

                $scope.clearAll = function() {
                    _.each($scope.report.dimensions, function(dimension) {
                        dimension.selected = false;
                    })

                    _.each($scope.report.measures, function(measure) {
                        measure.selected = false;
                    })

                    $scope.report.usedDimensionsAndMeasures = [];
                    $scope.report.interColumnSortOrder = [];
                    $scope.report.qInterColumnSortOrder = [];
                    $scope.report.currentState = null;
                    $scope.showLimits();
                    $scope.createChart();
                }

                $scope.removeItem = function(item) {
                    $scope.report.usedDimensionsAndMeasures = _.without($scope.report.usedDimensionsAndMeasures, item);

                    if (item.type == 'measure') {
                        var idx = $scope.report.measures.map(function(x) {
                            return x.dataId;
                        }).indexOf(item.dataId);
                        if(idx >=0 && idx < $scope.report.measures.length)
                            $scope.report.measures[idx].selected = false;
                    } else {
                        var idx = $scope.report.dimensions.map(function(x) {
                            return x.dataId;
                        }).indexOf(item.dataId);
                        if(idx >=0 && idx < $scope.report.dimensions.length)
                            $scope.report.dimensions[idx].selected = false;
                    }
                    $scope.showLimits();
                    $scope.createChart();
                }

                $scope.hideFieldAndSortbar = function() {
                    $scope.fieldsAndSortbarVisible = false;
                    $scope.createChart();
                }

                $scope.showFieldAndSortbar = function() {
                    $scope.fieldsAndSortbarVisible = true;
                    $scope.createChart();
                }
                $scope.exportData = function(string) {
                    if ($scope.report.usedDimensionsAndMeasures.length > 0) {
                        var options = {};
                        switch (string) {
                            //app level commands
                            case 'exportToExcel':
                                options = {
                                    download: true
                                };
                                break;
                            case 'exportAsCSV':
                                options = {
                                    format: 'CSV_C',
                                    download: true
                                };
                                break;
                            case 'exportAsCSVTab':
                                options = {
                                    format: 'CSV_T',
                                    download: true
                                };
                                break;
                            case 'exportToClipboard':
                                options = {
                                    download: true
                                };
                                break;
                        }
                        if($scope.report.visual)
                        app.visualization.get($scope.report.visual.id).then(function(visual) {
                            visual.table.exportData(options);
                        });
                    }
                }

                $scope.storeSessionData = function(data){
                  var key = localStorageId + '_' + data.activeTableId;
                  // states[data.activeTableId]
                  sessionStorage.setItem(key, JSON.stringify(data));
                }

                $scope.restoreSessionData = function(activeTableId) {
                  var key = localStorageId + '_' + activeTableId;
                  //var stateStr =
                  return sessionStorage.getItem(key);
                  // if(stateStr)
                  //   try {
                  //     data.states[data.activeTableId] = JSON.parse(stateStr);
                  //   } catch(e) {}
                }

                $scope.serializeReportData = function() {
                  if(!$scope.data.activeTable)
                    return $q.reject();

                  var deferred = $q.defer();

                  var activeTableId = $scope.data.activeTable.qInfo.qId;
                  var data = {
                    activeTableId: activeTableId,
                    fieldsAndSortbarVisible: $scope.fieldsAndSortbarVisible,
                    states: {}
                    //limits: {}
                  };

                //   var itemIds = [];
                //   _.each($scope.report.usedDimensionsAndMeasures, function(item) {
                //       itemIds.push(item.dataId);
                //   });

                  data.states[activeTableId] = {
                    qId: activeTableId,
                    //itemIds: itemIds,
                    visualizationType: $scope.data.activeTable.qData.visualization,
                    usedDimensionsAndMeasures: $scope.report.usedDimensionsAndMeasures,
                    layout: $scope.report.layout,
                    qNoOfLeftDims: $scope.report.NoOfLeftDims,
                    // limits: {
                    //     // active object limits
                    //     dimensions: $scope.report.limits.dimensions,
                    //     measures: $scope.report.limits.measures
                    // }
                  };

                  // store limits (copy)
                //   var objectsForLimits = _.keys($scope.report.limits.objects);
                //   _.each(objectsForLimits, function(objectId){
                //       data.limits[objectId] = _.clone($scope.report.limits.objects[objectId]);
                //   });

                  $scope.getInterColumnSortOrder().then(function(report) {
                      if(report) {
                        data.states[activeTableId].interColumnSortOrder = report.interColumnSortOrder;
                        data.states[activeTableId].qInterColumnSortOrder = report.qInterColumnSortOrder;
                        /*
                        if(report.visualizationType === 'pivot-table' &&
                            data.states[activeTableId].interColumnSortOrder &&
                            data.states[activeTableId].interColumnSortOrder.length > 0) {
                            data.states[activeTableId].itemIds = [];
                            _.each(data.states[activeTableId].interColumnSortOrder, function(item) {
                                data.states[activeTableId].itemIds.push(item.dataId);
                            });
                        }
                        */
                      }
                      //data.states[activeTableId].qNoOfLeftDims = $scope.report.NoOfLeftDims;
                      deferred.resolve(data);
                  });

                  return deferred.promise;
                }

                $scope.serializeReport = function() {
                    $scope.serializeReportData().then(function(data){
                        $scope.storeSessionData(data);

                        //if(currentModel && currentModel.activeTableId === data.activeTableId) {
                        var dataToStore = JSON.stringify(data);
                        if($scope.report.currentState != dataToStore) {
                            $scope.report.currentState = dataToStore;

                            var variableName = $scope.layout.props.variable; // + $scope.data.user;
                            if(variableName)
                                app.variable.getByName(variableName).then(function(varModel){
                                    //console.log('varModel', varModel);
                                    if(varModel) {
                                        varModel.setStringValue(dataToStore);
                                        //varModel.setProperties({qInfo: {qType: "variable"}, qMeta: {privileges: ["read", "update"]}, qName: variableName, qDefinition: dataToStore, qIncludeInBookmark: true});
                                        // varModel.applyPatches({
                                        //     qPath: "/qDefinition",
                                        //     qOp: "replace",
                                        //     qValue: '1'
                                        // }, true);
                                    } else {
                                        app.variable.createSessionVariable({qInfo: {qType: "variable"}, qMeta: {privileges: ["read", "update"]}, qName: variableName, qDefinition: dataToStore, qIncludeInBookmark: true});
                                    }
                                }).catch(function(){
                                    app.variable.createSessionVariable({qInfo: {qType: "variable"}, qMeta: {privileges: ["read", "update"]}, qName: variableName, qDefinition: dataToStore, qIncludeInBookmark: true});
                                });
                        }
                        //}
                    });
                }

                $scope.deserializeReport = function(props) {
                    var isLoadStateOnly = props && props.isLoadStateOnly;
                    var qId = props && props.qId;
                    var isRestoreSession = qId;
                    var deferred = $q.defer();
                    var varModel = $scope.layout.props.variableExp;
                    if(isRestoreSession)
                      varModel = $scope.restoreSessionData(qId);

                    //app.variable.getByName('ReportConfig').then(function(varModel){
                    if(!varModel) {
                      if(!qId) {
                        $scope.data.activeTable = null;
                      }
                      else
                        $scope.data.activeTable = _.find($scope.data.masterObjectList, function(item) {
                            return item.qInfo.qId == qId;
                        });
                      $scope.report.visualizationType = ($scope.data.activeTable && $scope.data.activeTable.qData.visualization) || null;
                      $scope.fieldsAndSortbarVisible = true;
                      $scope.report.interColumnSortOrder = [];
                      $scope.report.qInterColumnSortOrder = [];
                      $scope.report.usedDimensionsAndMeasures = [];
                      $scope.report.currentState = null;
                      $scope.report.NoOfLeftDims = null;
                      $scope.report.layout = null;
                    //   $scope.report.limits = {
                    //       objects: {}
                    //   };
                      //$scope.report.limits.dimensions = 0;
                      //$scope.report.limits.measures = 0;
                      deferred.resolve();
                    } else {
                        // varModel.getProperties().then(function(data){
                        if($scope.report.currentState != varModel) {
//                            if(!props)
//                                $scope.closeVisualization();

                            var stored,
                                state = {};

                            try {
                             stored = JSON.parse(varModel);
                            } catch(e) {}

                            if(stored) {
                              var activeTableId = qId || stored.activeTableId;
                              $scope.fieldsAndSortbarVisible = stored.fieldsAndSortbarVisible;
                              state =  stored.states && stored.states[activeTableId];
                              if(state) {
                                $scope.report.visualizationType = state.visualizationType;
                                if(!isNaN(state.qNoOfLeftDims))
                                  $scope.report.NoOfLeftDims = state.qNoOfLeftDims;
                                $scope.report.qInterColumnSortOrder = state.qInterColumnSortOrder ? state.qInterColumnSortOrder : [];
                                $scope.report.interColumnSortOrder = state.interColumnSortOrder ? state.interColumnSortOrder : [];
                                $scope.report.layout = state.layout;
                                //$scope.report.limits.dimensions = (state.limits && state.limits.dimensions) || 0;
                                //$scope.report.limits.measures = (state.limits && state.limits.measures) || 0;
                                
                                // Set active object                                
                                $scope.data.activeTable = _.find($scope.data.masterObjectList, function(item) {
                                    return item.qInfo.qId == activeTableId && item.qData.visualization == $scope.report.visualizationType;
                                });                                
                              }
                              //$scope.report.limits.objects = (stored.limits) || {};
                              //_.extend($scope.report.limits.objects, (stored.limits) || {});
                            }
                            $scope.report.usedDimensionsAndMeasures = (state && state.usedDimensionsAndMeasures) || [];
                            $scope.setReportState(state, isLoadStateOnly, true).then(function(){
                              //if(!isRestoreSession)
                              //$scope.report.currentState = varModel;

                              if(!isLoadStateOnly || isRestoreSession)
                                $scope.createChart();
                              else if($scope.report.usedDimensionsAndMeasures.length > 0)
                                $scope.serializeReport();

                              deferred.resolve();
                            });
                        } else {
                          deferred.resolve();
                        }
                      //});
                    }
                    //});

                    return deferred.promise;

                    /*
                    var localStorageToken = JSON.parse(localStorage.getItem(localStorageId));
                    if (undefined != localStorageToken && undefined != localStorageToken.states) {
                        console.log('deserialized state:', localStorageToken);
                        state = localStorageToken.states[localStorageToken.activeTableId]
                        $scope.report.interColumnSortOrder = state.qInterColumnSortOrder ? state.qInterColumnSortOrder : [];
                        $scope.fieldsAndSortbarVisible = localStorageToken.fieldsAndSortbarVisible;
                        $scope.data.activeTable = _.find($scope.data.masterObjectList, function(item) {
                            return item.qInfo.qId == state.qId;
                        });
                        $scope.setReportState(state).then(function(){
                          $scope.createChart();
                        });
                    }
                    */
                }

                $scope.$on('$destroy', function() {
                    $scope.serializeReport();
                });

                $scope.$watchCollection('layout.props.tagSetting', function(newTag) {
                    $scope.data.tag = newTag;
                    initMasterItems();
                });

                $scope.$watchCollection('layout.props.tagColor', function(newStyle) {
                    $scope.data.tagColor = newStyle;
                });

                $scope.$watchCollection('layout.props.collapseMinWidth', function(newWidth) {
                    $scope.minWidthCollapsed = newWidth;
                });

                $scope.$watchCollection('layout.props.collapseMinHeight', function(newHeight) {
                    $scope.minHeightCollapsed = newHeight;
                });

                $scope.$watchCollection('layout.props.displayText', function(newText) {
                    $scope.data.displayText = newText;
                });

                $scope.$watchCollection('layout.props.vizualizationsLabel', function(newText) {
                    $scope.data.vizualizationsLabel = newText;
                });

                $scope.$watchCollection('layout.props.dimensionsLabel', function(newText) {
                    $scope.data.dimensionsLabel = newText;
                });

                $scope.$watchCollection('layout.props.measuresLabel', function(newText) {
                    $scope.data.measuresLabel = newText;
                });                

                $scope.$watchCollection('layout.props.dimensionSortOrder', function(newStyle) {
                    $scope.data.sortOrder = newStyle;
                    $scope.loadActiveTable();
                });

                $scope.getListMaxHeight = function(listType) {
                    var listHeight = 38;
                    var dimCount = $scope.report.dimensions.length
                    var measureCount = $scope.report.measures.length
                    var labelsAndButtons = 140;
                    var halfHeight = (($scope.size.clientHeight - labelsAndButtons) / 2)
                    var dimListUnusedSize = halfHeight < listHeight * dimCount ? 0 : halfHeight - listHeight * dimCount;
                    var measureListUnusedSize = halfHeight < listHeight * measureCount ? 0 : halfHeight - listHeight * measureCount;

                    if (dimCount > 0) {
                        if (listType == 'dimension') {
                            return {
                                "max-height": (halfHeight + measureListUnusedSize) + "px"
                            };
                        } else {
                            return {
                                "max-height": (halfHeight + dimListUnusedSize) + "px"
                            };
                        }
                    } else {
                        return {
                            "height": halfHeight + "px"
                        };
                    }
                }

                $scope.getTableHeight = function() {
                    var labelsAndButtons = 70;

                    //$('#cl-customreport-container' + $scope.customReportId + ' #reportSortable').height();

                    var reportSortableHeight = $('#cl-customreport-container' + $scope.customReportId + ' #reportSortable').height();
                    if (!$scope.fieldsAndSortbarVisible) {
                        return { "height": $scope.size.clientHeight + "px" }
                    } else {
                        return { "height": ($scope.size.clientHeight - labelsAndButtons - reportSortableHeight) + "px", "padding-top":"18px" }
                    }
                }
                $scope.getContainerWidth = function(container) {
                    var containerLeftWidth = 220;
                    var containerWidth = {};
                    if (container == 'left') {
                       containerWidth = containerLeftWidth;
                    } else {
                        if (!$scope.fieldsAndSortbarVisible) {
                            containerWidth =  $scope.size.clientWidth;
                        } else {
                            containerWidth = $scope.size.clientWidth - containerLeftWidth - 20;
                        }
                    }
                    return { "width": containerWidth + "px" }
                }

                initLibraryItems();
                initMasterItems().then(function(reply) {
                    var el = $('#cl-customreport-container' + $scope.customReportId + ' #reportSortable')[0];
                    sortable.create(el, $scope.reportConfig);
                    $scope.deserializeReport().then($scope.showLimits);

                    $('#cl-customreport-container' + $scope.customReportId + ' .rain').hide();
                     if(!$scope.fieldsAndSortbarVisible)
                       $('#cl-customreport-container' + $scope.customReportId).parents('.qv-inner-object').css('overflow', 'visible');
                });
            }]
        };
    });
