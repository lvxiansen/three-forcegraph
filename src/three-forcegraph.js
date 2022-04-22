/**
 * windos是js语法，是window对象，表示浏览器窗口
 */
import { Group } from 'three';
const three = window.THREE ? window.THREE : { Group }; // Prefer consumption from global THREE, if exists

import ForceGraph from './forcegraph-kapsule.js';
import fromKapsule from './utils/kapsule-class.js';
/**
 * export default 和 export 的主要区别 在于对应的import的区别：
   export 对应的 import 需要知道 export抛出的变量名或函数名 import{a,b}
   export default对应的 import 不需要知道 export抛出的变量名或函数名 import anyname
 */
export default fromKapsule(ForceGraph, three.Group, true);
