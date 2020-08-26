# 珠峰React的实现

## mount分支 
- [mount实现](https://github.com/codediy/react-diy/tree/first-render)

## mount流程

- scheduleRoot() 
    - 设置待处理节点与根节点，空闲循环函数则自动处理

- workLoop()  
    - 空闲循环函数 反复检查nextUnitOfWork，默认为空，在scheduleRoot()初始化为根节点
    - 如果没有nextUnitOfWork,则只需commitRoot()更新渲染
    
- performUnitOfWork()
    - 生成根节点fiber的Fiber树，
    - beginWork()
        - 生成tag,type,props,stateNode,return,child,sibling,effectTag等信息
    - completeUnitOfWork()
        - 生成firstEffect,lastEffect,nextEffect
- commitRoot()
    - 处理effectTag链表
    - PLACEMENT 则appendChild()

## sampleUpdate分支
- [sampleUpdate实现](https://github.com/codediy/react-diy/tree/sample-update)

## sampleUpdate流程
- scheduleRoot() 
    - 检测currentRoot是否存在，如果存在则是更新流程
- commitRoot()
    - 记录workInProgressRoot到currentRoot作为已渲染的缓存
-  reconcileChildren
    - oldFiler与newChild的比较
    - type相同则复用，type不同则删除重建
    - 这里关联newFiber.alternative到oldFiber
- commitWork()
    - PLACEMENT,DELETION,UPDATE等effectTag的处理
- setProps()
    - oldProps与newProps的处理

## doubleBuffer分支
[doubleBuffer实现](https://github.com/codediy/react-diy/tree/double-buffer)

## doubleBuffer流程
- scheduleRoot() 
    - 检测currentRoot.alternate是否存在，
    - 如果存在说明已经进行过一次更新，直接复用旧的workInProgressRoot
    - 旧的workInProgressRoot存在currentRoot.alternate上

## ClassComponent分支
[ClassComponent实现](https://github.com/codediy/react-diy/tree/class-component)

## ClassComponent流程
### mount阶段
- performUnitOfWork()
    - 生成根节点fiber的Fiber树，
    - 根节点处理过程tag=TAG_CLASS
    - beginWork()中TAG_CLASS的调用updateClassComponent
 
### update阶段
- updateClassComponent
    - 生成组件实例
    - 更新队列操作
    - render()重新生成vDOM
    - reconcileChildren处理vDOM

## FunctionComponent分支
[FunctionComponent实现](https://github.com/codediy/react-diy/tree/function-component)

## FunctionComponent流程

- updateFunctionComponent
    - 初始化fiber.hooks = [];
- useReducer
    - 挂载hooks到fiber.hooks 
- dispatch
    - 调度UpdateQueue