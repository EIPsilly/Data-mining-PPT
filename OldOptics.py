import pandas as pd
import numpy as np
import math
import random
import heapq
import json
from queue import PriorityQueue as PQ


class Point(object):

    def __init__(self,x,y,cd,rd,vi,N):
        self.x = x
        self.y = y
        self.cd = cd  # 核心距离
        self.rd = rd  # 可达距离
        self.vi = vi  # 是否被处理过
        self.N = N  # 邻域内的点

    @classmethod
    def CreatePoint(cls,x,y):
        return cls(x,y,-1,-1,-1,[])


    def __str__(self):
        return "(%.2f, %.2f)" % (self.x, self.y)

    def distance(self, pt):
        return math.sqrt((self.x - pt.x) ** 2 + (self.y - pt.y) ** 2)

    def sum(self, pt):
        newPt = Point()
        xNew = self.x + pt.x
        yNew = self.y + pt.y
        return Point(xNew, yNew)


class myOPTICS(object):


    def __init__(self,e,MinPts,num,points,pi,distance,seedlist,core,remainder):
        self.e = e
        self.MinPts = MinPts
        self.num = num
        self.points = points
        self.pi = pi
        self.distance = distance
        self.seedlist = seedlist
        self.core = core
        self.remainder = remainder
 
    @classmethod
    def CreateWithPoints(cls,_e, _MinPts, L):
        e = _e
        MinPts=_MinPts
        num = len(L)  # 点的数量
        points = []  # 存储点的list
        pi = []  # 点的出序顺序
        distance = (np.zeros((num, num)) - np.ones((num, num))).tolist()
        seedlist = PQ()
        core = -1
        remainder = -1

        for item in L:
            points.append(Point.CreatePoint(item[0], item[1]))
        
        return cls(e,MinPts,num,points,pi,distance,seedlist,core,remainder)

    @classmethod
    def CreateWithJson(cls,json_obj):
        e = json_obj["e"]
        MinPts= json_obj["MinPts"]
        num = json_obj["num"]
        points = []  # 存储点的list
        pi = json_obj["pi"]  # 点的出序顺序
        distance = json_obj["distance"]
        seedlist = PQ()
        seedlist.queue = json_obj["seedlist"]
        core = json_obj["core"]
        remainder = json_obj["remainder"]

        for item in json_obj["points"]:
            points.append(Point(item["x"],item["y"],item["cd"],item["rd"],item["vi"],item["N"]))
        
        return cls(e,MinPts,num,points,pi,distance,seedlist,core,remainder)

    def AddToNeighborhood(self):
        # 计算每个点的邻域内存在的点，并将其添加到点的N队列中
        for i in range(self.num):
            for j in range(i, self.num):
                if i == j:
                    self.distance[i][j] = self.distance[j][i] = 0
                    self.points[i].N.append(i)
                    continue
                self.distance[i][j] = self.distance[j][i] = self.points[i].distance(self.points[j])
                if self.distance[i][j] <= self.e:
                    self.points[i].N.append(j)
                    self.points[j].N.append(i)

    def CalcCoreDistance(self):
        # 计算每个点的核心距离
        for i in range(self.num):
            self.core = i
            self.points[i].N.sort(key=self.getDistance)
            if len(self.points[i].N) >= self.MinPts:
                self.points[i].cd = self.distance[i][self.points[i].N[self.MinPts - 1]]

    # 返回核心点与其邻域内点的距离
    def getDistance(self, index):
        return self.distance[self.core][index]

    def insertlist(self, index):
        for index2 in self.points[index].N:
            node = self.points[index2]
            if node.vi == -1:
                # 计算点index2到index的可达距离
                rd = max(self.points[index].cd, self.distance[index][index2])
                if (node.rd == -1) | (rd < node.rd):
                    node.rd = rd
                    self.seedlist.put((node.rd, index2))

    def myoptics(self):
        self.remainder = self.num  # 未被处理的点的数量
        index = 0
        # 循环直到所有点都被处理过了
        while self.remainder > 0:
            node = self.points[index]
            # 如果当前点尚未被处理过
            if node.vi == -1:
                node.vi = 1  # 设置为已处理过
                self.remainder -= 1
                self.pi.append(index)  # 添加到出序队列
                if len(node.N) >= self.MinPts:  # 如果点index是核心点
                    self.insertlist(index)
                    while self.seedlist._qsize() > 0:
                        index2 = self.seedlist._get()[1]
                        item = self.points[index2]
                        if item.vi != -1:
                            continue
                        item.vi = 1
                        self.remainder -= 1
                        self.pi.append(index2)
                        if len(item.N) >= self.MinPts:
                            self.insertlist(index2)

            index = (index + 1) % self.num


class OpticsEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, myOPTICS):
            json_obj = {}
            json_obj["e"] = obj.e
            json_obj["MinPts"] = obj.MinPts
            json_obj["num"] = obj.num
            json_obj["points"] = obj.points
            json_obj["pi"] = obj.pi
            json_obj["distance"] = obj.distance
            json_obj["seedlist"] = obj.seedlist.queue
            json_obj["core"] = obj.core
            json_obj["remainder"] = obj.remainder
            return json_obj

        if isinstance(obj, Point):
            return {"x": obj.x,
                    "y": obj.y,
                    "cd": obj.cd,
                    "rd": obj.rd,
                    "vi": obj.vi,
                    "N": obj.N}

        # Let the base class default method raise the TypeError
        return json.JSONEncoder.default(self, obj)

# class OpticsDecoder(json.JSONDecoder):


# demo = OPTIC(20,5,100)
if __name__ == '__main__':
    demo = myOPTICS.CreateWithPoints(1000, 2, [[1, 2], [2, 5], [3, 6], [8, 7], [8, 8], [7, 3]])
    
    json_str = json.dumps(demo,cls=OpticsEncoder)
    print(json_str)
    print(type(json_str))

    demo1 = myOPTICS.CreateWithJson(json.loads(json_str))
    # print(json_obj)
    while 1:
        X = np.random.randint(0,1000,size=[1000,2]).tolist()
        # X = [[1, 2], [2, 5], [3, 6], [8, 7], [8, 8], [7, 3]]
        max_eps = 3.2
        min_samples = 2
        demo = myOPTICS.CreateWithPoints(max_eps, min_samples, X)

        json_str = json.dumps(demo,cls=OpticsEncoder)
        demo = myOPTICS.CreateWithJson(json.loads(json_str))

        demo.AddToNeighborhood()

        json_str = json.dumps(demo,cls=OpticsEncoder)
        demo = myOPTICS.CreateWithJson(json.loads(json_str))

        demo.CalcCoreDistance()

        json_str = json.dumps(demo,cls=OpticsEncoder)
        demo = myOPTICS.CreateWithJson(json.loads(json_str))

        demo.myoptics()
        # print(demo.pi)

        # for i in range(len(demo.points)):
        #     print(demo.points[i].cd,end=" ")

        # print()

        # for i in range(len(demo.points)):
        #     print(demo.points[i].rd,end=" ")

        # print("\n\n================================\n")

        from sklearn.cluster import OPTICS

        cluster = OPTICS(max_eps=max_eps, min_samples=min_samples,
                         cluster_method='dbscan').fit(X)
        # print(cluster.labels_)
        # print(cluster.ordering_)
        # print(cluster.core_distances_)
        # print(cluster.reachability_)

        print("\n**********************************\n")

        flag = False

        def write(i):
            print(i)
            print(demo.pi[i], end=" ")
            print(demo.points[i].cd, end=" ")
            print(demo.points[i].rd)
            print(cluster.ordering_[i], end=" ")
            print(cluster.core_distances_[i], end=" ")
            print(cluster.reachability_[i])

        print("ordering")
        for i in range(len(demo.pi)):
            if demo.pi[i] == cluster.ordering_[i]:
                continue
            flag = True
            write(i)

        print("core_distances")
        for i in range(len(demo.points)):
            if (demo.points[i].cd == -1) & (cluster.core_distances_[i] == math.inf):
                continue
            if demo.points[i].cd - cluster.core_distances_[i] < 1e-6:
                continue
            write(i)
            flag = True

        print("reachability")
        for i in range(len(demo.points)):
            if (demo.points[i].rd == -1) & (cluster.reachability_[i] == math.inf):
                continue
            if demo.points[i].rd - cluster.reachability_[i] < 1e-3:
                continue
            write(i)
            flag = True

        if flag:
            break