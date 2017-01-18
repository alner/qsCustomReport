define( [
    'jquery',
    'qlik',
    'ng!$q',
    'ng!$http',
    'underscore'
  ], function ($, qlik, $q, $http, _) {
  'use strict';

  var app = qlik.currApp();

  function deleteVariable(variableName) {
    app.global.session.rpc({
      "handle": 1,
      "method": "DestroyVariableByName",
      "params": {
        "qName": variableName
      }
    });
  }


  // ****************************************************************************************
  // Other Settings
  // ****************************************************************************************
  /*
  var tagSetting = {
    ref: "props.tagSetting",
    label: "Tag",
    type: "string",
    show: true
  };

  */

  //Create a function that returns a list of unique tags applied to master objects
  var getTagList = function (){
    var defer = $q.defer();

    app.getAppObjectList( 'masterobject', function ( data ) {
      var tags = [];
      var uniqTags = [];
      var exportTags = [];

      _.each( data.qAppObjectList.qItems, function ( item ) {
        if (item.qData.visualization == 'table' ) {
          _.each( item.qMeta.tags, function ( tag ) {
            tags.push(tag);
          });
        }
      } );
      uniqTags = _.uniq(tags);

      exportTags.push({
          value: 'All tables',
          label: 'All tables'
      });

      _.each(uniqTags, function ( tag ) {
        exportTags.push({
          value: tag,
          label: tag
        });
      });

      return defer.resolve( exportTags );
    } );

    return defer.promise;
  };


  // create tag list
  var tagList = {
    type: "string",
    component: "dropdown",
    label: "Select tag",
    translation: "library.Visualizations",
    ref: "props.tagSetting",
    defaultValue: 'All tables',
    options: function () {
      return getTagList().then( function ( items ) {
        return items;
      } );
    }
  };

  var tagColor = {
    type: "boolean",
    component: "switch",
    label: "Tag color",
    ref: "props.tagColor",
    options: [{
      value: true,
      label: "Colors"
    }, {
      value: false,
      label: "No colors"
    }],
    defaultValue: true
  }

  var sortOrder = {

              type : "string",
              component : "dropdown",
              label : "Dimensions and measures sort order",
              ref : "props.dimensionSortOrder",
              defaultValue: "SortByA",
              options : [{
                value : "SortByA",
                label : "Sort alphabetical"
              }, {
                value : "SortByTableOrder",
                label : "Sort by table order"
              }]

  }


  var allowCollapse = {
    type: "boolean",
    component: "switch",
    label: "Allow collapse",
    ref: "props.allowCollapse",
    options: [{
      value: true,
      label: "Yes"
    }, {
      value: false,
      label: "No"
    }],
    defaultValue: false
  }



  var collapseMinWidth = {
    type: "number",
    label: "Trigger collapse min width",
    ref: "props.collapseMinWidth",
    defaultValue: 200,
    show: function (data) {
      return data.props.allowCollapse;
    }
  };

  var collapseMinHeight = {
    type: "number",
    label: "Trigger collapse min height",
    ref: "props.collapseMinHeight",
    defaultValue: 200,
    show: function (data) {
      return data.props.allowCollapse;
    }
  }

  var displayText = {

    type: "string",
    label: "Display text",
    ref: "props.displayText",
    defaultValue: "Custom Report"

  }

  // ****************************************************************************************
  // Property Panel Definition
  // ****************************************************************************************
  // Appearance Panel
  var appearancePanel = {
    uses: "settings",
    items: {
      settings: {
        type: "items",
        label: "Settings",
        translation: "Widget.Settings",
        items: {
          //tagSetting: tagSetting,
          tagColor: tagColor,
          sortOrder: sortOrder,
          allowCollapse: allowCollapse,
          collapseMinWidth: collapseMinWidth,
          collapseMinHeight: collapseMinHeight,
          displayText: displayText
        }
      }
    }
  };
  
  // Constraints
  var Constraints = {
    type: "array",
    ref: "props.constraints",
    label: "Constraints",
    translation: "properties.dimensionLimits.limitation",
    itemTitleRef: function(data, index, handler){
      var objectItem = _.find(configScope.masterObjectList, function(item) {
          return item.qInfo.qId === data.object;
      });

      return (objectItem && objectItem.qMeta.title) || data.object;
    },
    allowAdd: true,
    allowRemove: true,
    addTranslation: "Common.Create",
    items: {
      objectConstraints: {
        ref: "object",
        label: "Object",
        translation: "Common.CustomObjects",
        type: "string",
        component: "dropdown",
        options: function(propertyData) {
          return configScope.masterObjectList.map(function(item){
            return {
              value: item.qInfo.qId,
              label: item.qMeta.title
            }
          })
        },
        defaultValue: function(){
          return (configScope.activeTable && configScope.activeTable.qInfo.qId) || '';
        }
      },
      dimensionsLimit: {
        type: "integer",
        label: "Dimensions",
        translation: "Common.Dimensions",
        ref: "dimension",
        defaultValue: 1,
      },
      measuresLimit: {
        type: "integer",
        label: "Measures",
        translation: "Common.Measures",
        ref: "measure",
        defaultValue: 1        
      }
    }
  };


  // Tag Panel
  var tagPanel = {
    type: "items",
    label: "Setup",
    translation: "Widget.Settings",
    items: {
      tagPanel: {
        type: "items",
        label: "Tag",
        items: {
          tagList: tagList
        }
      },

      varPanel: {
        type: "string",
        label: "Variable",
        translation : "Common.Variable",
        ref: "props.variable",
        //component: "expression",
        // component: {
        //   controller: ["$scope", function($scope){
        //     console.log('$scope', $scope);
        //   }]
        // },
        change: function(a, b, c, d){
          if(!a.props.variable)
            a.props.variableExp = null;
          else
            a.props.variableExp = {
              qStringExpression : {
                qExpr : "=" + a.props.variable
              }
            };

          // destroy an old variable:
          if(d.layout.props.variable)
            deleteVariable(d.layout.props.variable);
        }
      },
      varExpr: { // special hidden expressin for props.variable
        type: "string",
        ref: "props.variableExp",
        expression: "always",
        expressionType : "StringExpression",
        show: false
      },
      constraints: {
        type: "items",
        component: "expandable-items",
        items: {
          constraints: Constraints
        }        
      }
    }
  };

  var addons = {
    type: "items",
    component: "expandable-items",
    translation: "properties.addons",
    items: {
      dataHandling: {
        uses: "dataHandling"
      }
    }
  }

  var configScope;
  function getProperties(scope) {
    configScope = scope; 
    return {
      type: "items",
      component: "accordion",
      items: {
        tag: tagPanel,
        //dimensions: dimensions,
        //measures: measures,
        //sorting: sorting,
        addons: addons,
        appearance: appearancePanel
      }
    }
  }

  // Return values
  return getProperties;

} );
