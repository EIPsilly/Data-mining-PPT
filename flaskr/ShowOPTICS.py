from flask import (Blueprint,flash,g,redirect,render_template,request,url_for,session)
from werkzeug.exceptions import abort

from flask.json import jsonify
import datetime
import pandas as pd
import numpy as np
import json
from OPTICS import myOPTICS,OpticsEncoder


bp = Blueprint('ShowOPTICS',__name__)

@bp.route('/')
def index():
    # Demo = myOPTICS.CreateWithPoints(3.2,2,[[1,2],[2,5],[3,6],[8,7],[8,8],[7,3]])
    Demo = myOPTICS.CreateWithPoints(3,3,[[2, 0], [6, 4], [0, 1], [4, 1], [5, 5], [4, 3], [5, 6], [9, 8], [7, 5], [1, 9], [8, 7], [5, 9], [9, 2], [3, 7], [4, 4]])
    session["Demo"] = json.dumps(Demo,cls=OpticsEncoder)
    return render_template('index.html')

@bp.route('/GetPoints')
def GetPoints():
    Demo = myOPTICS.CreateWithJson(json.loads(session["Demo"]))
    json_str = json.dumps(Demo.points, default=lambda o: o.__dict__, sort_keys=True, indent=4)
    return json_str

@bp.route('/GetDemo')
def GetDemo():
    return session["Demo"]

@bp.route('/AddToNeighborhood')
def AddToNeighborhood():
    Demo = myOPTICS.CreateWithJson(json.loads(session["Demo"]))
    Demo.AddToNeighborhood()
    session["Demo"] = json.dumps(Demo,cls=OpticsEncoder)
    return session["Demo"]

@bp.route('/CalcCoreDistance')
def CalcCoreDistance():
    Demo = myOPTICS.CreateWithJson(json.loads(session["Demo"]))
    Demo.CalcCoreDistance()
    session["Demo"] = json.dumps(Demo,cls=OpticsEncoder)
    return session["Demo"]

@bp.route("/GetStartNode")
def GetStartNode():
    Demo = myOPTICS.CreateWithJson(json.loads(session["Demo"]))
    if (Demo.remainder == -1):
        Demo.remainder = Demo.num  # 未被处理的点的数量
        Demo.ptr = 0
    if (Demo.remainder == 0):
        print(Demo.remainder)
        print("finished")
        return {
            "message":"finished"
        }
    node = Demo.points[Demo.ptr]
    # print(node)
    while (Demo.remainder > 0) & (node.vi != -1):
        Demo.ptr = (Demo.ptr + 1) % Demo.num
        node = Demo.points[Demo.ptr]
    node.vi = 1  # 设置为已处理过
    Demo.remainder -= 1
    Demo.pi.append(Demo.ptr)  # 添加到出序队列
    session["Demo"] = json.dumps(Demo,cls=OpticsEncoder)
    return {
        "index":Demo.ptr,
        "Demo":json.loads(session["Demo"])
    }

from queue import PriorityQueue as PQ
def getseedlist(seedlist):
    Demo = myOPTICS.CreateWithJson(json.loads(session["Demo"]))
    tmp = PQ()
    for item in seedlist.queue:
        tmp.queue.append(item)
    
    L = []
    while tmp._qsize() != 0:
        index = tmp._get()[1]
        if (~(index in L)) & (Demo.points[index].vi == -1):
            L.append(index)
    
    print(L)

    return L

@bp.route("/insertlist")
def insertlist():
    try:
        index = request.form["core_node"]
        index2 = request.form["neighborhood"]
    except KeyError:
        index = request.args.get("core_node")
        index2 = request.args.get("neighborhood")
    index2 = int(index2)
    index = int(index)
    print(index2)
    Demo = myOPTICS.CreateWithJson(json.loads(session["Demo"]))
    node = Demo.points[index2]
    print(node)
    print(node.vi)
    if node.vi == -1:
        # 计算点index2到index的可达距离
        rd = max(Demo.points[index].cd, Demo.distance[index][index2])
        if (node.rd == -1) | (rd < node.rd):
            node.rd = rd
            print("(node.rd, index2)")
            print((node.rd, index2))
            print(type((node.rd, index2)))
            print("Demo.seedlist.queue")
            print(Demo.seedlist.queue)
            Demo.seedlist.put((node.rd, index2))
        session["Demo"] = json.dumps(Demo,cls=OpticsEncoder)    
        return {
            "Demo":json.loads(session["Demo"]),
            "seedlist":getseedlist(Demo.seedlist)
        }
    else:
        return{
            "message":"node.vi == 1"
        }

@bp.route("/GetNodeFromSeedlist")
def GetNodeFromSeedlist():
    print("GetNodeFromSeedlist")
    Demo = myOPTICS.CreateWithJson(json.loads(session["Demo"]))
    while Demo.seedlist._qsize() > 0:
        index2 = Demo.seedlist._get()[1]
        item = Demo.points[index2]
        if item.vi != -1:
            continue
        item.vi = 1
        Demo.remainder -= 1
        Demo.pi.append(index2)

        session["Demo"] = json.dumps(Demo,cls=OpticsEncoder)
        return {
            "index":index2,
            "Demo":json.loads(session["Demo"]),
            "seedlist":getseedlist(Demo.seedlist)
        }