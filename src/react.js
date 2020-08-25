import {ELEMENT_TEXT} from "./constant";

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

const React = {
    createElement
}

export default React;