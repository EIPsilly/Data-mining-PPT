const svg = d3.select("#Paint");
var gMap = svg.append('g').attr('id', 'myCanvas');
var points,pointsPosition = [];
var height = $("#Paint").height()
var width = $("#Paint").width()
var xScale = d3.scaleLinear();
var yScale = d3.scaleLinear();
var unitLength;
var flag = true;
var Demo;
var flow_control = 0;
var seedlist = [];

$(document).ready(function () {
    // 获取点，绘制点
    $.ajax({
        url: "/GetPoints",
        type: "GET",
        dataType: "json",
        success: function (res) {
            points = res;
            $("#PointsTable").html("")
            let PaintPoints = gMap.append("g");
            let PointText = gMap.append("g");
            let minX = 2147483647, maxX = -1, minY = 2147483647, maxY = -1
            for (let index in res) {
                item = res[index];
                str = "<tr>\
                    <td>" + index + "</td>\
                    <td>" + item["x"] + "</td>\
                    <td>" + item["y"] + "</td>\
                    <td>" + item["cd"].toFixed(2) + "</td>\
                    <td>" + item["rd"].toFixed(2) + "</td>\
                    <td>" + item["vi"] + "</td>\
                    <td>" + item["N"] + "</td>\
                </tr>"
                $("#PointsTable").append(str);
                minX = Math.min(minX, item["x"]);
                maxX = Math.max(maxX, item["x"]);
                minY = Math.min(minY, item["y"]);
                maxY = Math.max(maxY, item["x"]);
            }
            let minV = Math.min(minX,minY),maxV = Math.max(maxX,maxY);
            xScale.domain([minV, maxV]).range([30, width - 30]);
            yScale.domain([minV, maxV]).range([30, height - 30]);
            unitLength = Math.abs(
                xScale(1) - xScale(0) !== 0 ? xScale(1) - xScale(0) : yScale(1) - yScale(0)
            );
            if (xScale(1) - xScale(0) < yScale(1) - yScale(0)) yScale = xScale
            else xScale = yScale
            for (let index in points) {
                let item = points[index];
                pointsPosition.push({
                    "sx":xScale(item["x"]),
                    "sy":yScale(item["y"])
                })
                PaintPoints.append("circle")
                    .attr('id', 'point' + index)
                    .attr('cx', pointsPosition[index]["sx"])
                    .attr('cy', pointsPosition[index]["sy"])
                    .attr('r', 5)
                    .attr('fill', 'black');
                PointText.append('text')
                    .attr('id', 'pointLabel' + index)
                    .text(index)
                    .attr('x', pointsPosition[index]["sx"])
                    .attr('y', pointsPosition[index]["sy"])
                    .attr('font-size', 18)
                    .attr('transform', 'translate(-5,-10)')
            }
        }
    });
    GetDemo();
    setTimeout(() => {
        DrawE();
        ControlECircle();
    }, 100);
})

// 获取Demo
function GetDemo() {
    $.ajax({
        url: "/GetDemo",
        type: "GET",
        dataType: "json",
        success: function (res) {
            ModifyDemo(res)
        }
    })
}

function ModifySeedlist(res) {
    seedlist = res
    let str_seedlist = "";
    for (let index in seedlist){
        if (index == 0) str_seedlist += seedlist[index]
        else str_seedlist += " , " + seedlist[index]
    }
    $("#seedlist").text(str_seedlist);
}

// 修改显示的Demo
function ModifyDemo(res) {
    Demo = res;
    $("#e").text(res["e"]);
    $("#MinPts").text(res["MinPts"]);
    $("#num").text(res["num"]);
    $("#pi").text(res["pi"]);

//     let str_distance = '<caption>distance</caption><thead><tr>';
//     distance = res["distance"];
//     str_distance += '<th> </th>';

//     for (let i in distance) {
//         str_distance += '<th>' + i + '</th>'
//     }
//     str_distance += '</tr></thead>';
//     str_distance += '<tbody>';

//     for (let i in distance) {
//         str_distance += '<tr>'
//         str_distance += '<td>' + i + '</td>'
//         for (let j in distance[i]) {
//             str_distance += '<td>' + distance[i][j].toFixed(2) + '</td>'
//         }
//         str_distance += '</tr>'
//     }

//     str_distance += '</tbody>';
//     $("#distance").html(str_distance)
}

// 画邻域
function DrawE() {
    let e = $("#e").text();
    let r = e * unitLength;
    let PaintE = gMap.append("g");

    for (let index in points) {
        PaintE.append("circle")
            .attr('id', 'pointE' + index)
            .attr('class', "Ecircle")
            .attr('cx', pointsPosition[index]["sx"])
            .attr('cy', pointsPosition[index]["sy"])
            .attr('r', r)
            .attr("fill", "red")
            .attr("opacity", 0.1)
    }
}

// 是否展示邻域
function ControlECircle() {
    $(".Ecircle").toggle();
}

// 修改点的属性
function ModifyPoints(res) {
    points = res;
    $("#PointsTable").html("")
    for (let index in res) {
        item = res[index];
        str = "<tr>\
            <td>" + index + "</td>\
            <td>" + item["x"] + "</td>\
            <td>" + item["y"] + "</td>\
            <td>" + item["cd"].toFixed(2) + "</td>\
            <td>" + item["rd"].toFixed(2) + "</td>\
            <td>" + item["vi"] + "</td>\
            <td>" + item["N"] + "</td>\
        </tr>"
        $("#PointsTable").append(str);
    }
}

// 显示邻域内的点
function AddToNeighborhood() {
    if (flow_control == 0) {
        $.ajax({
            url: "/AddToNeighborhood",
            type: "GET",
            dataType: "json",
            success: function (res) {
                ModifyDemo(res);
                ModifyPoints(res["points"]);
            }
        })
        flow_control = 1;
    }
}

// 计算核心距离
function CalcCoreDistance(){
    if (flow_control == 1) {
        $.ajax({
            url: "/CalcCoreDistance",
            type: "GET",
            dataType: "json",
            success: function (res) {
                ModifyDemo(res);
                ModifyPoints(res["points"]);
            }
        })
        flow_control = 2;
    }
}

var ptNode;
var ptNode_N;

function GetNextNode() {
    if (($("#neighborhood").text() == "finish") || (flow_control <= 1) || ((typeof(ptNode_N) != "undefined") && (ptNode_N != points[ptNode].N.length))){
        return
    }
    if (seedlist.length == 0){
        $.ajax({
            url:"/GetStartNode",
            type:"GET",
            dataType:"json",
            success:function (res) {
                console.log(res);
                if (typeof(res["message"]) != "undefined"){
                    $("#neighborhood").text("finish");
                    return
                }
                ModifyDemo(res["Demo"]);
                ModifyPoints(res["Demo"]["points"]);
                ptNode = res["index"];
                ptNode_N = 0;
                d3.select("#point" + ptNode)
                .attr("fill","blue");

                d3.select("#pointLabel" + ptNode)
                .attr("fill","blue");
                
                $("#neighborhood_id").text(ptNode);
                $("#neighborhoods").text(points[ptNode].N);
            }
        })
    }
    else if (seedlist.length > 0){
        $.ajax({
            url:"/GetNodeFromSeedlist",
            type:"GET",
            dataType:"json",
            success:function (res) {
                console.log(res);
                ModifyDemo(res["Demo"]);
                ModifyPoints(res["Demo"]["points"]);
                ModifySeedlist(res["seedlist"]);
                ptNode = res["index"];
                ptNode_N = 0;
                d3.select("#point" + ptNode)
                .attr("fill","blue");

                d3.select("#pointLabel" + ptNode)
                .attr("fill","blue");

                $("#neighborhood_id").text(ptNode);
                $("#neighborhoods").text(points[ptNode].N);
            }
        })
    }
}

function insertlist() {
    if ((flow_control <= 1) || (typeof(ptNode_N) == "undefined") || (ptNode_N == points[ptNode].N.length)){
        return
    }
    let P_Start = ptNode
    let P_End = points[ptNode].N[ptNode_N];

    

    $.ajax({
        url:"/insertlist",
        data:{
            "core_node":ptNode,
            "neighborhood":points[ptNode].N[ptNode_N]
        },
        type:"GET",
        dataType:"json",
        success:function (res) {
            console.log(res);
            console.log(res["message"]);
            console.log(typeof(res["message"]));
            if (typeof(res["message"]) == "undefined"){
                ModifyDemo(res["Demo"]);
                ModifyPoints(res["Demo"]["points"]);
                ModifySeedlist(res["seedlist"]);
            }
            ptNode_N += 1;
            $("#neighborhoods").text("");
            let str_neighborhood =  ""
            for (let index = ptNode_N;index <points[ptNode].N.length;index++){
                if (index == ptNode_N) str_neighborhood += points[ptNode].N[index];
                else str_neighborhood += " , " + points[ptNode].N[index];
            }
            $("#neighborhoods").text(str_neighborhood);
        }
    })   
}