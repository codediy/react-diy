import {TAG_ROOT} from "./constant";
import {scheduleRoot} from "./scheduler"

/**
 * 渲染一个VDom到容器
 * @param element
 * @param container
 */
function render(element, container) {
    /*RootFiber*/
    let rootFiber = {
        tag: TAG_ROOT, /*标签类型*/
        stateNode: container, /*原生挂载点*/
        props: {children: [element]} /*待渲染子节点*/
    };
    /*开始调度*/
    scheduleRoot(rootFiber);
}

const ReactDOM = {
    render
};

export default ReactDOM;
