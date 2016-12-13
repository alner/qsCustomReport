define(["jquery","qlik","ng!$q","ng!$http"],function(a,b,c){"use strict";function d(a){e.global.session.rpc({handle:1,method:"DestroyVariableByName",params:{qName:a}})}var e=b.currApp(),f=function(){var a=c.defer();return e.getAppObjectList("masterobject",function(b){var c=[],d=[],e=[];return _.each(b.qAppObjectList.qItems,function(a){"table"==a.qData.visualization&&_.each(a.qMeta.tags,function(a){c.push(a)})}),d=_.uniq(c),e.push({value:"All tables",label:"All tables"}),_.each(d,function(a){e.push({value:a,label:a})}),a.resolve(e)}),a.promise},g={type:"string",component:"dropdown",label:"Select tag",translation:"library.Visualizations",ref:"props.tagSetting",defaultValue:"All tables",options:function(){return f().then(function(a){return a})}},h={type:"boolean",component:"switch",label:"Tag color",ref:"props.tagColor",options:[{value:!0,label:"Colors"},{value:!1,label:"No colors"}],defaultValue:!0},i={type:"string",component:"dropdown",label:"Dimensions and measures sort order",ref:"props.dimensionSortOrder",defaultValue:"SortByA",options:[{value:"SortByA",label:"Sort alphabetical"},{value:"SortByTableOrder",label:"Sort by table order"}]},j={type:"boolean",component:"switch",label:"Allow collapse",ref:"props.allowCollapse",options:[{value:!0,label:"Yes"},{value:!1,label:"No"}],defaultValue:!1},k={type:"number",label:"Trigger collapse min width",ref:"props.collapseMinWidth",defaultValue:200,show:function(a){return a.props.allowCollapse}},l={type:"number",label:"Trigger collapse min height",ref:"props.collapseMinHeight",defaultValue:200,show:function(a){return a.props.allowCollapse}},m={type:"string",label:"Display text",ref:"props.displayText",defaultValue:"Custom Report"},n={uses:"settings",items:{settings:{type:"items",label:"Settings",translation:"Widget.Settings",items:{tagColor:h,sortOrder:i,allowCollapse:j,collapseMinWidth:k,collapseMinHeight:l,displayText:m}}}},o={type:"items",label:"Setup",translation:"Widget.Settings",items:{tagPanel:{type:"items",label:"Tag",items:{tagList:g}},varPanel:{type:"string",label:"Variable",translation:"Common.Variable",ref:"props.variable",change:function(a,b,c,e){a.props.variableExp=a.props.variable?{qStringExpression:{qExpr:"="+a.props.variable}}:null,e.layout.props.variable&&d(e.layout.props.variable)}},varExpr:{type:"string",ref:"props.variableExp",expression:"always",expressionType:"StringExpression",show:!1}}},p={type:"items",component:"expandable-items",translation:"properties.addons",items:{dataHandling:{uses:"dataHandling"}}};return{type:"items",component:"accordion",items:{tag:o,addons:p,appearance:n}}});