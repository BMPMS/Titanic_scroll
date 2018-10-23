

var scrollVis = function () {
  // define constants (proportions copied from JV)
  var width = 600;
  var left_right_margin = 30;
  var top_bottom_margin = 60;
  var height = 520;
  var format = d3.format(".0%");
  // define scroll index tracking vars - JV
  var lastIndex = -1;
  var activeIndex = 0;
  // define scales - one set of scales for all charts.
  var x0_scale = d3.scaleBand().padding(0.1).range([0, width-(left_right_margin*2)]);
  var x1_scale = d3.scaleLinear();
  var y_scale = d3.scaleLinear().range([height - (top_bottom_margin*2),0]);
  // define colours
  //all_colours - used during 1st section when survival rates not needed variable == "both".
  var all_colours = { Men: '#1f78b4', Women: '#a6cee3',all:"grey",
  "0 - 15":"#addd8e","15 - 30":"#78c679","30 - 45":"#41ab5d","45 - 70":"#238443",">= 70":"#005a32",
  "1st Class": "#9e9ac8", "2nd Class":"#756bb1","3rd Class":"#54278f"};
  //survival colours - used during 2nd section when looking at survival rates.
  var survival_colours = {0:"#fb9a99", 1: "#404040"}
  // define functions for the current scroll setting - inherited from JV
  var activateFunctions = [];
  //define data object and svg.
  var vis_data = {};
  var svg = "";

  //initialise chart - function inherited from JV, content not.
  var chart = function (selection) {

    selection.each(function (rawData) {
      //define svg.
      svg = d3.select(this).append("svg")
                           .attr('width', width)
                           .attr('height', height);
      // perform preprocessing on raw data - comments on logic below
      vis_data = convert_data(rawData);
      single_elements(vis_data); //draw elements that are not data dependent.
      set_up_sections(vis_data);
    });

  };
  //only need to append these elements once (with this data, no.of dots doesn't change but code is set up so it could)
  var single_elements = function (my_data) {
    //x axis
    svg.append("g").attr("class", "x_axis");
    //background image
    svg.append("svg:image")
      .attr("class","ship_image")
      .attr("xlink:href", "images/ship_image.png")
      .attr("height",389)
      .attr("width", 600)
      .attr("x", 0)
      .attr("y", height-389-(top_bottom_margin/4));
  };
  //set up sections for scrolling.
  var set_up_sections = function (my_data) {
    // variables to be sent to draw_dots when the scroll index changes.
    activateFunctions[0] = ["none","both",0];  // blank
    activateFunctions[1] = ["all","both",0];   // all, survived not shown
    activateFunctions[2] = ["sex","both",2000]; // sex, survived not shown
    activateFunctions[3] = ["age","both",2000]; // age, survived not shown
    activateFunctions[4] = ["p_class","both",2000]; // class, survived not shown
    activateFunctions[5] = ["all","survived",2000]; // all, show survived
    activateFunctions[6] = ["sex","survived",2000]; // sex, show survived
    activateFunctions[7] = ["age","survived",2000]; // age, show survived
    activateFunctions[8] = ["p_class","survived",2000];// class, show survived
    activateFunctions[9] = ["ch_1_2","survived",2000]; // conclusion 1 - 1st and 2nd class children (< 15)
    activateFunctions[10] = ["w_ch_1_2","survived",2000];//conclusion 2 - 1st and 2nd class women & children

  };
  //part inherited from JV.
  //change is that I am repositioning the dots depending on the data every time the scroll index changes.
  //in JV version, all the charts are drawn initially and then shown.

  chart.update = function (index, progress) {
    var show_image = [1,5]; //only show images on scroll index 1 and 5.
    if(show_image.indexOf(index) >= 0){
      d3.select(".ship_image").attr("visibility","visible");
    } else {
      d3.select(".ship_image").attr("visibility","hidden");
    }
    activeIndex = index;
    var sign = (activeIndex - lastIndex) < 0 ? -1 : 1;
    //call draw dots with pre-defined variables
    draw_dots(activateFunctions[index][0],activateFunctions[index][1],activateFunctions[index][2]);
    lastIndex = activeIndex;
  };

  var draw_dots = function (data_class, fill_type,transition){
    //define data - empty if none (ie first scroll index).
    if(data_class == "none"){
      var my_data = [];
    } else {
      var my_data = vis_data[data_class];
    }
    //reset scale domains and x1_scale range.
    x0_scale.domain(d3.set(my_data,function(d){return d[data_class]}).values());
    x1_scale.domain([0,d3.max(my_data,function(d){return d.column})+1]).range([0, x0_scale.bandwidth()]);
    y_scale.domain([0,43]);
    //set radius
    var my_radius = 4.5;
    //data,exit,enter and merge for bar labels
    var my_group = svg.selectAll(".labels_group")
                      .data(x0_scale.domain(),function(d){return d});

    my_group.exit().remove();
    //enter new groups
    var enter = my_group.enter()
                        .append("g")
                        .attr("class","labels_group")
    //append rectangles to new group
    enter.append("text").attr("class","bar_text")
    //merge and remove
    my_group = my_group.merge(enter);
    //set for bar text attributes
    my_group.select(".bar_text")
            .attr("visibility","hidden") //hidden initially
            .attr("x",function(d){ return x0_scale(d) + (x0_scale.bandwidth()*0.45)})
            .attr("y",function(d){return y_scale(d3.max(my_data,function(m){if(m[data_class]==d){return m.row}})) - 15})
            .attr("fill",function(d){ //fill dependent on whether survival is being shown.
              if(fill_type == "both"){
                return all_colours[d]
              } else {
                return survival_colours[1] //if survival, show 'Survived' colour as text = survived %
            }})
            .text(function(d){
              //number of passengers in this group.
              var group_count = my_data.filter(function(m){if(m[data_class]==d){return m}}).length;
              if(fill_type == "both"){
                return group_count //if no survival, show no of passengers.
              } else {
                //otherwise, calculate the passengers who survived and show survival rate - format defined on line 9
                var survival_count =  my_data.filter(function(m){if(m[data_class]==d && m.survived == 1){return m}}).length;
                return format(survival_count/group_count)
              }
              })
            .attr("transform","translate(" + left_right_margin + "," + top_bottom_margin + ")")
            .transition()
            .delay(transition*1.2)
            .attr("visibility","visible") //now that the dots and text have moved, make text visible.
    //repeat data,exit,enter and merge for dots
    var my_group = svg.selectAll(".dots_group")
                      .data(my_data);

    my_group.exit().remove();
    //enter new groups
    var enter = my_group.enter()
                        .append("g")
                        .attr("class","dots_group")
    //append rectangles to new group
    enter.append("circle").attr("class","circle_dot")
    //merge and remove
    my_group = my_group.merge(enter);
    //define circle dot attributes
    my_group.select(".circle_dot")
            .transition()
            .duration(transition)
            .attr("cx",function(d){return (x0_scale(d[data_class])) + x1_scale(d.column)})
            .attr("cy",function(d){return y_scale(d.row)})
            .attr("fill",function(d){ //different fill depending on whether survived is shown (see above)
              if(fill_type == "both"){
                return all_colours[d[data_class]]
              } else {
                return survival_colours[d.survived]
            }})
            .attr("r",my_radius)
            .attr("transform","translate(" + left_right_margin + "," + top_bottom_margin + ")");

    //reset x_axis
    d3.select(".x_axis")
      .attr("transform", "translate(" + left_right_margin + "," + ((top_bottom_margin *1.2)+ y_scale.range()[0]) + ")")
      .call(d3.axisBottom(x0_scale));

  };

  // return chart function
  return chart;
};

//JV function - with some elements removed.
function display(data) {
  // create a new plot and
  // display it
  var plot = scrollVis();
  d3.select('#vis')
    .datum(data)
    .call(plot);

  // setup scroll functionality
  var scroll = scroller().container(d3.select('#graphic'));

  // pass in .step selection as the steps
  scroll(d3.selectAll('.step'));

  // setup event handling
   scroll.on('active', function (index) {
     // highlight current step text
     d3.selectAll('.step')
       .style('opacity', function (d, i) { return i === index ? 1 : 0.1; });
   });

  scroll.on('progress', function (index, progress) {
    plot.update(index, progress);
  });
}

// load data and display
d3.csv('data/titanic_data.csv', display);

//data functions.  returns 6 different datasets, all with 891 entries (passenger count)
//data is split into sections - ie ["male","female"], given a per_row count - ie two_per_row
//and for each sections, a dot position (row, column) is generated for each entry
//with a maximum of per_row_count in each row.

//all has only one section
//sex, age and p_class are linked to the data variables
//ch_1_2 and w_ch_1_2 are custom sections linked to my conclusions (ie children under 15 in 1st and 2nd Class v remaining passengers)


function convert_data(my_data){

  var all_per_row = 45;
  var two_per_row = 20;
  var three_per_row = 14;
  var five_per_row = 10;

  var all = get_positions(my_data,all_per_row,[]);
  var sex = get_positions(my_data,two_per_row,["male","female"],"Sex");
  var age = get_positions(my_data,five_per_row,[0,15,30,45,70],"Age");
  var p_class = get_positions(my_data,three_per_row,[1,2,3],"Pclass");
  var ch_1_2 = age_class(my_data,two_per_row);
  var w_ch_1_2 = women_children_class(my_data,two_per_row);

  return {all: all, sex: sex,age: age,p_class:p_class,ch_1_2:ch_1_2,w_ch_1_2:w_ch_1_2};

  function women_children_class(my_data,col_per_row){

    var positions = [];
    var filtered_data = my_data.filter(function(d){
      return (d.Age < 15 && d.Pclass < 3) || (d.Sex == "female" && d.Age >= 15 && d.Pclass < 3)
    })

    positions = positions.concat(populate(filtered_data,"1st or 2nd Class women and children","",col_per_row));
    var filtered_data = my_data.filter(function(d){
      return (d.Age < 15 && d.Pclass == 3) || (d.Sex == "female" && d.Age >= 15 && d.Pclass == 3) || (d.Sex == "male" && d.Age >= 15)
    })
    positions = positions.concat(populate(filtered_data,"Remaining Passengers","",col_per_row))
    return positions;
  }

  function age_class(my_data,col_per_row){
    var positions = [];
    var filtered_data = my_data.filter(function(d){
      return (d.Age < 15 && d.Pclass < 3)
    })
    positions = positions.concat(populate(filtered_data,"1st or 2nd Class children","",col_per_row));
    var filtered_data = my_data.filter(function(d){
      return (d.Age < 15 && d.Pclass == 3) || (d.Age >= 15)
    })
    positions = positions.concat(populate(filtered_data,"Remaining Passengers","",col_per_row))
    return positions;
  }

  function get_positions(my_data,col_per_row,variables,field){

    var p_class_labels = {1:"1st Class",2: "2nd Class",3:"3rd Class"};
    var positions = [], band = "",p_class="";
    if (variables.length == 0){
      positions = populate(my_data,"","",col_per_row);
    } else {
      for(v in variables){
        var filtered_data = my_data.filter(function(d){
          if(field !== "Age"){
             if(field == "Pclass"){
               p_class = p_class_labels[variables[v]]
             }
             return d[field] == variables[v];
          } else {
            if(+v == (variables.length-1)){
              band = ">= " + variables[v];
              return d[field] >= variables[v];
            } else {
              band = variables[v] + " - " + variables[+v+1];
              return (d[field] >= variables[v] && d[field] < variables[+v+1]);
            };
          }
          });
        positions = positions.concat(populate(filtered_data,band,p_class,col_per_row))
      }
    }
    return positions;

  }

  function populate(my_data,band,p_class,col_per_row){

    my_data = my_data.sort(function(a,b){return d3.descending(a.Survived, b.Survived)});
    var my_row = 0, my_column = 0;
    var sex_labels = {"male": "Men","female": "Women"}
    var current_positions = [];
    for(d in my_data){
      if(isNaN(d) == false){
        if(my_column == col_per_row){
          my_column = 0;
          my_row += 1;
        }
        current_positions.push ({
          id: my_data[d].PassengerId,
          row: my_row,
          column: my_column,
          survived: my_data[d].Survived,
          age: band,
          sex: sex_labels[my_data[d].Sex],
          all: "all",
          p_class: p_class,
          total: my_data.length,
          ch_1_2: band,
          w_ch_1_2: band
        });
        my_column += 1
      }
    }
    return current_positions;

  }

}
