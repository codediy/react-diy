import {
    DELETION,
    ELEMENT_TEXT,
    PLACEMENT,
    TAG_CLASS,
    TAG_FUNCTION,
    TAG_HOST,
    TAG_ROOT,
    TAG_TEXT,
    UPDATE
} from "./constant";
import {createDOM, updateDOM} from "./utills"
import {UpdateQueue, Update} from "./UpdateQueue";

/*待处理单元*/
let nextUnitOfWork = null;
/*正在生成的渲染的树*/
let workInProgressRoot = null;
/*当前渲染的树*/
let currentRoot = null;
/*待删除的节点数组*/
let deletions = [];

/*hook变量*/
let workInProgressFiber = null;
let hookIndex = 0;

/**
 * 从rootFiber开始渲染
 * @param rootFiber
 */
export function scheduleRoot(rootFiber) {
    if (currentRoot && currentRoot.alternate) {
        /*已mount过的第二次及以后的更新*/
        /*使用workInProgressRoot的stateNode*/
        workInProgressRoot = currentRoot.alternate;
        workInProgressRoot.alternate = currentRoot
        if (rootFiber) { /*Class组节的scheduleRoot*/
            workInProgressRoot.props = rootFiber.props;
        }
    } else if (currentRoot) {
        /*已mount过的首次update*/
        if (rootFiber) {
            workInProgressRoot.props = rootFiber.props;
            workInProgressRoot = rootFiber;
        } else {
            workInProgressRoot = {
                ...currentRoot,
                alternate: currentRoot
            }
        }
    } else {
        /*mount过程*/
        workInProgressRoot = rootFiber;
    }
    workInProgressRoot.firstEffect = null;
    workInProgressRoot.lastEffect = null;
    workInProgressRoot.nextEffect = null;

    /*待处理节点*/
    nextUnitOfWork = workInProgressRoot;
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
    } else if (currentFiber.tag === TAG_HOST) {
        /*普通元素*/
        updateHost(currentFiber);
    } else if (currentFiber.tag === TAG_TEXT) {
        /*文本节点 生成DOM*/
        updateHostText(currentFiber);
    } else if (currentFiber.tag === TAG_CLASS) {
        /*Class组件节点*/
        updateClassComponent(currentFiber)
    } else if (currentFiber.tag === TAG_FUNCTION) {
        /*Function组件节点*/
        updateFunctionComponent(currentFiber);
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
 * Class组件
 * @param currentFiber
 */
function updateClassComponent(currentFiber) {
    if (!currentFiber.stateNode) { /*实例化*/
        /*类组件stateNode为组件的实例*/
        /*new ClassCounter()*/
        currentFiber.stateNode = new currentFiber.type(currentFiber.props);
        /*stateNode指向currentFiber*/
        currentFiber.stateNode.internalFiber = currentFiber;
        /*更新队列*/
        currentFiber.updateQueue = new UpdateQueue();
    }
    /*组件实例的更新操作*/
    currentFiber.stateNode.state = currentFiber.updateQueue.forceUpdate(currentFiber.stateNode.state);
    /*重新渲染ClassComponent*/
    let newElement = currentFiber.stateNode.render();
    const newChildren = [newElement];
    /*子节点处理*/
    reconcileChildren(currentFiber, newChildren);
}

/**
 * 函数式组件更新
 * @param currentFiber
 */
function updateFunctionComponent(currentFiber) {
    /*当前Fiber的hook存储*/
    workInProgressFiber = currentFiber;
    hookIndex = 0;
    workInProgressFiber.hooks = [];

    /*生成子节点*/
    const newChildren = [currentFiber.type(currentFiber.props)];
    /*子节点处理*/
    reconcileChildren(currentFiber, newChildren);
}

/**
 * 当前子节点的所有子节点的处理 生成Fiber
 * @param currentFiber
 * @param newChildren
 */
function reconcileChildren(currentFiber, newChildren) {
    let newChildIndex = 0;
    /*旧的子节点数组*/
    let oldFiber = currentFiber.alternate && currentFiber.alternate.child;
    if (oldFiber) {
        oldFiber.firstEffect = oldFiber.lastEffect = oldFiber.nextEffect = null;
    }
    /*上一个新的子fiber*/
    let prevSibling;

    /*生成Fiber树*/
    while (newChildIndex < newChildren.length || oldFiber) {
        let newChild = newChildren[newChildIndex];
        let newFiber;

        let tag;
        if (newChild
            && typeof newChild.type === "function"
            && newChild.type._isComponent) {
            /*Class组件*/
            tag = TAG_CLASS;
        } else if (newChild
            && typeof newChild.type === "function") {
            /*Class组件*/
            tag = TAG_FUNCTION;
        } else if (newChild
            && typeof  newChild.type === "string") {
            /*普通元素节点*/
            tag = TAG_HOST;
        } else if (newChild
            && newChild.type === ELEMENT_TEXT) {
            /*文本节点*/
            tag = TAG_TEXT;
        }

        console.log("childHandle", tag, currentFiber);

        const sameType = oldFiber && newChild && oldFiber.type == newChild.type;
        if (sameType) {
            /*新旧节点type相同 复用旧的DOM节点*/
            if (oldFiber.alternate) { /*多次更新后的复用*/
                newFiber = {
                    tag: oldFiber.alternate.tag,
                    type: oldFiber.alternate.type,
                    props: newChild.props,
                    stateNode: oldFiber.alternate.stateNode, /*beginWork处理生成*/
                    return: currentFiber, /*父节点*/
                    child: null, /*子节点reconcileChildren生成*/
                    sibling: null, /*兄弟节点*/
                    alternate: oldFiber,
                    effectTag: UPDATE, /*effectTag*/
                    updateQueue: oldFiber.updateQueue || new UpdateQueue(), /*更新队列*/
                    firstEffect: null, /*上一个 completeUnitOfWork生成*/
                    lastEffect: null, /*最后一个*/
                    nextEffect: null, /*下一个effect*/
                }
            } else {
                newFiber = {
                    tag: oldFiber.tag,
                    type: oldFiber.type,
                    props: newChild.props,
                    stateNode: oldFiber.stateNode, /*beginWork处理生成*/
                    return: currentFiber, /*父节点*/
                    child: null, /*子节点reconcileChildren生成*/
                    sibling: null, /*兄弟节点*/
                    alternate: oldFiber,
                    effectTag: UPDATE, /*effectTag*/
                    updateQueue: oldFiber.updateQueue || new UpdateQueue(), /*更新队列*/
                    firstEffect: null, /*上一个 completeUnitOfWork生成*/
                    lastEffect: null, /*最后一个*/
                    nextEffect: null, /*下一个effect*/
                }
            }
        } else {
            if (newChild) {
                /*新旧节点type不同*/
                newFiber = {
                    tag,
                    type: newChild.type,
                    props: newChild.props,
                    stateNode: null, /*beginWork处理生成*/

                    return: currentFiber, /*父节点*/
                    child: null, /*子节点reconcileChildren生成*/
                    sibling: null, /*兄弟节点*/

                    effectTag: PLACEMENT, /*effectTag*/
                    updateQueue: new UpdateQueue(), /*更新队列*/
                    firstEffect: null, /*上一个 completeUnitOfWork生成*/
                    lastEffect: null, /*最后一个*/
                    nextEffect: null, /*下一个effect*/
                };
            }

            if (oldFiber) {
                /*旧的处理*/
                oldFiber.effectTag = DELETION;
                deletions.push(oldFiber);
            }
        }

        if (oldFiber) {
            oldFiber = oldFiber.sibling;
        }

        if (newFiber) {
            if (newChildIndex === 0) {
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
    /*待删除元素处理*/
    deletions.forEach(commitWork);

    let currentFiber = workInProgressRoot.firstEffect;
    while (currentFiber) {
        console.log("commitRoot", currentFiber);
        commitWork(currentFiber);
        currentFiber = currentFiber.nextEffect;
    }
    /*删除数组清空*/
    deletions.length = 0;
    /*记录已渲染的*/
    currentRoot = workInProgressRoot;
    /*清除已渲染的*/
    workInProgressRoot = null;
}

function commitWork(currentFiber) {
    if (!currentFiber) return;
    /*获取父元素*/
    let returnFiber = currentFiber.return;
    /*Class组节点父元素修正*/
    while (returnFiber.tag !== TAG_HOST
    && returnFiber.tag !== TAG_ROOT) {
        returnFiber = returnFiber.return;
    }
    let domReturn = returnFiber.stateNode;

    /*effect对应处理*/
    if (currentFiber.effectTag === PLACEMENT) {
        /*新加节点*/
        /*Class组件包含的非类组件，针对嵌套的Class组件*/
        let nextFiber = currentFiber;
        while (nextFiber.tag !== TAG_HOST
        && nextFiber.tag !== TAG_TEXT) {
            nextFiber = currentFiber.child;
        }

        domReturn.appendChild(nextFiber.stateNode);
    } else if (currentFiber.effectTag === DELETION) {
        /*删除节点*/
        commitDeletion(currentFiber, domReturn);
    } else if (currentFiber.effectTag === UPDATE) {
        /*更新节点*/
        if (currentFiber.type === ELEMENT_TEXT) {
            /*文本节点更新*/
            if (currentFiber.alternate.props.text !== currentFiber.props.text) {
                currentFiber.stateNode.textContent = currentFiber.props.text;
            }
        } else {
            if (currentFiber.type === TAG_CLASS || currentFiber.type === TAG_FUNCTION) {
                currentFiber.effectTag = null;
                return;
            }
            updateDOM(
                currentFiber.stateNode,
                currentFiber.alternate.props,
                currentFiber.props,
            )
        }
    }

    currentFiber.effectTag = null;
}

function commitDeletion(currentFiber, domReturn) {
    if (currentFiber.tag !== TAG_HOST
        || currentFiber.tag !== TAG_TEXT) {
        domReturn.removeChild(currentFiber.stateNode);
    } else {
        domReturn.removeChild(currentFiber.child.stateNode);
    }
}


/**
 * useXX基础
 * @param reducer
 * @param initialValue
 */
export function useReducer(reducer, initialValue) {
    let oldHook = workInProgressFiber.alternate
        && workInProgressFiber.alternate.hooks
        && workInProgressFiber.alternate.hooks[hookIndex];

    let newHook;
    if (oldHook) {
        /*读取旧的计算后的状态*/
        oldHook.state = oldHook.updateQueue.forceUpdate(oldHook.state);
        newHook = oldHook;
    } else {
        newHook = {
            state: initialValue,
            updateQueue: new UpdateQueue()
        }
    }

    console.log("hook1", newHook);
    const dispatch = action => {
        let payload = reducer
            ? reducer(newHook.state, action)
            : action;

        newHook.updateQueue.enqueueUpdate(
            new Update(payload)
        );
        console.log("dispatch", newHook);
        /*每次更新都开始调度*/
        scheduleRoot();
    };

    /*记录hook*/
    workInProgressFiber.hooks[hookIndex] = newHook;
    hookIndex = hookIndex + 1;
    /*state,dispatch*/
    return [newHook.state, dispatch];
}

export function useState(initialValue) {
    return useReducer(null, initialValue);
}



