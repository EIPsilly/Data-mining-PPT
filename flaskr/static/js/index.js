var height = $("#Paint").height()
var width = $("#Paint").width()

const svg = d3.select("#Paint");
var gMap = svg.append('g').attr('id', 'myCanvas');
var PaintE = gMap.append("g");  //绘制邻域
var Lines = gMap.append("g");   //绘制两点之间的连线
var PaintPoints = gMap.append("g"); //绘制点
var PointText = gMap.append("g");   //绘制点的编号
var LinesLength = gMap.append("g");   //两点之间的连线的距离

//记录点的属性
var points;
// 记录点在图上的位置
var pointsPosition = [];

// 将原来的左边按照画布的大小进行缩放
var xScale = d3.scaleLinear();
var yScale = d3.scaleLinear();

// 原数值的1单位对应图上的多少长度
var unitLength;
// Demo
var Demo;
// 控制按钮点击事件是否相应。要求按照 邻域内的点->计算核心距离->(选择下一个点<->添加点到seedlist的顺序点击)
var flow_control = 0;
// 记录seedlist中点的编号
var seedlist = [];

var tmp;
$(document).ready(function () {
    // 获取点，绘制点
    $.ajax({
        url: "/GetPoints",
        type: "GET",
        dataType: "json",
        success: function (res) {
            points = res;
            $("#PointsTable").html("")
            
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
            // 按照正方形进行缩放
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
                // 画点
                PaintPoints.append("circle")
                    .attr('id', 'point' + index)
                    .on('mouseover', function () {
                        let id = this.id.substr(5);
                        console.log(id);
                        d3.select("#pointE"+id)
                        .attr("fill","#0f1423")
                        .attr("opacity","0.3");
                    })
                    .on('mouseout', function () {
                        let id = this.id.substr(5);
                        console.log(id);
                        d3.select("#pointE"+id)
                        .attr("fill","red")
                        .attr("opacity","0.1");
                      })
                    .attr('cx', pointsPosition[index]["sx"])
                    .attr('cy', pointsPosition[index]["sy"])
                    .attr('r', 5)
                    .attr('fill', 'black');
                // 画点旁边的标签
                PointText.append('text')
                    .attr('id', 'pointLabel' + index)
                    .text(index + " [" + item["x"] + "," + item["y"] + "]")
                    .attr('x', pointsPosition[index]["sx"])
                    .attr('y', pointsPosition[index]["sy"])
                    .attr('font-size', 18)
                    .attr('transform', 'translate(-30,-15)')
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

// 修改网页中显示的seedlist
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
    let last_points = points;
    points = res;
    $("#PointsTable").html("")
    for (let index in res) {
        item = res[index];
        
        let background_color = "rgb(255,255,255)";
        let changedFlag = false;
        if (item["rd"] != last_points[index]["rd"]){
            background_color = "rgb(255,0,0,0.3)";
            changedFlag = true;
        }

        str = "<tr>\
            <td>" + index + "</td>\
            <td>" + item["x"] + "</td>\
            <td>" + item["y"] + "</td>\
            <td>" + item["cd"].toFixed(2) + "</td>\
            <td style=\"background-color: " + background_color + ";\">";
        
        if (changedFlag){
            str += last_points[index]["rd"].toFixed(2) + " -> "
        }
            
        str += item["rd"].toFixed(2) + "</td>\
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

// 当前点
var ptNode;
// 用于指向当前点邻域内的点。
var ptNode_N;

// 判断当前点是否是核心点。不是核心点则不需要进行将邻域内的点添加到seedlist中的操作；是核心点判断为true。不是核心点为false
var insertlistFlag;

function GetNextNode() {
    // 以下情况不执行 获取下一个当前点的情况
    // 程序运行完
    // 流程还未到这一步
    // 邻域内还有点没有 尝试添加到seedlist中
    if (($("#neighborhood").text() == "finish") || (flow_control <= 1) ||
        (insertlistFlag && (typeof(ptNode_N) != "undefined") && (ptNode_N != points[ptNode].N.length))){
        return
    }
    if ((typeof(seedlist) == "undefined") || (seedlist.length == 0)){
        console.log("GetStartNode");
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
                
                insertlistFlag = res["insertlist"]
                
                d3.select("#pointE" + $("#neighborhood_id").text())
                    .attr("fill","red")
                    .attr("opacity","0.1");
                
                $("#neighborhood_id").text(ptNode);
                d3.select("#pointE" + ptNode)
                    .attr("fill","#0f1423")
                    .attr("opacity","0.3");
                $("#neighborhoods").text(points[ptNode].N);
            }
        })
    }
    else if (seedlist.length > 0){
        console.log("GetNodeFromSeedlist");
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

                insertlistFlag = res["insertlist"]
                
                d3.select("#pointE" + $("#neighborhood_id").text())
                    .attr("fill","red")
                    .attr("opacity","0.1");
                
                $("#neighborhood_id").text(ptNode);
                d3.select("#pointE" + ptNode)
                    .attr("fill","#0f1423")
                    .attr("opacity","0.3");

                $("#neighborhoods").text(points[ptNode].N);
            }
        })
    }
}

function insertlist() {
    // 以下情况不执行 插入到seedlist中的操作
    // 流程还未到当前这一步
    // 当前点还没有获取
    // 当前点邻域内的所有点已经遍历完成，都已经执行过尝试添加到seedlist中的操作
    // 当前点不是核心点
    if ((flow_control <= 1) || (typeof(ptNode_N) == "undefined") || (ptNode_N == points[ptNode].N.length) || (insertlistFlag == false)) return;
    console.log("insertlist");
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
                
                let P_Start = ptNode
                let P_End = points[ptNode].N[ptNode_N];

                Lines.append("path")
                .attr("d","M " + pointsPosition[P_Start]["sx"] + " " + pointsPosition[P_Start]["sy"] + 
                          " L " + pointsPosition[P_End]["sx"] + " " + pointsPosition[P_End]["sy"])
                .attr("stroke","green")
                .attr("stroke-width","3");
        
                LinesLength.append("text")
                .text(Demo.distance[P_Start][P_End].toFixed(2))
                .attr('x', (pointsPosition[P_Start]["sx"] + pointsPosition[P_End]["sx"]) / 2.0)
                .attr('y', (pointsPosition[P_Start]["sy"] + pointsPosition[P_End]["sy"]) / 2.0)
                .attr('font-size', 18)
                .attr('font-weight',550)
                .attr('transform', 'translate(-10,-10)')
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