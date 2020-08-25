/*待处理单元*/
import {ELEMENT_TEXT, PLACEMENT, TAG_HOST, TAG_ROOT, TAG_TEXT} from "./constant";
import {createDOM} from "./utills"

let nextUnitOfWork = null;
/*根节点*/
let workInProgressRoot = null;

/**
 * 从rootFiber开始渲染
 * @param rootFiber
 */
export function scheduleRoot(rootFiber) {
    workInProgressRoot = rootFiber;
    nextUnitOfWork = rootFiber;
}

/**
 * idle回调函数
 * @param deadline
 */
function workLoop(deadline) {
    let shouldYield = false;
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        /*检查剩余时间*/
        shouldYield = deadline.timeRemaining() < 1;
    }
    if (!nextUnitOfWork && workInProgressRoot) {
        console.log("render阶段结束");
        commitRoot();
    }
    /*空闲时间再次执行*/
    requestIdleCallback(workLoop, {timeout: 500});
}

/*空闲时间执行*/
requestIdleCallback(workLoop, {timeout: 500});


function performUnitOfWork(currentFiber) {
    /*1生成本节点DOM元素 2 生成Fiber树*/
    beginWork(currentFiber);
    /*检查子节点 深度遍历*/
    if (currentFiber.child) {
        return currentFiber.child;
    }

    /*所有子节点检查完成后 完成当前节点*/
    while (currentFiber) {
        completeUnitOfWork(currentFiber);

        /*同兄弟节点子节点处理*/
        if (currentFiber.sibling) {
            return currentFiber.sibling
        }

        /*当前兄弟节点处理完成 返回父节点*/
        currentFiber = currentFiber.return;
    }
}

/**
 * 对单个节点处理 生成stateNode,return/child/sibling等Fiber树
 * @param currentFiber
 */
function beginWork(currentFiber) {
    if (currentFiber.tag === TAG_ROOT) {
        /*根节点 生成Fiber树*/
        updateHostRoot(currentFiber);
    } else if (currentFiber.tag == TAG_HOST) {
        /*普通元素*/
        updateHost(currentFiber);
    } else if (currentFiber.tag == TAG_TEXT) {
        /*文本节点 生成DOM*/
        updateHostText(currentFiber);
    }
}

/**
 * 根节点处理 生成Fiber树
 * @param currentFiber
 */
function updateHostRoot(currentFiber) {
    /*读取所有子节点*/
    let newChildren = currentFiber.props.children;
    /*子节点处理*/
    reconcileChildren(currentFiber, newChildren);
}

/**
 * 元素节点处理
 * @param currentFiber
 */
function updateHost(currentFiber) {
    if (!currentFiber.stateNode) {
        currentFiber.stateNode = createDOM(currentFiber);
    }
    const newChildren = currentFiber.props.children;
    reconcileChildren(currentFiber, newChildren);
}

/**
 * Text节点处理
 * @param currentFiber
 */
function updateHostText(currentFiber) {
    if (!currentFiber.stateNode) {
        currentFiber.stateNode = createDOM(currentFiber);
    }
}

/**
 * 当前子节点的所有子节点的处理 生成Fiber
 * @param currentFiber
 * @param newChildren
 */
function reconcileChildren(currentFiber, newChildren) {
    let newChildIndex = 0;
    /*上一个新的子fiber*/
    let prevSibling;

    /*生成Fiber树*/
    while (newChildIndex < newChildren.length) {
        let newChild = newChildren[newChildIndex];
        let tag;

        if (newChild.type == ELEMENT_TEXT) {
            /*文本节点*/
            tag = TAG_TEXT;
        } else if (typeof  newChild.type === "string") {
            /*普通元素节点*/
            tag = TAG_HOST;
        }

        let newFiber = {
            tag,
            type: newChild.type,
            props: newChild.props,
            stateNode: null, /*beginWork处理生成*/

            return: currentFiber, /*父节点*/
            child: null, /*子节点reconcileChildren生成*/
            sibling: null, /*兄弟节点*/

            effectTag: PLACEMENT, /*effectTag*/
            firstEffect: null, /*上一个 completeUnitOfWork生成*/
            lastEffect: null, /*最后一个*/
            nextEffect: null, /*下一个effect*/
        };

        if (newFiber) {
            if (newChildIndex == 0) {
                /*父节点指向第一个子节点*/
                currentFiber.child = newFiber;
            } else {
                /*兄弟节点连接*/
                prevSibling.sibling = newFiber;
            }
            /*缓存上一个兄弟节点*/
            prevSibling = newFiber;
        }
        newChildIndex = newChildIndex + 1;
    }
}


/**
 * 完成节点处理
 * @param currentFiber
 */
function completeUnitOfWork(currentFiber) {
    let returnFiber = currentFiber.return;

    if (returnFiber) {
        /*父节点的的effect同步*/
        if (!returnFiber.firstEffect) { /*父节点的first检查*/
            returnFiber.firstEffect = currentFiber.firstEffect;
        }
        if (currentFiber.lastEffect) {
            if (returnFiber.lastEffect) {
                returnFiber.lastEffect.nextEffect = currentFiber.firstEffect;
            }
            returnFiber.lastEffect = currentFiber.lastEffect;
        }

        /*如果当前节点包含effectTag则将当前节点本身挂载到父节点*/
        const effectTag = currentFiber.effectTag;
        if (effectTag) {
            if (returnFiber.lastEffect) {
                returnFiber.lastEffect.nextEffect = currentFiber;
            } else {
                returnFiber.firstEffect = currentFiber;
            }

            returnFiber.lastEffect = currentFiber;
        }
    }
}

function commitRoot() {
    let currentFiber = workInProgressRoot.firstEffect;
    while (currentFiber) {
        console.log("commitRoot", currentFiber);
        commitWork(currentFiber);
        currentFiber = currentFiber.nextEffect;
    }
    workInProgressRoot = null;
}

function commitWork(currentFiber) {
    if (!currentFiber) return;
    let returnFiber = currentFiber.return;
    let returnDOM = returnFiber.stateNode;

    if (currentFiber.effectTag === PLACEMENT) {
        returnDOM.appendChild(currentFiber.stateNode);
    }
    currentFiber.effectTag = null;
}









