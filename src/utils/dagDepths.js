/*
 * @Author: your name
 * @Date: 2022-04-06 16:45:33
 * @LastEditTime: 2022-04-14 17:21:32
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: \three-forcegraph\src\utils\dagDepths.js
 */
/*
  用于获得各节点深度
 */
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
   */
  onLoopError = loopIds => { throw `qqqqq Invalid DAG structure! Found cycle in node path: ${loopIds.join(' -> ')}.` }
} = {}) {
  /** 
   * linked graph
   * graph是一个对象(由键值对组成)，其有很多属性(下面会添加)
   * 每个属性就是一个节点名称('d3'),属性值就是data,out,depth等组成的对象
   */
  const graph = {};

  /**
   * 这里初始化全部节点注意是全部节点，添加data/out/depth/skip等属性，
   * 其中data为节点原始数据，out为其下游数组，depth为其层次，skip为true表示跳过此节点
   * 其输出节点为空数组，深度为-1，skip为false
   */
  nodes.forEach(node => graph[idAccessor(node)] = { data: node, out : [], depth: -1, skip: !nodeFilter(node) });
  
  /**
   * 得到out
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
      return typeof node === 'object' ? idAccessor(node) : node;
    }
  });

  /**
   * 计算每个节点的深度值depth以及skip用于判断是否有循环问题
   */
  // 发现的环数组
  //Object.values返回 对象的 可枚举属性 的 值 组成的数组
  const foundLoops = [];   
  traverse(Object.values(graph)); 
  
 /**
   * 过滤掉要skip的节点以及返回{节点：层次}的对象
   */
  //assign用于将所有可枚举属性的值从一个或多个源对象分配到目标对象。它将返回目标对象.Object.assign(target, ...sources)
  // 如果参数不是对象，也会转化为对象。
  //entries返回一个给定对象自身可枚举属性的键值对数组=》将对象的属性及属性值 转化为键值对形式的数组
  //为什么这里是[,node]，因为上面展开成了key,value的数组，这里忽略掉了key。整体仍是filter的第一个参数。 
  const nodeDepths = Object.assign({}, ...Object.entries(graph)
    .filter(([, node]) => !node.skip)
    .map(([id, node]) => ({ [id]: node.depth }))
  );

  return nodeDepths;
  function traverse(nodes, nodeStack = [], currentDepth = 0) {
    for (let i=0, l=nodes.length; i<l; i++) {
      const node = nodes[i];
      /**
       * nodeStack存放已经遍历的即计算出深度值的节点
       * 进入此逻辑 => indexof结果不为-1 => nodeStack存在此Node => 说明有环
       * 比如第一层节点A指向第二层节点B，B也指向A。
       * 在对A进行dfs时在nodeStack中加入B。
       * 第零次递归：执行 traverse(A的输出(含B)，“只”含A的nodeStack,1)
       * 此时进行递进traverse时，会遍历到B，此时由于nodeStack不含B，不会出现!==-1的情况。
       * 第一次递归：但是此时会执行 traverse(B的输出(含A),含A和B的nodeStack,2)
       * 此时进行递进递进traverse时，会遍历到A,
       * 此时由于上面的重新遍历又重新遍历到了B，发现nodeStack有B，可得出结论
       */
      if (nodeStack.indexOf(node) !== -1) {
        // slice返回一个新的数组对象，以begin开始 ，是包括begin的
        // map() 方法返回一个新数组，数组中的元素为原始数组元素调用函数处理后的值
        const loop = [...nodeStack.slice(nodeStack.indexOf(node)), node].map(d => idAccessor(d.data));
        if (!foundLoops.some(foundLoop => foundLoop.length === loop.length && foundLoop.every((id, idx) => id === loop[idx]))) {
          foundLoops.push(loop);
          onLoopError(loop);
        }
        continue;
      }
      /**
       * 不要不必要地重新审视graph的各个部分，一直赋以更大的值
       * 比如第二层的节点A的depth在第一层节点的输出节点递归时已经赋了值1
       * 现在由于刚开始的遍历又到A，此时currentDepth为零，小于已经赋的值，因此跳过
       */
      if (currentDepth > node.depth) { // Don't unnecessarily revisit chunks of the graph
        node.depth = currentDepth;
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