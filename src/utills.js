import {TAG_HOST, TAG_TEXT} from "./constant";

/**
 * 创建原生节点
 * @param currentFiber
 * @returns {*}
 */
export function createDOM(currentFiber) {
    if (currentFiber.tag === TAG_TEXT) {
        return document.createTextNode(currentFiber.props.text);
    } else if (currentFiber.tag === TAG_HOST) {
        let stateNode = document.createElement(currentFiber.type);
        /*更新DOM的属性*/
        updateDOM(stateNode, {}, currentFiber.props);
        return stateNode;
    }
}

/**
 * 更新DOM节点属性
 * @param stateNode
 * @param oldProps
 * @param newProps
 */
export function updateDOM(stateNode, oldProps, newProps) {
    setProps(stateNode, oldProps, newProps);
}


export function setProps(dom, oldProps, newProps) {
    for (let key in oldProps) {
        if (key !== "children") {
            if (newProps.hasOwnProperty(key)) {
                /*更新属性*/
                setProp(dom, key, newProps[key]);
            } else {
                /*删除属性*/
                dom.removeAttribute(key);
            }
        }
    }

    for (let key in newProps) {
        if (key !== "children") {
            if (!oldProps.hasOwnProperty(key)) {
                /*添加属性*/
                setProp(dom, key, newProps[key]);
            }
        }
    }
}

function setProp(dom, key, value) {
    if (/^on/.test(key)) {
        dom[key.toLowerCase()] = value;
    } else if (key === "style") {
        if (value) {
            for (let styleName in value) {
                dom.style[styleName] = value[styleName];
            }
        }
    } else {
        dom.setAttribute(key, value);
    }
}