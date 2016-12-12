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
            snapshot: {
                canTakeSnapshot: false
            },

            resize: function($element, layout) {

                this.$scope.size.clientHeight = $element.context.clientHeight;
                this.$scope.size.clientWidth = $element.context.clientWidth;

                this.$scope.handleResize($element,layout.props.allowCollapse);

            },

            paint: function($element, layout) {
                this.$scope.size.clientHeight = $element.context.clientHeight;
                this.$scope.size.clientWidth = $element.context.clientWidth;

                this.$scope.handleResize($element,layout.props.allowCollapse);
                if(this.$scope.isInitialized()) {
                  //if(!this.$scope.isChangedTable) {
                    //this.$scope.closeVisualization();
                    this.$scope.deserializeReport(); // {isProhibitVariableChange: true}
                  //}
                 //else
                   //this.$scope.isChangedTable = false; // reset flag
                }
            },

            getExportRawDataOptions: function(a, c, e) {
                c.getVisualization().then(function(visualization) {
                    if (!$('#cl-customreport-container').scope().collapsed) {
                        if ($('#cl-customreport-container').scope().fieldsAndSortbarVisible) {
                            a.addItem({
                                translation: "AppOverview.Expand", //"Hide fields/sortbar",
                                tid: "Expand",
                                icon: "icon-maximize",
                                select: function() {
                                    //console.log($('#cl-customreport-container').scope());
                                    $('#cl-customreport-container').parents('.qv-inner-object').css('overflow', 'visible');
                                    $('#cl-customreport-container').scope().hideFieldAndSortbar();
                                }
                            });

                        } else {
                            a.addItem({
                                translation: "AppOverview.Collapse",//"Show fields/sortbar",
                                tid: "Collapse",
                                icon: "icon-minimize",
                                select: function() {
                                    //console.log($('#cl-customreport-container').scope());
                                    $('#cl-customreport-container').parents('.qv-inner-object').css('overflow', 'hidden');
                                    $('#cl-customreport-container').scope().showFieldAndSortbar();
                                }
                            });
                        }
                    }
                    var count = _.countBy($('#cl-customreport-container').scope().report.usedDimensionsAndMeasures, 'type');

                    var unselectedDimensionCount = count.dimension ? $('#cl-customreport-container').scope().report.dimensions.length - count.dimension
                                                                   : $('#cl-customreport-container').scope().report.dimensions.length;
                    var unselectedMeasuresCount = count.measure ? $('#cl-customreport-container').scope().report.measures.length - count.measure
                                                                   : $('#cl-customreport-container').scope().report.measures.length;
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

                             _.each($('#cl-customreport-container').scope().report.dimensions, function(item){
                                //console.log(item);
                                if (!item.selected) {
                                    submenuAddDimension.addItem({
                                        translation: item.title,
                                        tid: "dimension",
                                        select: function() {
                                            $('#cl-customreport-container').scope().selectItem(item);
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

                             _.each($('#cl-customreport-container').scope().report.measures, function(item){
                                //console.log(item);
                                if (!item.selected) {
                                    submenuAddMeasure.addItem({
                                        translation: item.title,
                                        tid: "switch",
                                        select: function() {
                                            $('#cl-customreport-container').scope().selectItem(item);
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

                             _.each($('#cl-customreport-container').scope().report.dimensions, function(item){
                                //console.log(item);
                                if (item.selected) {
                                    submenuRemoveDimension.addItem({
                                        translation: item.title,
                                        tid: "dimension",
                                        select: function() {
                                            $('#cl-customreport-container').scope().removeItem(item);
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

                             _.each($('#cl-customreport-container').scope().report.measures, function(item){
                                //console.log(item);
                                if (item.selected) {
                                    submenuRemoveMeasure.addItem({
                                        translation: item.title,
                                        tid: "switch",
                                        select: function() {
                                            $('#cl-customreport-container').scope().removeItem(item);
                                        }
                                    });
                                }
                             });
                         }

                     }

                    var masterObjectList = $('#cl-customreport-container').scope().data.masterObjectList;
                    if(masterObjectList.length > 1) {
                      var submenuSwitchTable = a.addItem({
                              translation: "library.Visualizations", //"Switch table",
                              tid: "switch-submenu",
                              icon: "icon-cogwheel"
                      });
                       _.each($('#cl-customreport-container').scope().data.masterObjectList, function(item){
                          //console.log(item);
                          if (item.qInfo.qId !=  $('#cl-customreport-container').scope().data.activeTable.qInfo.qId) {
                              submenuSwitchTable.addItem({
                                  translation: item.qMeta.title,
                                  tid: "switch",
                                  icon: "icon-table",
                                  select: function() {
                                      $('#cl-customreport-container').scope().data.activeTable = item;
                                      $('#cl-customreport-container').scope().changeTable();
                                  }
                              });
                          }
                       });
                    }
                   
                    var visualScope = $('#cl-customreport-container').scope().report.visualScope;
                    //var currentObject; // to store original object from scope
                    if(visualScope && visualScope.object && visualScope.object.canShowExploreMenu())
                    a.addItem({
                        translation: visualScope.object.showExploreMenu ? "contextMenu.closeVisualExploration" : "contextMenu.openVisualExploration",
                        tid: "nav-menu-explore",
                        icon: "icon-control",
                        select: function() {                            
                            var visualScope = $('#cl-customreport-container').scope().report.visualScope;
                            var visualObject = visualScope && visualScope.object;
                            if(!visualObject) return;
                            
                            if(visualObject.showExploreMenu) {
                                // Close exploration menu
                                visualObject.toggleExploreMenu();
                                visualObject.resize();
                            } else {
                                // Open exploration menu                                
                                // TODO ? store original object currentObject = $('#cl-customreport-container').scope().object
                                // and restore on ... ?
                                 
                                // isZoomed should be set to be able to show Exploration menu
                                visualScope.options.zoomEnabled = true;
                                visualScope.options.isZoomed = true;
                                if(visualObject) {
                                    //currentObject = $('#cl-customreport-container').scope().object; // store original object 
                                    $('#cl-customreport-container').scope().object = visualObject;
                                    visualObject.toggleExploreMenu(true);
                                    //$('#cl-customreport-container').scope().object.toggleExploreMenu(true);                                                            
                                    //$('#cl-customreport-container').scope().object.ext.mappedSoftDefinition = object.ext.mappedSoftDefinition;
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
                            $('#cl-customreport-container').scope().exportData('exportToExcel');
                        }
                    }), void e.resolve();
                });
            },



            template: ngTemplate,

            controller: ['$scope', function($scope) {

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
                    masterObjectList: [],
                    masterDimensions: null,
                    masterMeasures: null
                };

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
                    currentState: null
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

                    if ($element.context.clientHeight < $scope.minHeightCollapsed || $element.context.clientWidth < $scope.minWidthCollapsed) {
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

                    app.getAppObjectList('masterobject', function(reply) {
                        $scope.data.masterObjectList = _.reduce(reply.qAppObjectList.qItems, function(acc, obj) {
                            //if (obj.qData.visualization == 'table') {
                                if ($scope.data.tag == 'All tables') {
                                    acc.push(obj);
                                } else {
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
                    return _.map(qDimensions, function(dimension) {
                            //dataId = dataId + 1;
                                                        
                            if (dimension.qLibraryId) {
                                var libraryItem = _.find($scope.data.masterDimensions.qItems, function(item) {
                                    return item.qInfo.qId == dimension.qLibraryId;
                                });
                                var libraryDimension = dimension;
                                libraryDimension.qType = 'dimension';
                                
                                return {
                                    title: libraryItem.qMeta.title,
                                    description: libraryItem.qMeta.description,
                                    columnOptions: libraryDimension,
                                    type: 'dimension',
                                    selected: isSelected ? true : false,
                                    dataId: dimension.qLibraryId
                                };
                            } else {
                                return {
                                    title: dimension.qDef.qFieldLabels[0] == '' ? dimension.qDef.qFieldDefs[0] : dimension.qDef.qFieldLabels[0],
                                    description: '',
                                    columnOptions: dimension,
                                    type: 'dimension',
                                    selected: isSelected ? true : false,
                                    dataId: dimension.qDef.cId
                                };
                            }
                    });
                    
                    //return dataId;
                }
                
                $scope.getMeasuresProps = function(qMeasures, isSelected){
                    // var dataId = defaultDataId;
                    return _.map(qMeasures, function(measure) {
                        // dataId = dataId + 1;

                        if (measure.qLibraryId) {
                            var libraryItem = _.find($scope.data.masterMeasures.qItems, function(item) {
                                return item.qInfo.qId == measure.qLibraryId;
                            });

                            var libraryMeasure = measure;
                            libraryMeasure.qType = 'measure';

                            return {
                                title: libraryItem.qMeta.title,
                                description: libraryItem.qMeta.description,
                                columnOptions: libraryMeasure,
                                type: 'measure',
                                selected: isSelected ? true : false,
                                dataId: measure.qLibraryId
                            };
                            
                        } else {
                            return {
                                title: measure.qDef.qLabel ? measure.qDef.qLabel : measure.qDef.qDef,
                                description: '',
                                columnOptions: measure,
                                type: 'measure',
                                selected: isSelected ? true : false,
                                dataId: measure.qDef.cId
                            };
                        }
                    });
                    
                    // return dataId;
                }

                $scope.loadActiveTable = function() {

                    var deferred = $q.defer();

                    // used dimensions and measures for 
                    //$scope.report.usedDimensionsAndMeasures = [];
                    //$scope.createChart();
                    if( $scope.data.activeTable !== null) {
                        setTimeout(function() {
                          if($scope.data.activeTable)
                            app.getObjectProperties($scope.data.activeTable.qInfo.qId).then(function(model) {
                                $scope.report.title = model.properties.title;
                                $scope.report.visualizationType = model.properties.visualization;
                                
                                //var dataId = -1;
                                
                                // Dimensions                                
                                var dimensions = []; // result dimensions array
                                dimensions = dimensions.concat($scope.getDimensionsProps(
                                    model._properties.qHyperCubeDef.qDimensions
                                ));
                                
                                // "Alternate" dimensions
                                dimensions = dimensions.concat($scope.getDimensionsProps(
                                    model._properties.qHyperCubeDef.qLayoutExclude.qHyperCubeDef.qDimensions
                                ));

                                // Measures
                                var measures = [];
                                measures = measures.concat($scope.getMeasuresProps(
                                    model._properties.qHyperCubeDef.qMeasures 
                                ));
                                                                
                                // "Alternate" measures
                                measures = measures.concat($scope.getMeasuresProps(
                                    model._properties.qHyperCubeDef.qLayoutExclude.qHyperCubeDef.qMeasures
                                ));
                                
                                $scope.report.dimensions = $scope.data.sortOrder == 'SortByA' ? _.sortBy(dimensions, function(item) {
                                    return item.title;
                                }) : dimensions;                                
                                
                                $scope.report.measures = $scope.data.sortOrder == 'SortByA' ? _.sortBy(measures, function(item) {
                                    return item.title;
                                }) : measures;
                                deferred.resolve(true);
                            });
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
                            });                            
                        });
                  }
                  //$scope.prepareTable();
                  //$scope.deserializeReport({isLoadStateOnly: false, qId: $scope.data.activeTable.qInfo.qId});
                }

                $scope.visualizationChanged = function() {
                  var model = $scope.report.visual && $scope.report.visual.model;
                  if(!model)
                    return;
                    
                  // check if something changed using exploration menu
                  var visualScope = $scope.report.visualScope;
                  if(visualScope && visualScope.object && visualScope.object.showExploreMenu) {                      
                        // layout changed
                        var propsWhiteList = _.filter(_.keys(model.layout), function(item){
                            return !item.match(/^q/); // exclude all props started with "q" (whose are process by engine)
                        });
                        // store layout without q-properties
                        $scope.report.layout = _.pick(model.layout, propsWhiteList);
                      
                       // Change dimension and measures order
                       var usedDimensionsAndMeasures = [];
                       usedDimensionsAndMeasures = usedDimensionsAndMeasures.concat($scope.getDimensionsProps(
	                       model.effectiveProperties.qHyperCubeDef.qDimensions,
                           true // all dimensions selected
                       ));
                       
                       usedDimensionsAndMeasures = usedDimensionsAndMeasures.concat($scope.getMeasuresProps(
	                       model.effectiveProperties.qHyperCubeDef.qMeasures,
                           true // all measures selected
                       ));
                       
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
                        $scope.report.usedDimensionsAndMeasures = usedDimensionsAndMeasures;
                  }
                                                                         
                  if($scope.report.visualizationType === 'pivot-table') {
                        // tracking qNoOfLeftDims and qInterColumnSortOrder as for now only
                        $scope.report.NoOfLeftDims = model.layout.qHyperCube.qNoOfLeftDims;
                        $scope.report.qInterColumnSortOrder = [];
                        _.each(model.layout.qHyperCube.qEffectiveInterColumnSortOrder, function(item) {
                            $scope.report.qInterColumnSortOrder.push(item);
                        });
                  }
                  
                  $scope.serializeReport();
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
                        
                        app.visualization.create($scope.report.visualizationType, null, options).then(function(visual) {
                            //$scope.report.tableID = visual.id;
                            var id = $scope.fieldsAndSortbarVisible ? 'customreporttable' : 'customreporttablezoomed';
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

                $scope.prepareTable = function() {
                    var deferred = $q.defer();
                    $(".rain").show();
                    $scope.loadActiveTable().then(function() {
                        //$scope.loadState(true)
                        $scope.deserializeReport({isLoadStateOnly: true}).then(function(){
                          $(".rain").hide();
                          deferred.resolve(true);
                        });
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

                $scope.setReportState = function(state, isSetStateOnly) {
                    var deferred = $q.defer();
                    var promise = isSetStateOnly ? $q.resolve() : $scope.prepareTable();
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
                    } else {
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
                    $scope.createChart();

                }

                $scope.removeItem = function(item) {
                    $scope.report.usedDimensionsAndMeasures = _.without($scope.report.usedDimensionsAndMeasures, item);

                    if (item.type == 'measure') {
                        var idx = $scope.report.measures.map(function(x) {
                            return x.dataId;
                        }).indexOf(item.dataId);
                        $scope.report.measures[idx].selected = false;
                    } else {
                        var idx = $scope.report.dimensions.map(function(x) {
                            return x.dataId;
                        }).indexOf(item.dataId);
                        $scope.report.dimensions[idx].selected = false;
                    }
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
                    qNoOfLeftDims: $scope.report.NoOfLeftDims
                  };

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

                            var variableName = $scope.layout.props.variable;
                            if(variableName)
                                app.variable.getByName(variableName).then(function(varModel){
                                    if(varModel) {
                                        varModel.setProperties({qName: variableName, qDefinition: dataToStore, qIncludeInBookmark: true});
                                    } else {
                                        app.variable.create({qName: variableName, qDefinition: dataToStore, qIncludeInBookmark: true});
                                    }
                                });
                        }
                        //}
                    });
                }

                $scope.deserializeReport = function(props) {
                    // var state = {};
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
                      deferred.resolve();
                    } else {
                        // varModel.getProperties().then(function(data){
                        if($scope.report.currentState != varModel) {

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
                                
                                // Set active object                                
                                $scope.data.activeTable = _.find($scope.data.masterObjectList, function(item) {
                                    return item.qInfo.qId == activeTableId && item.qData.visualization == $scope.report.visualizationType;
                                });                                
                              }
                            }
                            $scope.report.usedDimensionsAndMeasures = (state && state.usedDimensionsAndMeasures) || [];
                            $scope.setReportState(state, isLoadStateOnly).then(function(){
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

                    $('#reportSortable').height();

                    var reportSortableHeight = $('#reportSortable').height();
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
                    var el = document.getElementById('reportSortable');
                    sortable.create(el, $scope.reportConfig);

                    $scope.deserializeReport();

                    $(".rain").hide();
                     if(!$scope.fieldsAndSortbarVisible)
                       $('#cl-customreport-container').parents('.qv-inner-object').css('overflow', 'visible');
                });
            }]
        };
    });
