import {ELEMENT_TEXT} from "./constant";
import {Update} from "./UpdateQueue";
import {scheduleRoot, useReducer, useState} from "./scheduler"

function createElement(type, props, ...children) {
    delete props.__self;
    delete props.__source;

    return {
        type,
        props: {
            ...props,
            children: children.map(child => {
                return typeof child === "object"
                    ? child
                    /*text转object结构*/
                    : {type: ELEMENT_TEXT, props: {text: child, children: []}}
            })
        }
    }
}


/*Class组件*/
class Component {
    constructor(props) {
        this.props = props;
    }

    /*更新操作*/
    setState(payload) {
        /*添加更新到更新队列*/
        let update = new Update(payload);
        this.internalFiber.updateQueue.enqueueUpdate(update);
        /*调度执行*/
        scheduleRoot();
    }
}

/*Class组件标志*/
Component._isComponent = {};

/*函数式更新*/


const React = {
    createElement,

    Component,

    useReducer,
    useState
};

export default React;