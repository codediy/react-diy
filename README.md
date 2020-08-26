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

