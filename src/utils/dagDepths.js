/**
 * 优先级：dev_net 大于 dev_type
 * 各个优先级里也要指定层级关系，比如dev_net中 骨干网 为最高层级，承载A网为次层级
 * dev_type里也要有不同层级
 * 如果指定好了，那么有循环情况下，不同层级之间循环好解决，直接强制就行
 * 但此时同一层级，比如都是骨干网，无法解决同一层布局的指向关系
 */
/*
  用于获得各节点深度
 */
import _ from 'lodash'
import { JsxEmit } from 'typescript';
export default function({ nodes, links }, idAccessor, {
  /**
   * 用于指定在 DAG 布局处理期间要忽略的节点。
   * 此访问器方法接收一个节点对象，并应返回一个布尔值，指示是否要包含该节点。
   * 排除的节点将不受约束并且可以向任何方向自由移动,也是自己定义的。
   * nodeFilter为真表示不过滤
   */
  nodeFilter = () => true,
  /**
   * 如果在处理 DAG 布局的数据结构时遇到循环，则调用回调.默认情况下，每当遇到循环时都会抛出异常
   * 可以覆盖此方法以在外部处理这种情况并允许图形继续 DAG 处理。
   * 如果遇到循环并且结果是建立层次结构的最大努力，则不能保证严格的图方向性
   * 这里的onLoopError是默认情况下的处理方法，如果声明了state.onDagError则不进入此逻辑
   * 如果onLoopError有传参，则调用传进来的参数函数
  */
  onLoopError = loopIds => { throw `qqqqq Invalid DAG structure! Found cycle in node path: ${loopIds.join(' -> ')}.` }
} = {}) {
  /**
   * linked graph
   * graph是一个对象(由键值对组成)，其有很多属性(下面会添加)
   * 每个属性就是一个节点名称('d3'),属性值就是data,out,depth等组成的对象
   */
  // console.log("----------three-forcegraph");
  const graph = {};
  // console.log(links.length)
  /**
   * 这里初始化全部节点注意是全部节点，添加data/out/depth/skip等属性，
   * 其中data为节点原始数据，out为其下游数组，depth为其层次，skip为true表示跳过此节点
   * 其输出节点为空数组，深度为-1，skip为false
   */
  nodes.forEach(node => graph[idAccessor(node)] = { data: node, out : [], depth: -1, skip: !nodeFilter(node) });

  // console.log("nodes:--------------",nodes)
  // console.log("links:--------------",links)
  // console.log("------------------------force-graph");
  /**
   * 得到每个节点的out，如果某个节点为单个节点，则其out为空
   */
  //实际上，这里的graph['d3']可能会引起误解这是一个数组，使用graph.d3也可以
  // hasOwnProperty 返回对象是否有某个属性
  links.forEach(({ source, target }) => {
    const sourceId = getNodeId(source);
    const targetId = getNodeId(target);
    if (!graph.hasOwnProperty(sourceId)) throw `Missing source node with id: ${sourceId}`;
    if (!graph.hasOwnProperty(targetId)) throw `Missing target node with id: ${targetId}`;
    const sourceNode = graph[sourceId];
    const targetNode = graph[targetId];
    sourceNode.out.push(targetNode);

    function getNodeId(node) {
      // console.log(node)
      return typeof node === 'object' ? idAccessor(node) : node;
    }
  });
  /**
   * 计算每个节点的深度值depth以及skip用于判断是否有循环问题
   */
  // 发现的环数组
  //Object.values返回 对象的 可枚举属性 的 值 组成的数组
  const foundLoops = [];
  // removeEdge(Object.values(graph))
  //traverse(Object.values(graph));
  fixByHard(Object.values(graph))

 /**
   * 过滤掉要skip的节点以及返回{节点：层次}的对象
   */
  //assign用于将所有可枚举属性的值从一个或多个源对象分配到目标对象。它将返回目标对象.Object.assign(target, ...sources)
  // 如果参数不是对象，也会转化为对象。
  //entries返回一个给定对象自身可枚举属性的键值对数组=》将对象的属性及属性值 转化为键值对形式的数组
  //为什么这里是[,node]，因为上面展开成了key,value的数组，这里忽略掉了key。整体仍是filter的第一个参数。
  const nodeDepths = Object.assign({}, ...Object.entries(graph)
    .filter(([, node]) => !node.skip)
    .map(([id, node]) => ({ [id]: node.depth}))
  );
  // console.log(nodeDepths)
  nodes.forEach(node=>node['out'] = Array.from(new Set(graph[idAccessor(node)].out)))
  return nodeDepths;

  function fixByHard(nodes) {
    let devnetFilterRule = new Map()
    let devtypeFilterRule = new Map()
    // devnetFilterRule.set([1,16],16)
    // devnetFilterRule.set([1,17],15)
    // devnetFilterRule.set([1,4],14)
    // devnetFilterRule.set([1,35],13)

    // devnetFilterRule.set([4,16],12)
    // devnetFilterRule.set([4,17],11)
    // devnetFilterRule.set([4,4],10)
    // devnetFilterRule.set([4,35],9)

    // devnetFilterRule.set([8,16],8)
    // devnetFilterRule.set([8,17],7)
    // devnetFilterRule.set([8,4],6)
    // devnetFilterRule.set([8,35],5)

    // devnetFilterRule.set([10,16],4)
    // devnetFilterRule.set([10,17],3)
    // devnetFilterRule.set([10,4],2)
    // devnetFilterRule.set([10,35],1)
    devnetFilterRule.set(4,4)
    devnetFilterRule.set(8,3)
    devnetFilterRule.set(1,2)
    devnetFilterRule.set(11,1)

    devtypeFilterRule.set(17,4)
    devtypeFilterRule.set(16,3)
    devtypeFilterRule.set(4,2)
    devtypeFilterRule.set(35,1)

    // devtypeFilterRule.set(16,4)
    // devtypeFilterRule.set(17,5)
    // devtypeFilterRule.set(18,1)
    // devtypeFilterRule.set(19,6)
    // devtypeFilterRule.set(20,7)
    // devtypeFilterRule.set(21,8)
    // devtypeFilterRule.set(22,11)
    // devtypeFilterRule.set(23,9)
    // devtypeFilterRule.set(24,10)
    // devtypeFilterRule.set(25,2)

    var nettypeObject = []
    for (let i=0, l=nodes.length; i<l; i++) {
      nettypeObject.push({dev_net:nodes[i].data.dev_net,dev_type:nodes[i].data.dev_type})
    }
    //取出所有dev_net与dev_type的种类组合
    var nettypeUniq = _.uniqWith(nettypeObject,function(a,b){
      return a.dev_net===b.dev_net && a.dev_type ===b.dev_type
    })
    // 根据实现定义的规则对种类进行排序
    nettypeUniq.sort(function(a,b){
      if (a["dev_net"] === b["dev_net"]) {
        return devtypeFilterRule.get(+(b["dev_type"]))- devtypeFilterRule.get(+(a["dev_type"]))
      } else {
        return devnetFilterRule.get(+(b["dev_net"]))- devnetFilterRule.get(+(a["dev_net"]))
      }
    })
    var layerMap = new Map()
    nettypeUniq.forEach(function(element,index){
      layerMap.set(element.dev_net+","+element.dev_type,index)
    })
    for (let i=0, l=nodes.length; i<l; i++) {
      const node = nodes[i];
      node.depth = layerMap.get(node.data.dev_net+","+node.data.dev_type)
    }
  }
  function removeEdge(nodes, visited = [],nodeStack = []) {
    // console.log("start")
    if (visited.length == nodes.length) {
      return
    }
    for (let i=0, l=nodes.length; i<l; i++) {
      const node = nodes[i];
      if (visited[node] == true) {
        continue
      }
      visited[node] = true
      if (nodeStack.indexOf(node) !== -1) {
        const startNodeIndex = nodeStack.indexOf(node)
        const EndNodeIndex = nodeStack.length-1
        if (nodeStack[startNodeIndex].dev_net > nodeStack[EndNodeIndex].dev_net) {
          continue
        } else if (nodeStack[startNodeIndex].dev_net < nodeStack[EndNodeIndex].dev_net) {
          nodeStack.splice(startNodeIndex,1)
          nodeStack = [...nodeStack, node]
        } else {
          if (nodeStack[startNodeIndex].dev_type > nodeStack[EndNodeIndex].dev_type) {
            continue
          } else {
            nodeStack.splice(startNodeIndex,1)
            nodeStack = [...nodeStack, node]
          }
        }
        continue;
      }
      removeEdge(node.out, [...nodeStack, node])
      // console.log(visited)
    }
  }
  function traverse(nodes, nodeStack = [], currentDepth = 0) {
    // console.log(nodes)
    for (let i=0, l=nodes.length; i<l; i++) {
      const node = nodes[i];
      /**
       * nodeStack存放已经遍历的即计算出深度值的节点
       * 进入此逻辑 => indexof结果不为-1 => nodeStack存在此Node => 说明有环
       * 比如第一层节点A指向第二层节点B，B也指向A。
       * 在对A进行dfs时在nodeStack中加入B。
       * 第零次递归：执行 traverse(A的输出(含B)，“只”含A的nodeStack,1)
       * 此时进行递进traverse时，会遍历到B，此时由于nodeStack不含B，不会出现index!==-1的情况。
       * 第一次递归：但是此时会执行 traverse(B的输出(含A),含A和B的nodeStack,2)
       * 此时进行递进递进traverse时，会遍历到A,此时nodeStack含A和B，会出现index==1的情况
       * 如何做？
       * loop=[ANode,BNode,ANode],获得[A,B,A],即['da','da/db']
       * 如果foundLoops中任意元素foundLoop都不满足foundLoop.length === loop.length && foundLoop.every((id, idx) => id === loop[idx])
       * 就在foundLoops中添加此loop,即要保证foundLoops中的循环数组为去重后的
       */
      if (nodeStack.indexOf(node) !== -1) {
        // // console.log("start:",nodeStack)
        // // slice返回一个新的数组对象，以begin开始 ，是包括begin的
        // // map() 方法返回一个新数组，数组中的元素为原始数组元素调用函数处理后的值
        // //  some() 方法测试数组中是不是至少有1个元素通过了被提供的函数测试。
        // //every() 方法测试一个数组内的所有元素是否都能通过某个指定函数的测试
        // const startNodeIndex = nodeStack.indexOf(node)
        // const EndNodeIndex = nodeStack.length-1
        // // console.log("startNodeIndex:",startNodeIndex)
        // // console.log("EndNodeIndex:",EndNodeIndex)
        // if (nodeStack[startNodeIndex].dev_net > nodeStack[EndNodeIndex].dev_net) {
        //   continue
        //   // nodeStack.splice(EndNodeIndex,1)
        // } else if (nodeStack[startNodeIndex].dev_net < nodeStack[EndNodeIndex].dev_net) {
        //   nodeStack.splice(startNodeIndex,1)
        //   nodeStack = [...nodeStack, node]
        // } else {
        //   if (nodeStack[startNodeIndex].dev_type > nodeStack[EndNodeIndex].dev_type) {
        //     continue
        //     // nodeStack.splice(EndNodeIndex,1)
        //   } else {
        //     // console.log(nodeStack)
        //     nodeStack.splice(startNodeIndex,1)
        //     // nodeStack = [...nodeStack.slice(nodeStack.indexOf(node)), node]
        //     nodeStack = [...nodeStack, node]
        //   }
        // }

        const loop = [...nodeStack.slice(nodeStack.indexOf(node)), node].map(d => idAccessor(d.data));
        if (!foundLoops.some(foundLoop => foundLoop.length === loop.length && foundLoop.every((id, idx) => id === loop[idx]))) {
          console.log(loop)
          foundLoops.push(loop);
          onLoopError(loop);
        }

        // console.log("end:",nodeStack)
        continue;
      }
      /**
       * 不要不必要地重新审视graph的各个部分，一直赋以更大的值
       * 比如第二层的节点A的depth在第一层节点的输出节点递归时已经赋了值1
       * 现在由于刚开始的遍历又到A，此时currentDepth为零，小于已经赋的值，因此跳过
       */
      if (currentDepth > node.depth) { // Don't unnecessarily revisit chunks of the graph
        node.depth = currentDepth;
        // console.log(node.depth)
        /**
         * 对于第一个元素d3,depth为零，将之加进nodeStack里，便于以后判断是否有环
         * 如果当前节点需要跳过，则当前节点的输出节点层次不变。如果不跳过，则输出节点层次加一。
         * 注意这里是currentDepth增加，
         */
        traverse(node.out, [...nodeStack, node], currentDepth + (node.skip ? 0 : 1));
      }
    }
  }
}
