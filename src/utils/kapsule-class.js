/*
 * @Author: your name
 * @Date: 2022-04-06 16:45:33
 * @LastEditTime: 2022-04-07 15:58:42
 * @LastEditors: your name
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: \three-forcegraph\src\utils\kapsule-class.js
 */
export default function(kapsule, baseClass = Object, initKapsuleWithSelf = false) {

  class FromKapsule extends baseClass {
    /**
     * constructor 是一种用于创建和初始化class创建的对象的特殊方法
     * 一个类中只能有一个名为 “constructor” 的特殊方法
     * 在一个构造方法中可以使用super关键字来调用一个父类的构造方法
     * 在派生类中, 必须先调用 super() 才能使用 "this"
     * 不可使用 this.area = value,否则会导致循环call setter方法导致爆栈
     */
    constructor(...args) {
      super(...args);
      /**
       * 对象中的扩展运算符(...)用于取出参数对象中的所有可遍历属性，拷贝到当前对象之中
       * 数组中的扩展运算符用于将将数组转换为参数序列
       * 这里要传给kapsule参数，但是原先都是数组，因此第一个...用于将数组转化为参数序列
       * 又因为...args用于子类多余参数，且...arg只能放在最后面
       */
      this.__kapsuleInstance = kapsule()(...[...(initKapsuleWithSelf ? [this] : []), ...args]);
    }
  }

  // attach kapsule props/methods to class 
  /**
   * JavaScript是基于原型的语言——每个对象拥有一个原型对象，对象以其原型为模板、从原型继承方法和属性
   * 这些属性和方法定义在Object的构造器函数之上的prototype（原型）属性上，而非对象实例本身
   * 传统的 OOP 中，首先定义“类”，此后创建对象实例时，类中定义的所有属性和方法都被复制到实例中
   * JavaScript 中并不如此复制——而是在对象实例和它的构造器之间建立一个链接
   * （它是__proto__属性，是从构造函数的prototype属性派生的），之后通过上溯原型链，在构造器中找到这些属性和方法
   * 可以使用原型 prototype 属性给对象的构造函数添加新的属性和方法
   * 
   * 这里的目的是返回基于FromKapsule的原型链，而不是基于kapsule
   * 具体做法是对于kapsule的每个属性，都使用FromKapsule重新加工，并返回FromKapsule的属性
   * Object.keys返回对象的可枚举字符串属性和方法组成的数组
  */
  Object.keys(kapsule())
    .forEach(m => FromKapsule.prototype[m] = function(...args) {
      const returnVal = this.__kapsuleInstance[m](...args);

      return returnVal === this.__kapsuleInstance
        ? this  // chain based on this class, not the kapsule obj
        : returnVal;
    });

  return FromKapsule;

}
