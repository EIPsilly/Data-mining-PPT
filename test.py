import json
import numpy as np
from queue import PriorityQueue as PQ


t = PQ()
t.put((3,4))
t.put((2,3))
t.put((1,2))
print(t.queue)
while t.qsize():
    print(t.get())