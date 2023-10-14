"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[2542],{6593:(e,t,n)=>{n.d(t,{Zo:()=>c,kt:()=>f});var a=n(1644);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function l(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function o(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?l(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):l(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function u(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},l=Object.keys(e);for(a=0;a<l.length;a++)n=l[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(a=0;a<l.length;a++)n=l[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var i=a.createContext({}),s=function(e){var t=a.useContext(i),n=t;return e&&(n="function"==typeof e?e(t):o(o({},t),e)),n},c=function(e){var t=s(e.components);return a.createElement(i.Provider,{value:t},e.children)},d="mdxType",p={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},m=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,l=e.originalType,i=e.parentName,c=u(e,["components","mdxType","originalType","parentName"]),d=s(n),m=r,f=d["".concat(i,".").concat(m)]||d[m]||p[m]||l;return n?a.createElement(f,o(o({ref:t},c),{},{components:n})):a.createElement(f,o({ref:t},c))}));function f(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var l=n.length,o=new Array(l);o[0]=m;var u={};for(var i in t)hasOwnProperty.call(t,i)&&(u[i]=t[i]);u.originalType=e,u[d]="string"==typeof e?e:r,o[1]=u;for(var s=2;s<l;s++)o[s]=n[s];return a.createElement.apply(null,o)}return a.createElement.apply(null,n)}m.displayName="MDXCreateElement"},7026:(e,t,n)=>{n.d(t,{Z:()=>o});var a=n(1644),r=n(156);const l={tabItem:"tabItem_hFhF"};function o(e){let{children:t,hidden:n,className:o}=e;return a.createElement("div",{role:"tabpanel",className:(0,r.Z)(l.tabItem,o),hidden:n},t)}},6663:(e,t,n)=>{n.d(t,{Z:()=>N});var a=n(373),r=n(1644),l=n(156),o=n(1476),u=n(2824),i=n(9643),s=n(7190),c=n(6985);function d(e){return function(e){return r.Children.map(e,(e=>{if(!e||(0,r.isValidElement)(e)&&function(e){const{props:t}=e;return!!t&&"object"==typeof t&&"value"in t}(e))return e;throw new Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)}))?.filter(Boolean)??[]}(e).map((e=>{let{props:{value:t,label:n,attributes:a,default:r}}=e;return{value:t,label:n,attributes:a,default:r}}))}function p(e){const{values:t,children:n}=e;return(0,r.useMemo)((()=>{const e=t??d(n);return function(e){const t=(0,s.l)(e,((e,t)=>e.value===t.value));if(t.length>0)throw new Error(`Docusaurus error: Duplicate values "${t.map((e=>e.value)).join(", ")}" found in <Tabs>. Every value needs to be unique.`)}(e),e}),[t,n])}function m(e){let{value:t,tabValues:n}=e;return n.some((e=>e.value===t))}function f(e){let{queryString:t=!1,groupId:n}=e;const a=(0,u.k6)(),l=function(e){let{queryString:t=!1,groupId:n}=e;if("string"==typeof t)return t;if(!1===t)return null;if(!0===t&&!n)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return n??null}({queryString:t,groupId:n});return[(0,i._X)(l),(0,r.useCallback)((e=>{if(!l)return;const t=new URLSearchParams(a.location.search);t.set(l,e),a.replace({...a.location,search:t.toString()})}),[l,a])]}function b(e){const{defaultValue:t,queryString:n=!1,groupId:a}=e,l=p(e),[o,u]=(0,r.useState)((()=>function(e){let{defaultValue:t,tabValues:n}=e;if(0===n.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(t){if(!m({value:t,tabValues:n}))throw new Error(`Docusaurus error: The <Tabs> has a defaultValue "${t}" but none of its children has the corresponding value. Available values are: ${n.map((e=>e.value)).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);return t}const a=n.find((e=>e.default))??n[0];if(!a)throw new Error("Unexpected error: 0 tabValues");return a.value}({defaultValue:t,tabValues:l}))),[i,s]=f({queryString:n,groupId:a}),[d,b]=function(e){let{groupId:t}=e;const n=function(e){return e?`docusaurus.tab.${e}`:null}(t),[a,l]=(0,c.Nk)(n);return[a,(0,r.useCallback)((e=>{n&&l.set(e)}),[n,l])]}({groupId:a}),h=(()=>{const e=i??d;return m({value:e,tabValues:l})?e:null})();(0,r.useLayoutEffect)((()=>{h&&u(h)}),[h]);return{selectedValue:o,selectValue:(0,r.useCallback)((e=>{if(!m({value:e,tabValues:l}))throw new Error(`Can't select invalid tab value=${e}`);u(e),s(e),b(e)}),[s,b,l]),tabValues:l}}var h=n(8810);const v={tabList:"tabList_A6Ol",tabItem:"tabItem_djxK"};function k(e){let{className:t,block:n,selectedValue:u,selectValue:i,tabValues:s}=e;const c=[],{blockElementScrollPositionUntilNextRender:d}=(0,o.o5)(),p=e=>{const t=e.currentTarget,n=c.indexOf(t),a=s[n].value;a!==u&&(d(t),i(a))},m=e=>{let t=null;switch(e.key){case"Enter":p(e);break;case"ArrowRight":{const n=c.indexOf(e.currentTarget)+1;t=c[n]??c[0];break}case"ArrowLeft":{const n=c.indexOf(e.currentTarget)-1;t=c[n]??c[c.length-1];break}}t?.focus()};return r.createElement("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,l.Z)("tabs",{"tabs--block":n},t)},s.map((e=>{let{value:t,label:n,attributes:o}=e;return r.createElement("li",(0,a.Z)({role:"tab",tabIndex:u===t?0:-1,"aria-selected":u===t,key:t,ref:e=>c.push(e),onKeyDown:m,onClick:p},o,{className:(0,l.Z)("tabs__item",v.tabItem,o?.className,{"tabs__item--active":u===t})}),n??t)})))}function g(e){let{lazy:t,children:n,selectedValue:a}=e;const l=(Array.isArray(n)?n:[n]).filter(Boolean);if(t){const e=l.find((e=>e.props.value===a));return e?(0,r.cloneElement)(e,{className:"margin-top--md"}):null}return r.createElement("div",{className:"margin-top--md"},l.map(((e,t)=>(0,r.cloneElement)(e,{key:t,hidden:e.props.value!==a}))))}function y(e){const t=b(e);return r.createElement("div",{className:(0,l.Z)("tabs-container",v.tabList)},r.createElement(k,(0,a.Z)({},e,t)),r.createElement(g,(0,a.Z)({},e,t)))}function N(e){const t=(0,h.Z)();return r.createElement(y,(0,a.Z)({key:String(t)},e))}},7015:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>i,default:()=>f,frontMatter:()=>u,metadata:()=>s,toc:()=>d});var a=n(373),r=(n(1644),n(6593)),l=n(6663),o=n(7026);const u={id:"to-yaml",title:"To YAML Node",sidebar_label:"To YAML"},i=void 0,s={unversionedId:"node-reference/to-yaml",id:"node-reference/to-yaml",title:"To YAML Node",description:"To YAML Node Screenshot",source:"@site/docs/node-reference/to-yaml.mdx",sourceDirName:"node-reference",slug:"/node-reference/to-yaml",permalink:"/docs/node-reference/to-yaml",draft:!1,editUrl:"https://github.com/ironclad/rivet/tree/main/packages/docs/docs/node-reference/to-yaml.mdx",tags:[],version:"current",frontMatter:{id:"to-yaml",title:"To YAML Node",sidebar_label:"To YAML"},sidebar:"nodeReference",previous:{title:"Text",permalink:"/docs/node-reference/text"},next:{title:"To JSON",permalink:"/docs/node-reference/to-json"}},c={},d=[{value:"Overview",id:"overview",level:2},{value:"Inputs",id:"inputs",level:2},{value:"Outputs",id:"outputs",level:2},{value:"Editor Settings",id:"editor-settings",level:2},{value:"Example 1: Convert an object to YAML",id:"example-1-convert-an-object-to-yaml",level:2},{value:"Error Handling",id:"error-handling",level:2},{value:"FAQ",id:"faq",level:2},{value:"See Also",id:"see-also",level:2}],p={toc:d},m="wrapper";function f(e){let{components:t,...u}=e;return(0,r.kt)(m,(0,a.Z)({},p,u,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"To YAML Node Screenshot",src:n(1881).Z,width:"690",height:"384"})),(0,r.kt)("h2",{id:"overview"},"Overview"),(0,r.kt)("p",null,"The To YAML Node is used to convert an object into a YAML string. This can be useful when you need to output your data in a YAML format."),(0,r.kt)(l.Z,{defaultValue:"inputs",values:[{label:"Inputs",value:"inputs"},{label:"Outputs",value:"outputs"},{label:"Editor Settings",value:"settings"}],mdxType:"Tabs"},(0,r.kt)(o.Z,{value:"inputs",mdxType:"TabItem"},(0,r.kt)("h2",{id:"inputs"},"Inputs"),(0,r.kt)("table",null,(0,r.kt)("thead",{parentName:"table"},(0,r.kt)("tr",{parentName:"thead"},(0,r.kt)("th",{parentName:"tr",align:null},"Title"),(0,r.kt)("th",{parentName:"tr",align:null},"Data Type"),(0,r.kt)("th",{parentName:"tr",align:null},"Description"),(0,r.kt)("th",{parentName:"tr",align:null},"Default Value"),(0,r.kt)("th",{parentName:"tr",align:null},"Notes"))),(0,r.kt)("tbody",{parentName:"table"},(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"Object"),(0,r.kt)("td",{parentName:"tr",align:null},(0,r.kt)("inlineCode",{parentName:"td"},"object")),(0,r.kt)("td",{parentName:"tr",align:null},"The object to convert to YAML."),(0,r.kt)("td",{parentName:"tr",align:null},"(required)"),(0,r.kt)("td",{parentName:"tr",align:null}))))),(0,r.kt)(o.Z,{value:"outputs",mdxType:"TabItem"},(0,r.kt)("h2",{id:"outputs"},"Outputs"),(0,r.kt)("table",null,(0,r.kt)("thead",{parentName:"table"},(0,r.kt)("tr",{parentName:"thead"},(0,r.kt)("th",{parentName:"tr",align:null},"Title"),(0,r.kt)("th",{parentName:"tr",align:null},"Data Type"),(0,r.kt)("th",{parentName:"tr",align:null},"Description"),(0,r.kt)("th",{parentName:"tr",align:null},"Notes"))),(0,r.kt)("tbody",{parentName:"table"},(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"YAML"),(0,r.kt)("td",{parentName:"tr",align:null},(0,r.kt)("inlineCode",{parentName:"td"},"string")),(0,r.kt)("td",{parentName:"tr",align:null},"The YAML string representation of the object."),(0,r.kt)("td",{parentName:"tr",align:null}))))),(0,r.kt)(o.Z,{value:"settings",mdxType:"TabItem"},(0,r.kt)("h2",{id:"editor-settings"},"Editor Settings"),(0,r.kt)("p",null,"This node does not have any configurable editor settings."))),(0,r.kt)("h2",{id:"example-1-convert-an-object-to-yaml"},"Example 1: Convert an object to YAML"),(0,r.kt)("ol",null,(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},"Create an ",(0,r.kt)("a",{parentName:"p",href:"/docs/node-reference/object"},"Object Node")," and set the value to the following:"),(0,r.kt)("pre",{parentName:"li"},(0,r.kt)("code",{parentName:"pre",className:"language-json"},'{\n  "name": "Claude Shannon",\n  "occupation": "Computer scientist"\n}\n'))),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},"Create a To YAML Node and connect the Object Node to its ",(0,r.kt)("inlineCode",{parentName:"p"},"Object")," input.")),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},"Run the graph. The To YAML Node should output the following YAML string:"),(0,r.kt)("pre",{parentName:"li"},(0,r.kt)("code",{parentName:"pre",className:"language-yaml"},"name: Claude Shannon\noccupation: Computer scientist\n")),(0,r.kt)("p",{parentName:"li"},"   ",(0,r.kt)("img",{alt:"To YAML Node Example 1",src:n(749).Z,width:"1498",height:"618"})))),(0,r.kt)("h2",{id:"error-handling"},"Error Handling"),(0,r.kt)("p",null,"The To YAML Node will throw an error if the input is not an object."),(0,r.kt)("h2",{id:"faq"},"FAQ"),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},"Q: Can I convert an array to YAML?")),(0,r.kt)("p",null,"A: Yes, you can convert an array to YAML. However, you must first convert the array to an object using the ",(0,r.kt)("a",{parentName:"p",href:"/docs/node-reference/array"},"Array Node"),"."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},"Q: Can I convert a string to YAML?")),(0,r.kt)("p",null,"A: No, you cannot convert a string to YAML. The To YAML Node only accepts objects as input."),(0,r.kt)("h2",{id:"see-also"},"See Also"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/docs/node-reference/to-json"},"To JSON Node")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/docs/node-reference/extract-json"},"Extract JSON Node")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/docs/node-reference/extract-yaml"},"Extract YAML Node")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/docs/node-reference/object"},"Object Node")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/docs/node-reference/array"},"Array Node"))))}f.isMDXComponent=!0},749:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/to-yaml-node-example-01-5a32f94d25d706d07225675f10660194.png"},1881:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/to-yaml-node-39a7470ce793b59c6156eb550c41ed0d.png"}}]);