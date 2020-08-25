##  jsx
``` 
let element = (
    <div id="A1">
        <div id="B1">
            <div id="C1">C1</div>
            <div id="C2">C2</div>
        </div>
        <div id="B2"></div>
    </div>
)
```

```json 
 {
  "type": "div",
  "key": null,
  "ref": null,
  "props": {
    "id": "A1",
    "children": [
      {
        "type": "div",
        "key": null,
        "ref": null,
        "props": {
          "id": "B1",
          "children": [
            {
              "type": "div",
              "key": null,
              "ref": null,
              "props": {
                "id": "C1"
              },
              "_owner": null,
              "_store": {}
            },
            {
              "type": "div",
              "key": null,
              "ref": null,
              "props": {
                "id": "C2"
              },
              "_owner": null,
              "_store": {}
            }
          ]
        },
        "_owner": null,
        "_store": {}
      },
      {
        "type": "div",
        "key": null,
        "ref": null,
        "props": {
          "id": "B2"
        },
        "_owner": null,
        "_store": {}
      }
    ]
  },
  "_owner": null,
  "_store": {}
}
```


##  自定义createElement
``` 
var element = React.createElement(
    "div",
    {id:"A1"},
    React.createElement(
        "div",
        {id:"B1"},
        React.createElement("div",{id:"C1"}),
        React.createElement("div",{id:"C2"})
    ),
    React.createElement(
        "div",
        {id:"B2"}
    )
);
```
```json
{
  "type": "div",
  "props": {
    "id": "A1",
    "children": [
      {
        "type": "div",
        "props": {
          "id": "B1",
          "children": [
            {
              "type": "div",
              "props": {
                "id": "C1",
                "children": [
                  {
                    "props": {
                      "text": "C1",
                      "children": []
                    }
                  }
                ]
              }
            },
            {
              "type": "div",
              "props": {
                "id": "C2",
                "children": [
                  {
                    "props": {
                      "text": "C2",
                      "children": []
                    }
                  }
                ]
              }
            }
          ]
        }
      },
      {
        "type": "div",
        "props": {
          "id": "B2",
          "children": []
        }
      }
    ]
  }
}
```
